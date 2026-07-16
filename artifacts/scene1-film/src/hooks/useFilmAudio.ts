import { useEffect, useRef } from 'react';
import { Howl, Howler } from 'howler';

export type FilmTrackId = 'ambient' | 'piano' | 'building' | 'tension' | 'triumph';

const TRACK_VOLUME: Record<FilmTrackId, number> = {
  ambient:  0.30,
  piano:    0.50,
  building: 0.55,
  tension:  0.55,
  triumph:  0.60,
};

const CROSSFADE_MS = 1500;

// Scene key → track mapping
const SCENE_TRACK: Record<string, FilmTrackId> = {
  // Scene 1: quiet rain atmosphere — no melody
  s1_01: 'ambient', s1_02: 'ambient', s1_03: 'ambient', s1_04: 'ambient',
  s1_05: 'ambient', s1_06: 'ambient', s1_07: 'ambient', s1_08: 'ambient',
  s1_09: 'ambient',
  // s1_10: piano begins — the spark
  s1_10: 'piano',
  // Bridge 1
  bridge: 'piano',
  // Scene 2 (canteen decision) shots 1-5: soft piano
  s2_01: 'piano', s2_02: 'piano', s2_03: 'piano', s2_04: 'piano', s2_05: 'piano',
  // Scene 2 shots 6-7 (MD written): strings enter
  s2_06: 'building', s2_07: 'building',
  // Bridge 2
  bridge2: 'building',
  // Scene 3 (discovery): piano + strings building
  s3_01: 'building', s3_02: 'building', s3_03: 'building', s3_04: 'building',
  s3_05: 'building', s3_06: 'building', s3_07: 'building', s3_08: 'building',
  s3_09: 'building', s3_10: 'building',
  // Bridge 3
  bridge3: 'building',
  // Scene 4 (collection): building hope
  s4_01: 'building', s4_02: 'building', s4_03: 'building', s4_04: 'building',
  s4_05: 'building', s4_06: 'building', s4_07: 'building', s4_08: 'building',
  s4_09: 'building', s4_10: 'building', s4_11: 'building',
  end_card2: 'building',
  // Scene 5 (limits of PDFs): tension begins
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
  // Scene 7 (collapse — lowest point): piano returns, sparse
  s7_01: 'piano', s7_02: 'piano', s7_03: 'piano', s7_04: 'piano',
  s7_05: 'piano', s7_06: 'piano', s7_07: 'piano', s7_08: 'piano',
  s7_09: 'piano',
  // Scene 7 recovery (the choice, dawn, MD loads): strings return
  s7_10: 'building', s7_11: 'building', s7_12: 'building', s7_13: 'building',
  // Launch day imminent
  end_card5: 'triumph', bridge9: 'triumph',
  // Scene 9 (launch day): full triumph
  s9_01: 'triumph', s9_02: 'triumph', s9_03: 'triumph', s9_04: 'triumph',
  s9_05: 'triumph', s9_06: 'triumph', s9_07: 'triumph', s9_08: 'triumph',
  s9_09: 'triumph', s9_10: 'triumph', s9_11: 'triumph', s9_12: 'triumph',
  s9_13: 'triumph', s9_14: 'triumph', s9_15: 'triumph', s9_16: 'triumph',
  s9_17: 'triumph',
  end_card6: 'triumph', bridge10: 'triumph',
  // Scene 10 (responsibility): triumph continues
  s10_01: 'triumph', s10_02: 'triumph', s10_03: 'triumph', s10_04: 'triumph',
  s10_05: 'triumph', s10_06: 'triumph', s10_07: 'triumph', s10_08: 'triumph',
  s10_09: 'triumph', s10_10: 'triumph', s10_11: 'triumph', s10_12: 'triumph',
  end_card7: 'triumph', epilogue: 'triumph', end_title: 'triumph',
  // Scene 11 bridge (rain echo from Scene 1 — deliberate callback)
  s11_rain: 'ambient', s11_title: 'ambient',
  // Scene 11 (legacy): triumph
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
  // Scene 12 (anniversary)
  s12_year: 'triumph', s12_01: 'triumph', s12_02: 'triumph', s12_03: 'triumph',
  s12_04: 'triumph', s12_05: 'triumph', s12_06: 'triumph', s12_07: 'triumph',
  s12_08: 'triumph', s12_09: 'triumph', s12_10: 'triumph', s12_final: 'triumph',
  s12_title: 'triumph', s12_last: 'triumph', s12_end: 'triumph',
  // Scene 13 (legacy II): opens with ambient, then piano, then triumph
  s13_open: 'ambient', s13_text1: 'piano',
  s13_01: 'piano', s13_02: 'piano', s13_03: 'piano',
  s13_04: 'triumph', s13_05: 'triumph', s13_06: 'triumph',
};

