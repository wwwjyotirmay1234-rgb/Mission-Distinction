import { useEffect, useRef, useState } from 'react';
import { Howl, Howler } from 'howler';

type MelodicTrackId = 'piano' | 'building' | 'tension' | 'triumph';

// ── Volume levels ────────────────────────────────────────────────────────────
const MELODIC_VOL: Record<MelodicTrackId, number> = {
  piano:    0.50,
  building: 0.55,
  tension:  0.55,
  triumph:  0.60,
};

const AMBIENT_MAX = 0.30; // Full rain volume

// ── Ambient layer: rain bed volume per scene ─────────────────────────────────
// Rain plays UNDER the melodic layer — not replaced by it.
function sceneAmbientVol(base: string): number {
  switch (base) {
    // Scene 1 shots 1-9: rain is the ONLY sound
    case 's1_01': case 's1_02': case 's1_03': case 's1_04': case 's1_05':
    case 's1_06': case 's1_07': case 's1_08': case 's1_09':
      return AMBIENT_MAX;
    // s1_10: piano enters, rain continues quieter underneath
    case 's1_10': return 0.12;
    // Bridge: rain fading as piano takes over
    case 'bridge': return 0.04;
    // Scene 11 bridge: deliberate rain echo (full-circle callback to opening)
    case 's11_rain': case 's11_title': return 0.22;
    // Scene 13 open: rain intro before piano
    case 's13_open': return 0.20;
    // All other scenes: no rain
    default: return 0;
  }
}

// ── Melodic layer: which track plays (null = rain-only silence) ───────────────
const SCENE_MELODIC: Record<string, MelodicTrackId | null> = {
  // Scene 1: rain only for shots 1-9; piano enters at shot 10
  s1_01: null, s1_02: null, s1_03: null, s1_04: null, s1_05: null,
  s1_06: null, s1_07: null, s1_08: null, s1_09: null,
  s1_10: 'piano',
  bridge: 'piano',
  // Scene 2 (canteen decision): piano → strings
  s2_01: 'piano', s2_02: 'piano', s2_03: 'piano', s2_04: 'piano', s2_05: 'piano',
  s2_06: 'building', s2_07: 'building',
  bridge2: 'building',
  // Scene 3 (discovery): building hope
  s3_01: 'building', s3_02: 'building', s3_03: 'building', s3_04: 'building',
  s3_05: 'building', s3_06: 'building', s3_07: 'building', s3_08: 'building',
  s3_09: 'building', s3_10: 'building',
  bridge3: 'building',
  // Scene 4 (collection)
  s4_01: 'building', s4_02: 'building', s4_03: 'building', s4_04: 'building',
  s4_05: 'building', s4_06: 'building', s4_07: 'building', s4_08: 'building',
  s4_09: 'building', s4_10: 'building', s4_11: 'building',
  end_card2: 'building',
  // Scene 5 (limits of PDFs): tension
  s5_01: 'tension', s5_02: 'tension', s5_03: 'tension', s5_04: 'tension',
  s5_05: 'tension', s5_06: 'tension', s5_07: 'tension', s5_08: 'tension',
  s5_09: 'tension', s5_10: 'tension', s5_11: 'tension',
  end_card3: 'tension',
  // Scene 6 (leap of faith): sustained tension
  s6_01: 'tension', s6_02: 'tension', s6_03: 'tension', s6_04: 'tension',
  s6_05: 'tension', s6_06: 'tension', s6_07: 'tension', s6_08: 'tension',
  s6_09: 'tension', s6_10: 'tension', s6_11: 'tension', s6_12: 'tension',
  s6_13: 'tension',
  end_card4: 'tension',
  // Scene 7 (collapse — lowest point): piano returns
  s7_01: 'piano', s7_02: 'piano', s7_03: 'piano', s7_04: 'piano',
  s7_05: 'piano', s7_06: 'piano', s7_07: 'piano', s7_08: 'piano',
  s7_09: 'piano',
  // Scene 7 recovery (the choice, dawn, MD loads): building strings return
  s7_10: 'building', s7_11: 'building', s7_12: 'building', s7_13: 'building',
  // Launch day
  end_card5: 'triumph', bridge9: 'triumph',
  // Scene 9 (launch)
  s9_01: 'triumph', s9_02: 'triumph', s9_03: 'triumph', s9_04: 'triumph',
  s9_05: 'triumph', s9_06: 'triumph', s9_07: 'triumph', s9_08: 'triumph',
  s9_09: 'triumph', s9_10: 'triumph', s9_11: 'triumph', s9_12: 'triumph',
  s9_13: 'triumph', s9_14: 'triumph', s9_15: 'triumph', s9_16: 'triumph',
  s9_17: 'triumph',
  end_card6: 'triumph', bridge10: 'triumph',
  // Scene 10 (responsibility)
  s10_01: 'triumph', s10_02: 'triumph', s10_03: 'triumph', s10_04: 'triumph',
  s10_05: 'triumph', s10_06: 'triumph', s10_07: 'triumph', s10_08: 'triumph',
  s10_09: 'triumph', s10_10: 'triumph', s10_11: 'triumph', s10_12: 'triumph',
  end_card7: 'triumph', epilogue: 'triumph', end_title: 'triumph',
  // Scene 11 bridge: ambient rain echo, NO melodic (deliberate silence)
  s11_rain: null, s11_title: null,
  // Scene 11 (legacy)
  s11_01: 'triumph', s11_02: 'triumph', s11_03: 'triumph', s11_04: 'triumph',
  s11_05: 'triumph', s11_06: 'triumph', s11_07: 'triumph', s11_08: 'triumph',
  s11_09: 'triumph', s11_10: 'triumph', s11_11: 'triumph', s11_12: 'triumph',
  s11_final: 'triumph',
  end_card8: 'triumph', final_quote: 'triumph',
  // Credits: solo piano returns (as noted in script)
  s11_credits: 'piano', s11_end: 'piano',
  // Epilogue
  ep_today: 'triumph', ep_01: 'triumph', ep_02: 'triumph', ep_03: 'triumph',
  ep_04: 'triumph', ep_05: 'triumph', ep_06: 'triumph', ep_07: 'triumph',
  ep_08: 'triumph', ep_09: 'triumph', ep_final: 'triumph',
  ep_title: 'triumph', ep_last: 'triumph', ep_end: 'triumph',
  // Scene 12
  s12_year: 'triumph', s12_01: 'triumph', s12_02: 'triumph', s12_03: 'triumph',
  s12_04: 'triumph', s12_05: 'triumph', s12_06: 'triumph', s12_07: 'triumph',
  s12_08: 'triumph', s12_09: 'triumph', s12_10: 'triumph', s12_final: 'triumph',
  s12_title: 'triumph', s12_last: 'triumph', s12_end: 'triumph',
  // Scene 13: opens with rain+silence, then piano, then triumph
  s13_open: null, s13_text1: 'piano',
  s13_01: 'piano', s13_02: 'piano', s13_03: 'piano',
  s13_04: 'triumph', s13_05: 'triumph', s13_06: 'triumph',
};

