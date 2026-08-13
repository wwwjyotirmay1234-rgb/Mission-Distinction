/**
 * Shared AI grading helpers — calls OpenAI directly using your own API key.
 */
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ClinicalFeedback {
  score: number;
  grade: string;
  diagnosis: string;
  pathway: string;
  clinicalCorrelates: string;
  strengths: string[];
  missedPoints: string[];
  verdict: string;
}

function computeGrade(score: number): string {
  if (score >= 8) return "Distinction";
  if (score >= 6) return "Merit";
  if (score >= 4) return "Pass";
  return "Needs Revision";
}

// ─── Clinical Case / Grand Rounds Grading ────────────────────────────────────

export async function gradeClinicalAnswer(
  scenario: string,
  subject: string,
  modelAnswer: string,
  studentAnswer: string
): Promise<ClinicalFeedback | null> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1200,
      messages: [
        {
          role: "system",
          content:
            "You are an experienced medical examiner evaluating MBBS student answers on clinical cases. " +
            "Return ONLY a valid JSON object — no markdown, no extra text.",
        },
        {
          role: "user",
          content:
            `Subject: ${subject}\n` +
            `Clinical Scenario: ${scenario}\n` +
            `Model Answer: ${modelAnswer}\n\n` +
            `Student Answer: ${studentAnswer}\n\n` +
            `Evaluate and return JSON with these exact keys:\n` +
            `{ "score": <0-10>, "diagnosis": "<1-2 sentences>", "pathway": "<1-2 sentences pathophysiology/mechanism>", ` +
            `"clinicalCorrelates": "<1-2 sentences clinical application>", ` +
            `"strengths": ["<point>", ...], "missedPoints": ["<point>", ...], "verdict": "<2-3 sentence overall verdict>" }`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? "";
    const json = JSON.parse(raw.replace(/^```json\s*|```$/g, ""));

    const score = Math.min(10, Math.max(0, Math.round(Number(json.score) || 0)));
    return {
      score,
      grade: computeGrade(score),
      diagnosis: String(json.diagnosis ?? ""),
      pathway: String(json.pathway ?? ""),
      clinicalCorrelates: String(json.clinicalCorrelates ?? ""),
      strengths: Array.isArray(json.strengths) ? json.strengths.map(String).slice(0, 5) : [],
      missedPoints: Array.isArray(json.missedPoints) ? json.missedPoints.map(String).slice(0, 5) : [],
      verdict: String(json.verdict ?? ""),
    };
  } catch (err) {
    console.error("[aiGrading] gradeClinicalAnswer failed:", err);
    return null;
  }
}

// ─── Doubt Auto-Answer ────────────────────────────────────────────────────────

export async function generateDoubtAnswer(
  subject: string,
  title: string,
  question: string
): Promise<string | null> {
  try {
    const prompt =
      `Subject: ${subject}\nQuestion: ${title}` +
      (question && question !== title ? `\nDetails: ${question}` : "");

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 600,
      messages: [
        {
          role: "system",
          content:
            "You are an expert MBBS tutor helping first-year medical students. " +
            "Give a clear, accurate answer focused on key concepts, mechanisms, and clinical relevance. " +
            "Write 3-5 short paragraphs. Use plain text, no markdown or bullet points.",
        },
        { role: "user", content: prompt },
      ],
    });

    const answer = response.choices[0]?.message?.content?.trim() ?? "";
    return answer.length > 10 ? answer : null;
  } catch (err) {
    console.error("[aiGrading] generateDoubtAnswer failed:", err);
    return null;
  }
}

// ─── Quiz Wrong-Answer Explanation ───────────────────────────────────────────

export async function explainQuizAnswer(
  questionText: string,
  correctAnswerLabel: string,
  studentAnswerLabel: string,
  existingExplanation: string | null
): Promise<string | null> {
  try {
    const wasWrong = correctAnswerLabel !== studentAnswerLabel;
    const prompt =
      `Question: ${questionText}\n` +
      `Correct answer: ${correctAnswerLabel}\n` +
      (wasWrong ? `Student answered: ${studentAnswerLabel}\n` : "") +
      (existingExplanation ? `Hint: ${existingExplanation}\n` : "") +
      `\nExplain in 3–5 sentences why "${correctAnswerLabel}" is correct` +
      (wasWrong ? `, and why "${studentAnswerLabel}" is incorrect.` : `.`) +
      ` Use medical reasoning, pathophysiology, or clinical logic appropriate for an MBBS student.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 400,
      messages: [
        {
          role: "system",
          content:
            "You are an MBBS tutor. Explain quiz answers clearly and educationally. " +
            "Write plain text, no markdown. Be concise: 3–5 sentences only.",
        },
        { role: "user", content: prompt },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim() ?? "";
    return text.length > 10 ? text : null;
  } catch (err) {
    console.error("[aiGrading] explainQuizAnswer failed:", err);
    return null;
  }
}
