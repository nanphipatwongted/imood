import { defaultScene, type Scene } from '../data/scenes';
import { defaultStation } from '../data/music';

export interface MoodState {
  sceneId: string;
  /** Per-scene mixes (scene id → sound id → volume), so each scene keeps its own tweaks. */
  mixes: Record<string, Record<string, number>>;
  master: number;
  stationId: string;
  musicOn: boolean;
  musicVolume: number;
}

const KEY = 'imood:state';

export const initialState: MoodState = {
  sceneId: defaultScene.id,
  mixes: {},
  master: 0.8,
  stationId: defaultStation.id,
  musicOn: true,
  musicVolume: 0.5,
};

/**
 * The user's mix for a scene, conformed to the scene's current sound list:
 * sounds added since it was saved get their default volume, and sounds since
 * removed are dropped (otherwise they'd keep playing with no slider to stop them).
 */
export function mixFor(state: MoodState, scene: Scene): Record<string, number> {
  const saved = state.mixes[scene.id] ?? {};
  return Object.fromEntries(scene.sounds.map((s) => [s.id, saved[s.id] ?? s.volume]));
}

// No login, so everything the user picks lives in this browser only.
export function loadState(): MoodState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState;
    // Drop the pre-per-scene `mix` field from older saves.
    const { mix: _legacy, ...saved } = JSON.parse(raw);
    return { ...initialState, ...saved };
  } catch {
    return initialState;
  }
}

export function saveState(state: MoodState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private mode or storage full — settings just won't persist.
  }
}
