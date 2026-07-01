import { Pause, Play, RotateCcw } from 'lucide-react';
import type { GameState, SimSpeed } from '../engine/types';
import { formatSimTime } from '../engine/gameState';

interface HUDProps {
  state: GameState;
  onStart: () => void;
  onTogglePause: () => void;
  onSpeed: (s: SimSpeed) => void;
  onReset: () => void;
}

const SPEEDS: SimSpeed[] = [1, 2, 4];

export default function HUD({ state, onStart, onTogglePause, onSpeed, onReset }: HUDProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-slate-900/90 border-b border-slate-700/60">
      {!state.running ? (
        <button
          type="button"
          onClick={onStart}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
        >
          <Play size={14} /> Start
        </button>
      ) : (
        <button
          type="button"
          onClick={onTogglePause}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-white text-sm font-medium transition-colors ${
            state.paused ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'
          }`}
        >
          {state.paused ? <Play size={14} /> : <Pause size={14} />}
          {state.paused ? 'Resume' : 'Pause'}
        </button>
      )}
      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition-colors"
      >
        <RotateCcw size={14} /> Reset
      </button>

      <div className="h-6 w-px bg-slate-700 hidden sm:block" />
      <div className="font-mono text-lg text-cyan-400 tabular-nums">{formatSimTime(state.simTimeSec)}</div>
      <div className="h-6 w-px bg-slate-700 hidden sm:block" />

      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-500 mr-1">Speed</span>
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSpeed(s)}
            className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
              state.speed === s ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            ×{s}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {state.phaseComplete && (
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-900/60 text-emerald-300 font-medium">
          Phase 1 complete
        </span>
      )}
    </div>
  );
}
