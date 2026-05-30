// src/lib/themeAudio.js
//
// Shared theme-audio utility for the four IP brand sites
// (Fuglys / Labrats / Biker Babies / Cats On Crack).
//
// v3.2 — 2026-05-30 — Labrats: user-facing volume slider wired up. DEFAULT_VOLUME
//   raised 0.25 -> 0.6 (used for new visitors / no saved value); returning
//   visitors keep their own saved level, now adjustable live via the slider in
//   the expanded player. Supersedes the interim v3.1 volume floor, which has been
//   removed — with a slider it would have fought a user deliberately turning the
//   volume down. NB: Labrats repo copy only; Fuglys / Biker Babies / Cats On
//   Crack copies are untouched and still default to 0.25.
//
// v3 — 2026-04-30 — adds seek + progress public APIs for Labrats v1.3:
//   - seek(seconds) — jump to position (clamped to track duration)
//   - getDuration() — total track length in seconds (0 until loaded)
//   - getCurrentTime() — current playback position
//   - onProgress(current, duration) callback in config — fires from the
//     position tracker (once per second during playback)
// All v2 behaviour (state reset on init, first-play-only seek) preserved.
// Backward-compatible — existing Fuglys component continues to work without
// using the new APIs.
//
// v2 — 2026-04-29 — fixes for cross-page UX:
//   1. Reset state to 'idle' on init if the persisted state was active playback.
//      Browser autoplay policy means audio cannot legally auto-resume across a
//      page reload without a fresh user click. Previous version showed the
//      'playing' label on the new page even though no sound was playing — fixed.
//      Position is still preserved separately so a single click resumes from
//      where the user left off.
//   2. Seek to persisted position only on the FIRST play of a session, not on
//      every play. Previous version seeked to the cross-session resume point
//      every time the user clicked play — including pause-resume within a
//      single page, which would jump back to the saved-from-previous-session
//      position. Within a session we now let Howler's own pause/resume handle
//      position tracking.
//
// Reference build: written for Fuglys, designed to be copied across to the
// other three brand repos without modification. Each brand component imports
// `createThemeAudio(config)` and passes its own brand config (namespace, audio
// src, suppression paths, ARIA brand label, optional onProgress callback).
//
// Uses Howler.js (npm install howler).
//
// State machine:
//   'idle'      → control visible, no audio loaded yet (lazy-load on first click)
//   'playing'   → track plays through once
//   'ended'     → track finished, replay affordance shown
//   'replaying' → user clicked replay on ended state (collapses to 'playing')
//
// Persistence:
//   - Track position (seconds) stored in localStorage so audio can resume
//     across page navigation.
//   - State persists for 24 hours OR until browser close (whichever first).
//   - All keys namespaced per brand (`fuglys_theme_*`, `labrats_theme_*`, etc.)
//
// Suppression:
//   - On entering a suppressed route while playing: 0.5s fade out, position
//     persisted, UI hidden.
//   - On exit back to a non-suppressed route: UI fades back in IDLE state.
//     User must click again — browser autoplay policy compliance.

import { Howl } from 'howler';

// ─── Constants ─────────────────────────────────────────────────────────────

const DEFAULT_VOLUME = 0.6;           // 60% — raised from 0.25 (was too quiet)
const SUPPRESSION_FADE_MS = 500;       // 0.5s per brief
const STATE_TTL_MS = 24 * 60 * 60_000; // 24 hours per brief
const POSITION_THROTTLE_MS = 1000;     // write position to localStorage no more than once/sec

// ─── Storage helpers (per-brand namespacing) ───────────────────────────────

function makeStorage(namespace) {
  const k = (suffix) => `${namespace}_theme_${suffix}`;
  const safeGet = (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  };
  const safeSet = (key, value) => {
    try { localStorage.setItem(key, value); } catch { /* private mode etc. — no-op */ }
  };
  const safeRemove = (key) => {
    try { localStorage.removeItem(key); } catch { /* no-op */ }
  };

  return {
    readState() {
      const raw = safeGet(k('state'));
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        // expire after TTL
        if (Date.now() - (parsed.savedAt || 0) > STATE_TTL_MS) {
          safeRemove(k('state'));
          return null;
        }
        return parsed;
      } catch {
        safeRemove(k('state'));
        return null;
      }
    },
    writeState(state) {
      safeSet(k('state'), JSON.stringify({ ...state, savedAt: Date.now() }));
    },
    clearState() {
      safeRemove(k('state'));
    },
  };
}

