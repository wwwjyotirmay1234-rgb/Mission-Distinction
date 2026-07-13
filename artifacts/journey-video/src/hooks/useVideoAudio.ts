import { useEffect, useRef, useCallback, useState } from 'react';

// ─── Per-scene audio mood ────────────────────────────────────────────────────
// voices: [frequency_multiplier, detune_cents, gain]
// Detune offsets create a rich chorus effect between oscillators.

type VoiceTuple = [number, number, number];

type SceneAudio = {
  rootHz: number;
  voices: VoiceTuple[];
  filterHz: number;
  masterGain: number;
  clockTick: boolean;
  rainNoise: boolean;
};

const SCENES: Record<string, SceneAudio> = {
  s0_coldopen: {
    rootHz: 36.7,      // D1 — cold, fearful
    voices: [
      [1.0,   0,   0.44],
      [1.498, -7,  0.22],   // 5th (A) slightly flat = uneasy
      [2.0,   9,   0.14],
      [2.996, 4,   0.06],
    ],
    filterHz: 260, masterGain: 0.21,
    clockTick: true, rainNoise: true,
  },
  s1_beginning: {
    rootHz: 55,        // A1 — realization rising
    voices: [
      [1.0,   0,   0.38],
      [1.25,  5,   0.20],   // major 3rd — hopeful hint
      [1.498, -4,  0.18],
      [2.0,   7,   0.09],
    ],
    filterHz: 680, masterGain: 0.17,
    clockTick: false, rainNoise: false,
  },
  s2_building: {
    rootHz: 65.4,      // C2 — the spark
    voices: [
      [1.0,   0,   0.40],
      [1.25,  4,   0.22],
      [1.498, -3,  0.17],
      [2.0,   8,   0.10],
    ],
    filterHz: 860, masterGain: 0.18,
    clockTick: false, rainNoise: false,
  },
  s2_workbegins: {
    rootHz: 73.4,      // D2 — determined montage
    voices: [
      [1.0,   0,   0.38],
      [1.498, -5,  0.24],
      [2.0,   7,   0.16],
      [2.996, 3,   0.08],
    ],
    filterHz: 980, masterGain: 0.20,
    clockTick: false, rainNoise: false,
  },
  s3_darknight: {
    rootHz: 43.65,     // F1 — crash/darkness
    voices: [
      [1.0,   0,   0.44],
      [1.189, -9,  0.20],   // minor 3rd (Ab) — dark
      [1.498, 4,   0.16],
      [2.0,   6,   0.08],
    ],
    filterHz: 400, masterGain: 0.21,
    clockTick: false, rainNoise: false,
  },
  s4_progress: {
    rootHz: 49.0,      // G1 — uncertain, fighting
    voices: [
      [1.0,   0,   0.40],
      [1.189, 6,   0.20],
      [1.498, -4,  0.16],
      [2.0,   8,   0.09],
    ],
    filterHz: 500, masterGain: 0.19,
    clockTick: false, rainNoise: false,
  },
  s5_launch: {
    rootHz: 55.0,      // A1 — triumph
    voices: [
      [1.0,   0,   0.40],
      [1.25,  5,   0.28],   // major 3rd = joy
      [1.498, -3,  0.20],
      [2.0,   7,   0.12],
      [2.5,  -5,   0.06],
    ],
    filterHz: 1300, masterGain: 0.23,
    clockTick: false, rainNoise: false,
  },
  s6_climb: {
    rootHz: 73.4,      // D2 — across Odisha
    voices: [
      [1.0,   0,   0.40],
      [1.25,  6,   0.26],
      [1.498, -4,  0.20],
      [2.0,   8,   0.13],
      [3.0,  -3,   0.05],
    ],
    filterHz: 1450, masterGain: 0.22,
    clockTick: false, rainNoise: false,
  },
  s7_foryou: {
    rootHz: 55.0,      // A1 — 500, silence, emotion
    voices: [
      [1.0,   0,   0.34],
      [1.25,  5,   0.22],
      [1.498, -4,  0.16],
      [2.0,   6,   0.08],
    ],
    filterHz: 920, masterGain: 0.16,
    clockTick: false, rainNoise: false,
  },
  s8_outro: {
    rootHz: 73.4,      // D2 — golden network, epic close
    voices: [
      [1.0,   0,   0.42],
      [1.25,  6,   0.28],
      [1.498, -4,  0.22],
      [2.0,   8,   0.14],
      [2.5,  -5,   0.08],
      [3.0,   3,   0.04],
    ],
    filterHz: 1700, masterGain: 0.24,
    clockTick: false, rainNoise: false,
  },
};

