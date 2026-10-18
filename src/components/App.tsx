import { useEffect, useMemo, useState } from 'react';
import { scenes } from '../data/scenes';
import { loadState, mixFor, saveState, type MoodState } from '../lib/storage';
import { useAmbientMixer } from '../hooks/useAmbientMixer';
import SceneBackground from './SceneBackground';
import Mixer from './Mixer';
import MusicPlayer from './MusicPlayer';

export default function App() {
  const [state, setState] = useState<MoodState>(loadState);
  const [started, setStarted] = useState(false);
  const [focus, setFocus] = useState(false);

  const scene = scenes.find((s) => s.id === state.sceneId) ?? scenes[0];
  // Memoized so the mixer hook only re-syncs audio when the mix actually changes.
  const mix = useMemo(() => mixFor(state, scene), [state.mixes, scene]);
  const update = (patch: Partial<MoodState>) => setState((prev) => ({ ...prev, ...patch }));

  useEffect(() => saveState(state), [state]);
  // Only the current scene's sounds are in `mix`, so other scenes' sounds fade out.
  useAmbientMixer(mix, state.master, started);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocus(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const panel = 'rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl';
  const heading = 'mb-4 text-xs font-semibold tracking-widest text-white/50 uppercase';
  // Focus mode hides panels instead of unmounting them, so the YouTube player
  // keeps streaming (and stays visible, as YouTube's embed terms require).
  const hiddenInFocus = `transition-opacity duration-500 ${focus ? 'pointer-events-none opacity-0' : ''}`;

  return (
    <div className="relative min-h-screen text-white">
      <SceneBackground scene={scene} />

      {!started && (
        <div className="fixed inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-black/40 backdrop-blur-sm">
          <h1 className="text-5xl font-semibold tracking-tight">imood</h1>
          <p className="text-white/70">เพลงและบรรยากาศสำหรับทำงานไปพร้อมกัน</p>
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="rounded-full bg-white px-8 py-3 font-semibold text-black transition-transform hover:scale-105"
          >
            เริ่มฟัง
          </button>
        </div>
      )}

      <div className="flex min-h-screen flex-col gap-6 p-6 md:p-10">
        <header className="flex items-center justify-between">
          <span className={`text-xl font-semibold tracking-tight ${hiddenInFocus}`}>imood</span>
          <button
            type="button"
            onClick={() => setFocus((f) => !f)}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              focus ? 'bg-white/5 text-white/50 hover:text-white' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {focus ? 'ออกจากโหมดโฟกัส' : 'โหมดโฟกัส'}
          </button>
        </header>

        {/* Scenes hug the bottom-left corner, mixer + music the right edge,
            leaving the middle of the screen clear for the scene itself. */}
        <div className="mt-auto flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <section className={`${panel} ${hiddenInFocus} lg:w-[560px]`}>
            <h2 className={heading}>ฉาก</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {scenes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => update({ sceneId: s.id })}
                  className={`flex h-24 items-end rounded-xl p-3 text-left text-sm font-medium ring-2 transition ${
                    s.id === scene.id ? 'ring-white' : 'ring-transparent hover:ring-white/40'
                  }`}
                  style={{
                    background: s.thumb
                      ? `linear-gradient(to top, rgb(0 0 0 / 0.6), transparent 60%), url(${s.thumb}) center / cover`
                      : s.gradient,
                  }}
                >
                  {s.name}
                </button>
              ))}
              {/* Fills the rest of the row until more scenes launch. */}
              <div
                aria-disabled="true"
                className="flex h-24 cursor-not-allowed flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/20 text-sm sm:col-span-2"
              >
                <span className="font-medium text-white/70">ฉากใหม่</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/60">
                  เร็วๆ นี้
                </span>
              </div>
            </div>
          </section>

          <div className="space-y-6 lg:w-[380px] lg:shrink-0">
            <section className={`${panel} ${hiddenInFocus}`}>
              <h2 className={heading}>เสียงบรรยากาศ</h2>
              <Mixer
                soundIds={scene.sounds.map((s) => s.id)}
                mix={mix}
                onChange={(id, volume) =>
                  update({ mixes: { ...state.mixes, [scene.id]: { ...mix, [id]: volume } } })
                }
              />
              <label className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4 text-sm text-white/70">
                <span className="w-20 shrink-0">ความดังรวม</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={state.master}
                  onChange={(e) => update({ master: Number(e.target.value) })}
                  className="w-full accent-white"
                />
              </label>
            </section>

            <section className={`${panel} ${focus ? 'ml-auto w-fit' : ''}`}>
              <h2 className={`${heading} ${focus ? 'hidden' : ''}`}>เพลง</h2>
              <MusicPlayer
                compact={focus}
                stationId={state.stationId}
                playing={started && state.musicOn}
                volume={state.musicVolume}
                started={started}
                onStationChange={(id) => update({ stationId: id, musicOn: true })}
                onTogglePlay={() => update({ musicOn: !state.musicOn })}
                onVolumeChange={(v) => update({ musicVolume: v })}
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
