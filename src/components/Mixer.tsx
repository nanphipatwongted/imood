import { soundById } from '../data/sounds';

interface Props {
  /** Sound ids to show, in order — the current scene's sounds. */
  soundIds: string[];
  mix: Record<string, number>;
  onChange: (id: string, volume: number) => void;
}

export default function Mixer({ soundIds, mix, onChange }: Props) {
  return (
    <ul className="space-y-3">
      {soundIds.map((id) => {
        const sound = soundById.get(id);
        if (!sound) return null;
        const volume = mix[id] ?? 0;
        return (
          <li key={id} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onChange(id, volume > 0 ? 0 : 0.5)}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg transition-colors ${
                volume > 0 ? 'bg-white/90' : 'bg-white/10 grayscale'
              }`}
              aria-label={`${volume > 0 ? 'ปิด' : 'เปิด'}เสียง${sound.label}`}
              aria-pressed={volume > 0}
            >
              {sound.icon}
            </button>
            <span className="w-24 shrink-0 text-sm text-white/80">{sound.label}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => onChange(id, Number(e.target.value))}
              className="w-full accent-white"
              aria-label={`ความดังเสียง${sound.label}`}
            />
          </li>
        );
      })}
    </ul>
  );
}
