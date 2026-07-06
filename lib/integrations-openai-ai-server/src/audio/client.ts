import OpenAI, { toFile } from "openai";
import { Buffer } from "node:buffer";
import { spawn } from "child_process";
import { writeFile, unlink, readFile } from "fs/promises";
import { randomUUID } from "crypto";
import { tmpdir } from "os";
import { join } from "path";

if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
  throw new Error(
    "AI_INTEGRATIONS_OPENAI_BASE_URL must be set. Did you forget to provision the OpenAI AI integration?",
  );
}

if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
  throw new Error(
    "AI_INTEGRATIONS_OPENAI_API_KEY must be set. Did you forget to provision the OpenAI AI integration?",
  );
}

export const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export type AudioFormat = "wav" | "mp3" | "webm" | "mp4" | "ogg" | "unknown";

/**
 * Detect audio format from buffer magic bytes.
 * Supports: WAV, MP3, WebM (Chrome/Firefox), MP4/M4A/MOV (Safari/iOS), OGG
 */
export function detectAudioFormat(buffer: Buffer): AudioFormat {
  if (buffer.length < 12) return "unknown";

  // WAV: RIFF....WAVE
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    return "wav";
  }
  // WebM: EBML header
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return "webm";
  }
  // MP3: ID3 tag or frame sync
  if (
    (buffer[0] === 0xff && (buffer[1] === 0xfb || buffer[1] === 0xfa || buffer[1] === 0xf3)) ||
    (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33)
  ) {
    return "mp3";
  }
  // MP4/M4A/MOV: ....ftyp (Safari/iOS records in these containers)
  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    return "mp4";
  }
  // OGG: OggS
  if (buffer[0] === 0x4f && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
    return "ogg";
  }
  return "unknown";
}

/**
 * Convert any audio/video format to WAV using ffmpeg.
 */
export async function convertToWav(audioBuffer: Buffer): Promise<Buffer> {
  const inputPath = join(tmpdir(), `input-${randomUUID()}`);
  const outputPath = join(tmpdir(), `output-${randomUUID()}.wav`);

  try {
    await writeFile(inputPath, audioBuffer);

    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i", inputPath,
        "-vn",
        "-f", "wav",
        "-ar", "16000",
        "-ac", "1",
        "-acodec", "pcm_s16le",
        "-y",
        outputPath,
      ]);

      ffmpeg.stderr.on("data", () => {});
      ffmpeg.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`ffmpeg exited with code ${code}`));
      });
      ffmpeg.on("error", reject);
    });

    return await readFile(outputPath);
  } finally {
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}

/**
 * Auto-detect and convert audio to OpenAI-compatible format.
 */
export async function ensureCompatibleFormat(
  audioBuffer: Buffer
): Promise<{ buffer: Buffer; format: "wav" | "mp3" }> {
  const detected = detectAudioFormat(audioBuffer);
  if (detected === "wav") return { buffer: audioBuffer, format: "wav" };
  if (detected === "mp3") return { buffer: audioBuffer, format: "mp3" };
  const wavBuffer = await convertToWav(audioBuffer);
  return { buffer: wavBuffer, format: "wav" };
}

/**
 * Detect whether an audio clip is effectively silent (no real speech captured).
 *
 * Speech-to-text models (including gpt-4o-mini-transcribe) are known to "hallucinate" a
 * plausible-sounding transcript when fed silent or near-silent audio, instead of returning
 * an empty string. That hallucinated text would otherwise look like a real (and sometimes
 * scoreable) student answer. Running ffmpeg's volumedetect filter lets us catch this case
 * *before* calling the transcription API, so callers can treat it as "no answer" up front.
 */