function resolveTrack(sceneKey: string): FilmTrackId {
  const base = sceneKey.replace(/_r[12]$/, '');
  const direct = SCENE_TRACK[base];
  if (direct) return direct;
  // Prefix fallback for any scenes added in future
  if (/^s(9|1\d)_/.test(base) || /^ep_/.test(base) || /^s12_/.test(base) || /^s13_(0[4-9]|[1-9])/.test(base)) return 'triumph';
  if (/^s[56]_/.test(base)) return 'tension';
  if (/^s[34]_/.test(base)) return 'building';
  if (/^s7_/.test(base)) return 'piano';
  return 'ambient';
}

export function useFilmAudio(currentSceneKey: string, muted: boolean) {
  const BASE = import.meta.env.BASE_URL as string;
  const howlsRef = useRef<Partial<Record<FilmTrackId, Howl>>>({});
  const activeTrackRef = useRef<FilmTrackId | null>(null);
  const mutedRef = useRef(muted);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  mutedRef.current = muted;

  // Lazy Howl factory — stable via closure over refs
  function getHowl(id: FilmTrackId): Howl {
    if (!howlsRef.current[id]) {
      howlsRef.current[id] = new Howl({
        src: [`${BASE}audio/${id}.mp3`],
        loop: true,
        volume: 0,
        preload: true,
        html5: false,
      });
    }
    return howlsRef.current[id]!;
  }

  // Track switch with crossfade
  function switchTrack(newTrack: FilmTrackId) {
    const prev = activeTrackRef.current;
    if (prev === newTrack) return;

    const targetVol = mutedRef.current ? 0 : TRACK_VOLUME[newTrack];

    // Fade out and stop the previous track
    if (prev) {
      const prevHowl = getHowl(prev);
      const currentVol = prevHowl.volume();
      if (currentVol > 0) prevHowl.fade(currentVol, 0, CROSSFADE_MS);
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      stopTimerRef.current = setTimeout(() => {
        if (activeTrackRef.current !== prev) prevHowl.stop();
      }, CROSSFADE_MS + 100);
    }

    activeTrackRef.current = newTrack;
    const howl = getHowl(newTrack);

    // Start playing (Howler autoUnlock handles iOS suspended AudioContext)
    if (!howl.playing()) howl.play();
    howl.fade(howl.volume(), targetVol, CROSSFADE_MS);
  }

  // Resume after AudioContext unlock (iOS first-gesture handling)
  useEffect(() => {
    const tryResume = () => {
      const active = activeTrackRef.current;
      if (!active) return;
      const howl = howlsRef.current[active];
      if (howl && !howl.playing()) {
        howl.play();
        if (!mutedRef.current) howl.fade(howl.volume(), TRACK_VOLUME[active], 800);
      }
    };

    // Howler resumes AudioContext on these events; we piggyback to re-play
    const ctx = Howler.ctx;
    if (ctx) {
      const onStateChange = () => {
        if (ctx.state === 'running') tryResume();
      };
      ctx.addEventListener('statechange', onStateChange);
      // Also try on first user gesture directly
      document.addEventListener('click', tryResume, { once: true, capture: true });
      document.addEventListener('touchstart', tryResume, { once: true, capture: true });
      return () => {
        ctx.removeEventListener('statechange', onStateChange);
        document.removeEventListener('click', tryResume, true);
        document.removeEventListener('touchstart', tryResume, true);
      };
    }
  }, []);

  // Scene change → crossfade to appropriate track
  useEffect(() => {
    switchTrack(resolveTrack(currentSceneKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSceneKey]);

  // Muted toggle → fade volume
  useEffect(() => {
    const active = activeTrackRef.current;
    if (!active) return;
    const howl = getHowl(active);
    const targetVol = muted ? 0 : TRACK_VOLUME[active];
    howl.fade(howl.volume(), targetVol, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      Object.values(howlsRef.current).forEach(h => h?.unload());
      howlsRef.current = {};
      activeTrackRef.current = null;
    };
  }, []);
}