const FALLBACK = SCENES.s0_coldopen;
const CROSSFADE_TIME = 2.2;  // seconds for scene crossfade
const TICK_INTERVAL_MS = 1000;

// ─── White noise buffer ───────────────────────────────────────────────────────
function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const len = ctx.sampleRate * 3;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// ─── Clock tick ───────────────────────────────────────────────────────────────
function playTick(ctx: AudioContext, dest: AudioNode) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 820;
  env.gain.setValueAtTime(0, ctx.currentTime);
  env.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
  osc.connect(env);
  env.connect(dest);
  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useVideoAudio(sceneKey: string) {
  const ctxRef        = useRef<AudioContext | null>(null);
  const masterRef     = useRef<GainNode | null>(null);
  const filterRef     = useRef<BiquadFilterNode | null>(null);
  const oscsRef       = useRef<OscillatorNode[]>([]);
  const oscGainsRef   = useRef<GainNode[]>([]);
  const rainSrcRef    = useRef<AudioBufferSourceNode | null>(null);
  const rainGainRef   = useRef<GainNode | null>(null);
  const clockRef      = useRef<number | null>(null);
  const mutedRef      = useRef(false);

  const [started, setStarted]     = useState(false);
  const [muted,   setMutedState]  = useState(false);

  // ── Build oscillator bank for a config ──────────────────────────────────
  const applyConfig = useCallback((config: SceneAudio, instant = false) => {
    const ctx = ctxRef.current;
    const filter = filterRef.current;
    const master = masterRef.current;
    if (!ctx || !filter || !master) return;

    const now = ctx.currentTime;
    const t = instant ? now : now + 0.05;
    const ramp = instant ? 0 : CROSSFADE_TIME;

    // Ramp filter and master gain
    filter.frequency.setTargetAtTime(config.filterHz, t, ramp / 3);
    if (!mutedRef.current) {
      master.gain.setTargetAtTime(config.masterGain, t, ramp / 3);
    }

    // Re-tune existing oscillators if count matches; otherwise rebuild
    if (oscsRef.current.length === config.voices.length) {
      config.voices.forEach(([mult, detune, gain], i) => {
        oscsRef.current[i].frequency.setTargetAtTime(config.rootHz * mult, t, ramp / 4);
        oscsRef.current[i].detune.setTargetAtTime(detune, t, ramp / 4);
        oscGainsRef.current[i].gain.setTargetAtTime(gain, t, ramp / 4);
      });
    } else {
      // Fade out old
      oscGainsRef.current.forEach(g => g.gain.setTargetAtTime(0, t, 0.3));
      setTimeout(() => {
        oscsRef.current.forEach(o => { try { o.stop(); } catch (_) {} });
        oscsRef.current = [];
        oscGainsRef.current = [];
        buildOscillators(config);
      }, (ramp * 1000) / 2);
    }

    // Clock tick
    if (clockRef.current !== null) {
      clearInterval(clockRef.current);
      clockRef.current = null;
    }
    if (config.clockTick) {
      clockRef.current = window.setInterval(() => {
        if (ctxRef.current && !mutedRef.current) {
          playTick(ctxRef.current, filterRef.current!);
        }
      }, TICK_INTERVAL_MS);
    }

    // Rain
    if (rainSrcRef.current) {
      const rg = rainGainRef.current!;
      rg.gain.setTargetAtTime(0, t, 0.5);
      setTimeout(() => {
        rainSrcRef.current?.stop();
        rainSrcRef.current = null;
      }, 1500);
    }
    if (config.rainNoise) {
      const noiseBuf = createNoiseBuffer(ctx);
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;

      const bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 700;
      bpf.Q.value = 0.4;

      const rg = ctx.createGain();
      rg.gain.setValueAtTime(0, t);
      rg.gain.setTargetAtTime(mutedRef.current ? 0 : 0.055, t, 1.0);

      src.connect(bpf);
      bpf.connect(rg);
      rg.connect(master);
      src.start();

      rainSrcRef.current = src;
      rainGainRef.current = rg;
    }
  }, []);

  function buildOscillators(config: SceneAudio) {
    const ctx = ctxRef.current;
    const filter = filterRef.current;
    if (!ctx || !filter) return;

    config.voices.forEach(([mult, detune, gain]) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = config.rootHz * mult;
      osc.detune.value = detune;
      g.gain.value = gain;
      osc.connect(g);
      g.connect(filter);
      osc.start();
      oscsRef.current.push(osc);
      oscGainsRef.current.push(g);
    });
  }

  // ── Start (requires user gesture) ────────────────────────────────────────
  const start = useCallback(() => {
    if (ctxRef.current) {
      ctxRef.current.resume();
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    ctxRef.current = ctx;

    // Chain: oscillators → filter → master → destination
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.9;

    const master = ctx.createGain();
    master.gain.value = 0;

    filter.connect(master);
    master.connect(ctx.destination);

    filterRef.current = filter;
    masterRef.current = master;

    const config = SCENES[sceneKey] ?? FALLBACK;
    filter.frequency.value = config.filterHz;

    buildOscillators(config);

    // Fade master in over 2s
    master.gain.linearRampToValueAtTime(config.masterGain, ctx.currentTime + 2.0);

    // Clock / rain
    if (config.clockTick) {
      clockRef.current = window.setInterval(() => {
        if (!mutedRef.current) playTick(ctx, filter);
      }, TICK_INTERVAL_MS);
    }
    if (config.rainNoise) {
      const noiseBuf = createNoiseBuffer(ctx);
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;
      const bpf = ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 700;
      bpf.Q.value = 0.4;
      const rg = ctx.createGain();
      rg.gain.setValueAtTime(0, ctx.currentTime);
      rg.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 2.0);
      src.connect(bpf);
      bpf.connect(rg);
      rg.connect(master);
      src.start();
      rainSrcRef.current = src;
      rainGainRef.current = rg;
    }

    setStarted(true);
  }, [sceneKey]);

  // ── Mute / unmute ─────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;

    const newMuted = !mutedRef.current;
    mutedRef.current = newMuted;
    setMutedState(newMuted);

    const now = ctx.currentTime;
    if (newMuted) {
      master.gain.setTargetAtTime(0, now, 0.15);
    } else {
      const config = SCENES[sceneKey] ?? FALLBACK;
      master.gain.setTargetAtTime(config.masterGain, now, 0.3);
    }
  }, [sceneKey]);

  // ── React to scene changes ────────────────────────────────────────────────
  useEffect(() => {
    if (!ctxRef.current) return;
    const baseKey = sceneKey.replace(/_r[12]$/, '');
    const config = SCENES[baseKey] ?? FALLBACK;
    applyConfig(config);
  }, [sceneKey, applyConfig]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (clockRef.current !== null) clearInterval(clockRef.current);
      oscsRef.current.forEach(o => { try { o.stop(); } catch (_) {} });
      rainSrcRef.current?.stop();
      ctxRef.current?.close();
    };
  }, []);

  return { started, muted, start, toggleMute };
}
