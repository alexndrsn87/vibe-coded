/**
 * ============================================================================
 * SOUND MANAGER — stub architecture, ready for real audio files
 * ============================================================================
 *
 * No audio files ship with this build. Every call below is safe to make at
 * any time: if the referenced file doesn't exist yet, playback fails
 * silently (caught) and the game carries on without sound.
 *
 * To enable sound, drop files into `public/sfx/` using the exact filenames
 * below (mp3 or ogg both work — just update the extension here if needed).
 * See the list of suggested clips in the project README.
 * ============================================================================
 */

export type SoundKey = 'signalClick' | 'routeSet' | 'routeCancel' | 'routeWarn' | 'arrival' | 'sessionEnd';

const SOUND_FILES: Record<SoundKey, string> = {
  signalClick: '/sfx/signal-click.mp3',
  routeSet: '/sfx/route-set-thunk.mp3',
  routeCancel: '/sfx/route-cancel.mp3',
  routeWarn: '/sfx/route-warn.mp3',
  arrival: '/sfx/arrival-chime.mp3',
  sessionEnd: '/sfx/session-end.mp3',
};

const cache = new Map<SoundKey, HTMLAudioElement>();
let enabled = true;

function getAudio(key: SoundKey): HTMLAudioElement {
  let el = cache.get(key);
  if (!el) {
    el = new Audio(SOUND_FILES[key]);
    el.volume = 0.45;
    cache.set(key, el);
  }
  return el;
}

export function playSound(key: SoundKey) {
  if (!enabled || typeof Audio === 'undefined') return;
  const el = getAudio(key);
  try {
    el.currentTime = 0;
    void el.play()?.catch(() => {
      /* file missing, or autoplay blocked before first user gesture — ignore */
    });
  } catch {
    // ignore
  }
}

export function setSoundEnabled(value: boolean) {
  enabled = value;
}

export function isSoundEnabled(): boolean {
  return enabled;
}