export async function isSilentAudio(audioBuffer: Buffer, format: string = "wav"): Promise<boolean> {
  // Use PEAK volume (max_volume), not the clip-wide mean. A real spoken answer
  // almost always has thinking pauses, mic-click lead-in/out, and gaps between
  // sentences — those silent stretches drag the whole-clip mean_volume down a
  // lot even when the person clearly spoke, causing real answers to be wrongly
  // rejected as "no speech detected" (which looked like the examiner "asking
  // the same question again" since the turn never advanced). max_volume only
  // cares whether the mic ever picked up a real speech peak, so it isn't
  // fooled by silence padding around the actual answer.
  const SILENCE_MAX_VOLUME_DB = -40;
  const inputPath = join(tmpdir(), `silence-check-${randomUUID()}.${format}`);
  try {
    await writeFile(inputPath, audioBuffer);
    const stderrOutput = await new Promise<string>((resolve, reject) => {
      let out = "";
      const ffmpeg = spawn("ffmpeg", ["-i", inputPath, "-af", "volumedetect", "-f", "null", "-"]);
      ffmpeg.stderr.on("data", (d) => {
        out += d.toString();
      });
      ffmpeg.on("close", () => resolve(out));
      ffmpeg.on("error", reject);
    });
    const match = stderrOutput.match(/max_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/);
    if (!match) return false;
    const maxVolumeDb = parseFloat(match[1]);
    return maxVolumeDb < SILENCE_MAX_VOLUME_DB;
  } catch (err) {
    console.error("Audio silence detection failed, allowing transcription to proceed", err);
    return false;
  } finally {
    await unlink(inputPath).catch(() => {});
  }
}

/**
 * Detect a hallucinated speech-to-text transcript that slipped past the pre-transcription
 * silence check.
 *
 * `isSilentAudio` screens out clips with no real peak volume, but low-level room noise, mic
 * hiss, or a faint tap can sit just above that threshold while still containing no actual
 * speech. In that situation gpt-4o-mini-transcribe doesn't return empty text — it fabricates
 * a short, repetitive "filler" transcript (e.g. "Non, non, non, non, non, non, non." or
 * "Thank you. Thank you. Thank you.") that looks like a real (and scoreable) answer but
 * isn't. Flag transcripts dominated by a single repeated word OR a single repeated short
 * sentence/phrase so callers can treat them as "no answer" instead of grading them.
 */
export function isHallucinatedTranscript(text: string): boolean {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 4) {
    const wordCounts = new Map<string, number>();
    for (const word of words) wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
    const maxWordCount = Math.max(...wordCounts.values());
    if (maxWordCount / words.length >= 0.7) return true;
  }

  const sentences = text
    .toLowerCase()
    .split(/[.!?]+/)
    .map((s) => s.replace(/[^\p{L}\p{N}\s]/gu, "").trim())
    .filter(Boolean);
  if (sentences.length >= 3) {
    const sentenceCounts = new Map<string, number>();
    for (const sentence of sentences) sentenceCounts.set(sentence, (sentenceCounts.get(sentence) ?? 0) + 1);
    const maxSentenceCount = Math.max(...sentenceCounts.values());
    if (maxSentenceCount / sentences.length >= 0.7) return true;
  }

  return false;
}

/** Voice Chat: audio-in, audio-out using gpt-audio. */
export async function voiceChat(
  audioBuffer: Buffer,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy",
  inputFormat: "wav" | "mp3" = "wav",
  outputFormat: "wav" | "mp3" = "mp3"
): Promise<{ transcript: string; audioResponse: Buffer }> {
  const audioBase64 = audioBuffer.toString("base64");
  const response = await openai.chat.completions.create({
    model: "gpt-audio",
    modalities: ["text", "audio"],
    audio: { voice, format: outputFormat },
    messages: [{
      role: "user",
      content: [
        { type: "input_audio", input_audio: { data: audioBase64, format: inputFormat } },
      ],
    }],
  });
  const message = response.choices[0]?.message as any;
  const transcript = message?.audio?.transcript || message?.content || "";
  const audioData = message?.audio?.data ?? "";
  return {
    transcript,
    audioResponse: Buffer.from(audioData, "base64"),
  };
}

