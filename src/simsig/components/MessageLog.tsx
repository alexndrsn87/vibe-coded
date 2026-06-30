import type { SimMessage } from '../types';

interface MessageLogProps {
  messages: SimMessage[];
}

const LEVEL_STYLES = {
  info: 'text-slate-400',
  warn: 'text-amber-400',
  alert: 'text-red-400',
};

export default function MessageLog({ messages }: MessageLogProps) {
  const recent = [...messages].reverse().slice(0, 8);

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 min-h-0">
      {recent.map((m) => (
        <div key={m.id} className={`text-xs ${LEVEL_STYLES[m.level]}`}>
          {m.text}
        </div>
      ))}
    </div>
  );
}