function resolveMelodic(sceneKey: string): MelodicTrackId | null {
  const base = sceneKey.replace(/_r[12]$/, '');
  if (base in SCENE_MELODIC) return SCENE_MELODIC[base];
  // Prefix fallback for any future scenes
  if (/^s(9|1\d)_/.test(base) || /^ep_/.test(base) || /^s12_/.test(base)) return 'triumph';
  if (/^s[56]_/.test(base)) return 'tension';
  if (/^s[34]_/.test(base)) return 'building';
  if (/^s7_/.test(base)) return 'piano';
  return null;
}

const CROSSFADE_MS = 1500;

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFilmAudio(
  currentSceneKey: string,
  muted: boolean,
): { needsTap: boolean } {
  const BASE = import.meta.env.BASE_URL as string;

  // Layer 1: ambient rain bed
  const ambientRef = useRef<Howl | null>(null);
  // Layer 2: melodic (piano / building / tension / triumph)
  const melodicHowlsRef = useRef<Partial<Record<MelodicTrackId, Howl>>>({});
  const activeMelodicRef = useRef<MelodicTrackId | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep muted and currentSceneKey in refs so effects don't re-run on them
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const sceneKeyRef = useRef(currentSceneKey);
  sceneKeyRef.current = currentSceneKey;

  // iOS/Safari blocked-autoplay indicator
  const [needsTap, setNeedsTap] = useState(false);

  // ── Howl factories ───────────────────────────────────────────────────────

  function getAmbient(): Howl {
    if (!ambientRef.current) {
      ambientRef.current = new Howl({
        src: [`${BASE}audio/ambient.mp3`],
        loop: true,
        volume: 0,
        preload: true,
        html5: false,
      });
    }
    return ambientRef.current;
  }

  function getMelodic(id: MelodicTrackId): Howl {
    if (!melodicHowlsRef.current[id]) {
      melodicHowlsRef.current[id] = new Howl({
        src: [`${BASE}audio/${id}.mp3`],
        loop: true,
        volume: 0,
        preload: true,
        html5: false,
      });
    }
    return melodicHowlsRef.current[id]!;
  }

  // ── Initialise ambient + iOS detection on mount ──────────────────────────

  useEffect(() => {
    // Creating the first Howl causes Howler to create the AudioContext.
    getAmbient();

    // Check for suspended AudioContext (iOS / Safari autoplay block)
    const ctx = Howler.ctx;
    if (ctx?.state === 'suspended') setNeedsTap(true);

    const onStateChange = () => {
      if (Howler.ctx?.state === 'running') {
        setNeedsTap(false);
        // Restart any tracks that should be playing
        const base = sceneKeyRef.current.replace(/_r[12]$/, '');
        const targetAmbVol = mutedRef.current ? 0 : sceneAmbientVol(base);
        const amb = ambientRef.current;
        if (amb && targetAmbVol > 0 && !amb.playing()) {
          amb.play();
          amb.fade(amb.volume(), targetAmbVol, 800);
        }
        const active = activeMelodicRef.current;
        if (active) {
          const howl = melodicHowlsRef.current[active];
          if (howl && !howl.playing()) {
            howl.play();
            if (!mutedRef.current) howl.fade(howl.volume(), MELODIC_VOL[active], 800);
          }
        }
      }
    };

    // Dismiss hint immediately on first gesture (belt + suspenders with statechange)
    const dismissOnGesture = () => setNeedsTap(false);
    ctx?.addEventListener('statechange', onStateChange);
    document.addEventListener('click', dismissOnGesture, { once: true, capture: true });
    document.addEventListener('touchstart', dismissOnGesture, { once: true, capture: true });

    return () => {
      ctx?.removeEventListener('statechange', onStateChange);
      document.removeEventListener('click', dismissOnGesture, true);
      document.removeEventListener('touchstart', dismissOnGesture, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Scene change → update both layers ────────────────────────────────────

  useEffect(() => {
    const base = currentSceneKey.replace(/_r[12]$/, '');

    // --- Layer 1: Ambient rain bed ---
    const targetAmbVol = muted ? 0 : sceneAmbientVol(base);
    const amb = getAmbient();
    if (targetAmbVol > 0) {
      if (!amb.playing()) amb.play();
      amb.fade(amb.volume(), targetAmbVol, CROSSFADE_MS);
    } else if (amb.volume() > 0) {
      amb.fade(amb.volume(), 0, CROSSFADE_MS);
    }

    // --- Layer 2: Melodic ---
    const newMelodic = resolveMelodic(currentSceneKey);
    const prevMelodic = activeMelodicRef.current;

    if (newMelodic !== prevMelodic) {
      // Fade out previous melodic track
      if (prevMelodic) {
        const prevHowl = melodicHowlsRef.current[prevMelodic];
        if (prevHowl) {
          prevHowl.fade(prevHowl.volume(), 0, CROSSFADE_MS);
          if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
          stopTimerRef.current = setTimeout(() => {
            if (activeMelodicRef.current !== prevMelodic) prevHowl.stop();
          }, CROSSFADE_MS + 100);
        }
      }

      activeMelodicRef.current = newMelodic;

      if (newMelodic) {
        const targetVol = muted ? 0 : MELODIC_VOL[newMelodic];
        const howl = getMelodic(newMelodic);
        if (!howl.playing()) howl.play();
        howl.fade(howl.volume(), targetVol, CROSSFADE_MS);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSceneKey]);

  // ── Muted toggle → adjust both layers' volumes ───────────────────────────

  useEffect(() => {
    const base = sceneKeyRef.current.replace(/_r[12]$/, '');

    // Ambient
    const amb = ambientRef.current;
    if (amb) {
      const ambTarget = muted ? 0 : sceneAmbientVol(base);
      amb.fade(amb.volume(), ambTarget, 400);
    }

    // Melodic
    const active = activeMelodicRef.current;
    if (active) {
      const howl = melodicHowlsRef.current[active];
      if (howl) howl.fade(howl.volume(), muted ? 0 : MELODIC_VOL[active], 400);
    }
  }, [muted]);

  // ── Cleanup ───────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      ambientRef.current?.unload();
      ambientRef.current = null;
      Object.values(melodicHowlsRef.current).forEach(h => h?.unload());
      melodicHowlsRef.current = {};
      activeMelodicRef.current = null;
    };
  }, []);

  return { needsTap };
}
