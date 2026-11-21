import { useEffect, useMemo, useState } from 'react';
import { scenes } from '../data/scenes';
import { loadState, mixFor, saveState, type MoodState } from '../lib/storage';
import { useAmbientMixer } from '../hooks/useAmbientMixer';
import SceneBackground from './SceneBackground';
import Mixer from './Mixer';
import MusicPlayer from './MusicPlayer';
import StationPicker from './StationPicker';

type MobileTab = 'scene' | 'mixer' | 'music';
const mobileTabs: { id: MobileTab; label: string }[] = [
  { id: 'scene', label: 'ฉาก' },
  { id: 'mixer', label: 'เสียง' },
  { id: 'music', label: 'เพลง' },
];

export default function App() {
  const [state, setState] = useState<MoodState>(loadState);
  const [started, setStarted] = useState(false);
  // Global pause for everything (music, ambient sounds, scene video). Not saved:
  // each visit starts playing, and the per-source settings below are untouched.
  const [paused, setPaused] = useState(false);
  const [focus, setFocus] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('mixer');

  const scene = scenes.find((s) => s.id === state.sceneId) ?? scenes[0];
  // Memoized so the mixer hook only re-syncs audio when the mix actually changes.
  const mix = useMemo(() => mixFor(state, scene), [state.mixes, scene]);
  const update = (patch: Partial<MoodState>) => setState((prev) => ({ ...prev, ...patch }));
  // Built from `prev`, not the render-time `mix`, so two changes landing before
  // a re-render don't overwrite each other.
  const setSoundVolume = (id: string, volume: number) =>
    setState((prev) => {
      const current = scenes.find((s) => s.id === prev.sceneId) ?? scenes[0];
      return {
        ...prev,
        mixes: { ...prev.mixes, [current.id]: { ...mixFor(prev, current), [id]: volume } },
      };
    });
  // Choosing a station or pressing the music play button means "I want to listen",
  // so both also lift the global pause.
  const setStation = (id: string) => {
    setPaused(false);
    update({ stationId: id, musicOn: true });
  };
  const toggleMusic = () => {
    if (paused) {
      setPaused(false);
      update({ musicOn: true });
    } else {
      update({ musicOn: !state.musicOn });
    }
  };

  useEffect(() => saveState(state), [state]);
  // Only the current scene's sounds are in `mix`, so other scenes' sounds fade out.
  useAmbientMixer(mix, state.master, started && !paused);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocus(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Scene picker is always 3 columns; static class names so Tailwind keeps them.
  const comingSoonSpan = ['col-span-3', 'col-span-2', 'col-span-1'][scenes.length % 3];
  const glass = 'rounded-2xl border border-white/10 bg-black/35 backdrop-blur-xl';
  const glassLg = 'lg:rounded-2xl lg:border lg:border-white/10 lg:bg-black/35 lg:p-5 lg:backdrop-blur-xl';
  const heading = 'mb-4 hidden text-xs font-semibold tracking-widest text-white/50 uppercase lg:block';
  // Focus mode hides panels instead of unmounting them, so the YouTube player
  // keeps streaming (and stays visible, as YouTube's embed terms require).
  const hiddenInFocus = `transition-opacity duration-500 ${focus ? 'pointer-events-none opacity-0' : ''}`;
  // Mobile shows one tab's panel at a time; desktop always shows them all.
  const tabPanel = (id: MobileTab) => (mobileTab === id ? 'block' : 'hidden lg:block');

  return (
    // Mobile: exactly one screen tall, no page scroll. Desktop: free height.
    <div className="relative h-[100dvh] overflow-hidden text-white lg:h-auto lg:min-h-screen lg:overflow-visible">
      <SceneBackground scene={scene} paused={paused} />

      {/* Focus-mode watermark: always mounted so it can fade, non-interactive. */}
      <div
        aria-hidden="true"
        // Bottom padding lifts the text above the centered pause/play button.
        className={`pointer-events-none fixed inset-0 flex items-center justify-center pb-44 transition-opacity duration-700 md:pb-56 ${
          focus ? 'opacity-50' : 'opacity-0'
        }`}
      >
        <span className="text-6xl font-semibold tracking-tight md:text-8xl">imood</span>
      </div>

      {/* Pause / play everything. Dimmed so it doesn't fight the scene, centered on screen. */}
      {started && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'เล่นทั้งหมด' : 'หยุดทั้งหมด'}
          className="fixed top-1/2 left-1/2 z-10 flex h-14 w-14 md:h-20 md:w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white opacity-50 backdrop-blur-md transition-opacity hover:opacity-80"
        >
          {paused ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-6 w-6 md:h-9 md:w-9" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 md:h-9 md:w-9" aria-hidden="true">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          )}
        </button>
      )}

      {!started && (
        <div className="fixed inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-black/40 px-6 text-center backdrop-blur-sm">
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

      {/* Safe-area padding keeps controls clear of the notch / home indicator
          when installed to the home screen (viewport-fit=cover). */}
      <div className="flex h-full flex-col gap-3 p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6 lg:min-h-screen lg:gap-6 lg:p-10">
        <header className="flex items-center justify-between">
          <span className={`text-lg font-semibold tracking-tight lg:text-xl ${hiddenInFocus}`}>imood</span>
          <button
            type="button"
            onClick={() => setFocus((f) => !f)}
            className={`rounded-full px-3 py-1.5 text-xs transition-colors lg:px-4 lg:py-2 lg:text-sm ${
              focus ? 'bg-white/5 text-white/50 hover:text-white' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {focus ? 'ออกจากโหมดโฟกัส' : 'โหมดโฟกัส'}
          </button>
        </header>

        {/* Desktop grid: scenes bottom-left, mixer above music on the right edge.
            Mobile: a tabbed card (scenes / mixer / stations) above the music
            player, which stays put so music keeps playing on every tab. */}
        <div className="mt-auto flex min-h-0 flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,560px)_1fr_380px] lg:items-end lg:gap-6">
          {/* On desktop this wrapper disappears (display: contents). */}
          <div className={`${glass} flex min-h-0 flex-col p-3 lg:contents ${hiddenInFocus}`}>
            <nav role="tablist" className="mb-2 flex shrink-0 gap-1 rounded-full bg-white/10 p-1 lg:hidden">
              {mobileTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={mobileTab === tab.id}
                  onClick={() => setMobileTab(tab.id)}
                  className={`flex-1 rounded-full py-1.5 text-sm transition-colors ${
                    mobileTab === tab.id ? 'bg-white text-black' : 'text-white/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <section
              className={`${tabPanel('scene')} ${glassLg} ${hiddenInFocus} min-h-0 overflow-y-auto lg:col-start-1 lg:row-start-2 lg:overflow-visible`}
            >
              <h2 className={heading}>ฉาก</h2>
              <div className="grid grid-cols-3 gap-2 lg:gap-3">
                {scenes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => update({ sceneId: s.id })}
                    className={`flex h-20 items-end rounded-xl p-2 text-left text-xs font-medium ring-2 transition lg:h-24 lg:p-3 lg:text-sm ${
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
                {/* Fills the rest of the scene row (or a full new row when it's full). */}
                <div
                  aria-disabled="true"
                  className={`flex h-20 cursor-not-allowed flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/20 text-xs lg:h-24 lg:text-sm ${comingSoonSpan}`}
                >
                  <span className="font-medium text-white/70">ฉากใหม่</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/60">
                    เร็วๆ นี้
                  </span>
                </div>
              </div>
            </section>

            <section
              className={`${tabPanel('mixer')} ${glassLg} ${hiddenInFocus} min-h-0 overflow-y-auto lg:col-start-3 lg:row-start-1 lg:overflow-visible`}
            >
              <h2 className={heading}>เสียงบรรยากาศ</h2>
              <Mixer soundIds={scene.sounds.map((s) => s.id)} mix={mix} onChange={setSoundVolume} />
              <label className="mt-2 flex items-center gap-3 border-t border-white/10 pt-2 text-sm text-white/70 lg:mt-5 lg:pt-4">
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

            {/* Mobile-only stations tab; desktop shows the picker in the music panel. */}
            <section className={`${mobileTab === 'music' ? 'lg:hidden' : 'hidden'}`}>
              <StationPicker stationId={state.stationId} onChange={setStation} />
            </section>
          </div>

          <section
            className={`${glass} shrink-0 p-3 lg:col-start-3 lg:row-start-2 lg:p-5 ${focus ? 'ml-auto w-fit' : ''}`}
          >
            <h2 className={`${heading} ${focus ? 'lg:hidden' : ''}`}>เพลง</h2>
            <StationPicker
              stationId={state.stationId}
              onChange={setStation}
              className={`mb-3 hidden ${focus ? '' : 'lg:flex'}`}
            />
            <MusicPlayer
              compact={focus}
              stationId={state.stationId}
              playing={started && state.musicOn && !paused}
              volume={state.musicVolume}
              started={started}
              onTogglePlay={toggleMusic}
              onVolumeChange={(v) => update({ musicVolume: v })}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