/** Streaming Voice Chat for real-time audio responses. */
export async function voiceChatStream(
  audioBuffer: Buffer,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy",
  inputFormat: "wav" | "mp3" = "wav"
): Promise<AsyncIterable<{ type: "transcript" | "audio"; data: string }>> {
  const audioBase64 = audioBuffer.toString("base64");
  const stream = await openai.chat.completions.create({
    model: "gpt-audio",
    modalities: ["text", "audio"],
    audio: { voice, format: "pcm16" },
    messages: [{
      role: "user",
      content: [
        { type: "input_audio", input_audio: { data: audioBase64, format: inputFormat } },
      ],
    }],
    stream: true,
  });

  return (async function* () {
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta as any;
      if (!delta) continue;
      if (delta?.audio?.transcript) {
        yield { type: "transcript", data: delta.audio.transcript };
      }
      if (delta?.audio?.data) {
        yield { type: "audio", data: delta.audio.data };
      }
    }
  })();
}

/** Text-to-Speech using gpt-audio. */
export async function textToSpeech(
  text: string,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy",
  format: "wav" | "mp3" | "flac" | "opus" | "pcm16" = "wav"
): Promise<Buffer> {
  const response = await openai.chat.completions.create({
    model: "gpt-audio",
    modalities: ["text", "audio"],
    audio: { voice, format },
    messages: [
      { role: "system", content: "You are an assistant that performs text-to-speech." },
      { role: "user", content: `Repeat the following text verbatim: ${text}` },
    ],
  });
  const audioData = (response.choices[0]?.message as any)?.audio?.data ?? "";
  return Buffer.from(audioData, "base64");
}

/** Streaming Text-to-Speech. */
export async function textToSpeechStream(
  text: string,
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" = "alloy"
): Promise<AsyncIterable<string>> {
  const stream = await openai.chat.completions.create({
    model: "gpt-audio",
    modalities: ["text", "audio"],
    audio: { voice, format: "pcm16" },
    messages: [
      { role: "system", content: "You are an assistant that performs text-to-speech." },
      { role: "user", content: `Repeat the following text verbatim: ${text}` },
    ],
    stream: true,
  });

  return (async function* () {
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta as any;
      if (!delta) continue;
      if (delta?.audio?.data) {
        yield delta.audio.data;
      }
    }
  })();
}

/**
 * Speech-to-Text using gpt-4o-mini-transcribe.
 *
 * `language` should be an ISO-639-1 code (e.g. "en"). Without it, the model
 * auto-detects language from the audio and can misidentify short/noisy/faint
 * clips as a non-English language, then transcribes plausible-sounding but
 * wrong text in that language's script (e.g. Urdu) instead of the actual
 * English speech or returning empty text. Pinning the expected language
 * avoids this misdetection for apps where the spoken language is known.
 */
export async function speechToText(
  audioBuffer: Buffer,
  format: "wav" | "mp3" | "webm" = "wav",
  language?: string
): Promise<string> {
  const file = await toFile(audioBuffer, `audio.${format}`);
  const response = await openai.audio.transcriptions.create({
    file,
    model: "gpt-4o-mini-transcribe",
    ...(language ? { language } : {}),
  });
  return response.text;
}

/** Streaming Speech-to-Text. */
export async function speechToTextStream(
  audioBuffer: Buffer,
  format: "wav" | "mp3" | "webm" = "wav",
  language?: string
): Promise<AsyncIterable<string>> {
  const file = await toFile(audioBuffer, `audio.${format}`);
  const stream = await openai.audio.transcriptions.create({
    file,
    model: "gpt-4o-mini-transcribe",
    stream: true,
    ...(language ? { language } : {}),
  });

  return (async function* () {
    for await (const event of stream) {
      if (event.type === "transcript.text.delta") {
        yield event.delta;
      }
    }
  })();
}
