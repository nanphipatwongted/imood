import { useEffect, useRef } from 'react';
import { embedUrl, stations } from '../data/music';

// Minimal slice of the YouTube IFrame Player API we actually call.
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  setVolume(volume: number): void;
}
declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLIFrameElement,
        opts: { events: { onReady: (e: { target: YTPlayer }) => void } },
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiReady: Promise<void> | null = null;
function loadYouTubeApi() {
  apiReady ??= new Promise((resolve) => {
    if (window.YT?.Player) return resolve();
    window.onYouTubeIframeAPIReady = () => resolve();
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  });
  return apiReady;
}

interface Props {
  stationId: string;
  playing: boolean;
  volume: number;
  started: boolean;
  onStationChange: (id: string) => void;
  onTogglePlay: () => void;
  onVolumeChange: (volume: number) => void;
  /** Focus mode: just play/pause, volume, and the smallest allowed player. */
  compact?: boolean;
}

export default function MusicPlayer({
  stationId,
  playing,
  volume,
  started,
  onStationChange,
  onTogglePlay,
  onVolumeChange,
  compact = false,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  // Latest values for the async onReady callback.
  const latest = useRef({ playing, volume });
  latest.current = { playing, volume };

  const station = stations.find((s) => s.id === stationId) ?? stations[0];

  // We render the iframe ourselves and attach the API to it. A new station
  // remounts the iframe via `key`, so re-attach then.
  useEffect(() => {
    if (!started || !iframeRef.current) return;
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !iframeRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onReady: ({ target }) => {
            target.setVolume(latest.current.volume * 100);
            if (!latest.current.playing) target.pauseVideo();
          },
        },
      });
    });
    return () => {
      cancelled = true;
      playerRef.current = null;
    };
  }, [started, station.id]);

  useEffect(() => {
    if (playing) playerRef.current?.playVideo();
    else playerRef.current?.pauseVideo();
  }, [playing]);

  useEffect(() => {
    playerRef.current?.setVolume(volume * 100);
  }, [volume]);

  // Compact mode only hides/resizes siblings — the iframe keeps its place in the
  // tree, so React never remounts it and the stream doesn't restart.
  return (
    <div className="space-y-3">
      <div className={`flex gap-2 ${compact ? 'hidden' : ''}`}>
        {stations.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onStationChange(s.id)}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              s.id === stationId ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Controls sit above the embed so they stay on screen on shorter displays. */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onTogglePlay}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black"
          aria-label={playing ? 'หยุดเพลง' : 'เล่นเพลง'}
        >
          {playing ? '❚❚' : '▶'}
        </button>
        <label className="flex w-full items-center gap-3 text-sm text-white/70">
          <span className={compact ? 'sr-only' : 'w-20 shrink-0'}>ความดังเพลง</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="w-full accent-white"
          />
        </label>
      </div>

      {/* YouTube's terms require the embedded player to stay visible (≥200×200). */}
      <div className={`h-[200px] overflow-hidden rounded-xl bg-black/40 ${compact ? 'w-[200px]' : 'w-full'}`}>
        {started && (
          <iframe
            key={station.id}
            ref={iframeRef}
            src={embedUrl(station.youtubeId)}
            title={station.name}
            allow="autoplay; encrypted-media"
            className="h-full w-full"
          />
        )}
      </div>
    </div>
  );
}
