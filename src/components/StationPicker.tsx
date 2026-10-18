import { stations } from '../data/music';

interface Props {
  stationId: string;
  onChange: (id: string) => void;
  className?: string;
}

export default function StationPicker({ stationId, onChange, className = '' }: Props) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {stations.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onChange(s.id)}
          className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
            s.id === stationId ? 'bg-white text-black' : 'bg-white/10 text-white/80 hover:bg-white/20'
          }`}
        >
          {s.name}
        </button>
      ))}
    </div>
  );
}
