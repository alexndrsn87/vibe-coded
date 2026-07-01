import type { LogEntry } from '../engine/types';

interface EventFeedProps {
  log: LogEntry[];
}

const LEVEL_STYLES: Record<LogEntry['level'], string> = {
  info: 'text-slate-400',
  warn: 'text-amber-400',
  success: 'text-emerald-400',
};

export default function EventFeed({ log }: EventFeedProps) {
  const recent = [...log].reverse().slice(0, 10);

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
      {recent.map((entry) => (
        <div key={entry.id} className={`text-xs leading-snug ${LEVEL_STYLES[entry.level]}`}>
          {entry.text}
        </div>
      ))}
    </div>
  );
}
