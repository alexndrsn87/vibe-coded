import type { Train } from '../types';

interface TrainListProps {
  trains: Train[];
  formattedTime: string;
  mode: 'nx' | 'atc';
}

function stateLabel(state: Train['state']): string {
  switch (state) {
    case 'running':
      return 'Running';
    case 'stopped':
      return 'At platform';
    case 'waiting':
      return 'Waiting at signal';
    case 'braking':
      return 'Braking';
    case 'departing':
      return 'Departing';
  }
}

export default function TrainList({ trains, mode }: TrainListProps) {
  if (trains.length === 0) {
    return (
      <div className="p-4 text-sm text-slate-500 text-center">
        No trains on panel yet — services depart from 07:00.
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-800">
      {trains.map((t) => (
        <div key={t.id} className="px-3 py-2.5 flex items-center gap-3 text-sm">
          <span
            className={`font-mono font-bold text-xs px-1.5 py-0.5 rounded ${
              t.type === 'emu' ? 'bg-cyan-900/50 text-cyan-300' : 'bg-orange-900/50 text-orange-300'
            }`}
          >
            {t.headcode}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-slate-200 truncate">
              → {t.destination}
              <span className="text-slate-500 ml-2">{stateLabel(t.state)}</span>
            </div>
            {t.delaySeconds > 5 && (
              <div className="text-xs text-amber-400">+{Math.round(t.delaySeconds)}s late</div>
            )}
          </div>
          {mode === 'atc' && (
            <div className="flex gap-1">
              {t.atc.awsActive && (
                <span className="text-[10px] px-1 rounded bg-yellow-900/60 text-yellow-300" title="AWS active">
                  AWS
                </span>
              )}
              {t.atc.tpwsBrake && (
                <span className="text-[10px] px-1 rounded bg-red-900/60 text-red-300" title="TPWS brake demand">
                  TPWS
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