// ─── Suppression matcher ──────────────────────────────────────────────────

function isSuppressed(pathname, patterns) {
  if (!patterns || patterns.length === 0) return false;
  return patterns.some((p) => p.test(pathname));
}

// ─── Howl factory (lazy) ──────────────────────────────────────────────────

function buildHowl({ src, volume, onEnd }) {
  return new Howl({
    src: [src],
    html5: true,         // streams from CDN, doesn't load whole file into memory
    preload: 'metadata', // bytes only fetched on first play()
    volume,
    onend: onEnd,
  });
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Create a theme-audio controller for a brand.
 *
 * @param {Object} config
 * @param {string} config.namespace            e.g. 'fuglys' | 'labrats' | 'coc' | 'bb'
 * @param {string} config.src                  CDN URL of the .mp3
 * @param {RegExp[]} config.suppressionPaths   Routes where the control hides
 * @param {(state: string) => void} config.onStateChange  Render callback (state machine state changed)
 * @param {(volume: number) => void} [config.onVolumeChange]  Optional volume render callback
 * @param {(current: number, duration: number) => void} [config.onProgress]  Optional — fires ~1Hz during playback (v3)
 * @returns {Object} controller with play/pause/replay/setVolume/seek/getDuration/getCurrentTime/destroy + getters
 */
export function createThemeAudio(config) {
  const { namespace, src, suppressionPaths, onStateChange, onVolumeChange, onProgress } = config;

  const storage = makeStorage(namespace);
  const persisted = storage.readState() || {};

  let howl = null;                 // lazy — built on first user interaction
  // v2 fix #1: reset active-playback states to 'idle' on init (browser autoplay
  // policy means we can't legally auto-resume — show the play affordance instead).
  // 'ended' state is preserved (replay affordance still relevant).
  const persistedState = persisted.state;
  let state =
    (persistedState === 'playing' || persistedState === 'replaying')
      ? 'idle'
      : (persistedState || 'idle');
  let volume = typeof persisted.volume === 'number' ? persisted.volume : DEFAULT_VOLUME;
  let lastPositionWrite = 0;
  let positionInterval = null;
  let suppressed = false;
  let destroyed = false;
  // v2 fix #2: only seek to the persisted position on the FIRST play of this
  // session. After that, Howler's own pause/resume manages position naturally.
  let hasSeekedToPersistedPosition = false;

  // ── State helpers ────────────────────────────────────────────────────────

  function setState(next) {
    if (state === next) return;
    state = next;
    storage.writeState({ state, volume, position: getPosition() });
    onStateChange(state);
  }

  function getPosition() {
    if (!howl) return persisted.position || 0;
    try {
      const t = howl.seek();
      return typeof t === 'number' ? t : 0;
    } catch {
      return 0;
    }
  }

  function getDurationInternal() {
    if (!howl) return 0;
    try {
      const d = howl.duration();
      return typeof d === 'number' && d > 0 ? d : 0;
    } catch {
      return 0;
    }
  }

  function fireProgress() {
    if (!onProgress) return;
    const cur = getPosition();
    const dur = getDurationInternal();
    onProgress(cur, dur);
  }

  function startPositionTracker() {
    stopPositionTracker();
    // fire once immediately so the UI doesn't wait for the first tick
    fireProgress();
    positionInterval = setInterval(() => {
      if (state !== 'playing' && state !== 'replaying') return;
      const now = Date.now();
      if (now - lastPositionWrite < POSITION_THROTTLE_MS) return;
      lastPositionWrite = now;
      storage.writeState({ state, volume, position: getPosition() });
      fireProgress();
    }, POSITION_THROTTLE_MS);
  }

  function stopPositionTracker() {
    if (positionInterval) {
      clearInterval(positionInterval);
      positionInterval = null;
    }
  }

  // ── Howl init (lazy) ─────────────────────────────────────────────────────

  function ensureHowl() {
    if (howl || destroyed) return howl;
    howl = buildHowl({
      src,
      volume,
      onEnd: () => {
        stopPositionTracker();
        storage.writeState({ state: 'ended', volume, position: 0 });
        setState('ended');
        // fire one final progress event so the UI shows complete
        fireProgress();
      },
    });
    return howl;
  }

  // ── Public actions ───────────────────────────────────────────────────────

  function play() {
    if (suppressed || destroyed) return;
    ensureHowl();
    if (!howl) return;
    // v2 fix #2: only seek to persisted position on first play of this session
    if (!hasSeekedToPersistedPosition && state !== 'ended') {
      const resumeAt = persisted.position || 0;
      if (resumeAt > 0) {
        try { howl.seek(resumeAt); } catch { /* no-op */ }
      }
      hasSeekedToPersistedPosition = true;
    }
    howl.play();
    setState(state === 'ended' ? 'replaying' : 'playing');
    startPositionTracker();
  }

  function pause() {
    if (!howl) return;
    howl.pause();
    storage.writeState({ state: 'idle', volume, position: getPosition() });
    setState('idle');
    stopPositionTracker();
    // fire a final progress event so the UI updates the bar at the paused position
    fireProgress();
  }

  function replay() {
    ensureHowl();
    if (!howl) return;
    try { howl.stop(); howl.seek(0); } catch { /* no-op */ }
    hasSeekedToPersistedPosition = true; // we just seeked to 0; don't re-seek to persisted
    howl.play();
    setState('replaying');
    startPositionTracker();
  }

  function setVolume(next) {
    volume = Math.max(0, Math.min(1, next));
    if (howl) howl.volume(volume);
    storage.writeState({ state, volume, position: getPosition() });
    if (onVolumeChange) onVolumeChange(volume);
  }

  /**
   * v3 — Seek to a specific time in the track. Clamped to [0, duration].
   * Safe to call before the track is loaded — no-op until then.
   * @param {number} seconds
   */
  function seek(seconds) {
    ensureHowl();
    if (!howl) return;
    try {
      const dur = getDurationInternal();
      const clamped = Math.max(0, dur > 0 ? Math.min(dur, seconds) : seconds);
      howl.seek(clamped);
      hasSeekedToPersistedPosition = true; // any explicit seek bypasses the auto-resume logic
      storage.writeState({ state, volume, position: clamped });
      // immediately fire progress so the UI updates without waiting for next tick
      fireProgress();
    } catch { /* no-op */ }
  }

  function getDuration() {
    return getDurationInternal();
  }

  function getCurrentTime() {
    return getPosition();
  }

  // ── Suppression ──────────────────────────────────────────────────────────

  function applySuppression(pathname) {
    const shouldSuppress = isSuppressed(pathname, suppressionPaths);
    if (shouldSuppress === suppressed) return;
    suppressed = shouldSuppress;

    if (suppressed) {
      // entering a suppressed route — fade out if playing, persist position, hide UI
      if (howl && (state === 'playing' || state === 'replaying')) {
        try { howl.fade(volume, 0, SUPPRESSION_FADE_MS); } catch { /* no-op */ }
        setTimeout(() => {
          if (!howl) return;
          try { howl.pause(); howl.volume(volume); } catch { /* no-op */ }
        }, SUPPRESSION_FADE_MS + 50);
      }
      stopPositionTracker();
    } else if (!suppressed && (state === 'playing' || state === 'replaying')) {
      // leaving a suppressed route while logically still playing —
      // browser autoplay policy means we cannot resume without a fresh user click.
      // Drop back to 'idle' so the UI shows the play affordance, position is preserved
      // for resume on next user click.
      setState('idle');
    }
  }

  // ── Click handler (single entry point for the brand component) ──────────

  function handleClick() {
    if (suppressed || destroyed) return;
    if (state === 'idle') play();
    else if (state === 'playing' || state === 'replaying') pause();
    else if (state === 'ended') replay();
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  function destroy() {
    destroyed = true;
    stopPositionTracker();
    if (howl) {
      try { howl.unload(); } catch { /* no-op */ }
      howl = null;
    }
  }

  // ── Init: apply suppression for current route, fire initial state ───────

  if (typeof window !== 'undefined') {
    applySuppression(window.location.pathname);
  }
  // fire initial render with persisted state so the UI reflects cross-page state
  queueMicrotask(() => onStateChange(state));

  return {
    handleClick,
    play,
    pause,
    replay,
    setVolume,
    seek,            // v3
    getDuration,     // v3
    getCurrentTime,  // v3
    applySuppression,
    destroy,
    get state() { return state; },
    get volume() { return volume; },
    get isSuppressed() { return suppressed; },
  };
}

// ─── Convenience: detect prefers-reduced-motion ───────────────────────────

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
