import { Pause, Play, RotateCcw, Zap } from 'lucide-react';
import type { SimMode, SimSpeed } from '../types';

interface ControlBarProps {
  running: boolean;
  paused: boolean;
  mode: SimMode;
  speed: SimSpeed;
  formattedTime: string;
  onTimePercent: number;
  trainsHandled: number;
  spadEvents: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSetSpeed: (s: SimSpeed) => void;
  onSetMode: (m: SimMode) => void;
}

const SPEEDS: SimSpeed[] = [1, 2, 4, 8];

export default function ControlBar({
  running,
  paused,
  mode,
  speed,
  formattedTime,
  onTimePercent,
  trainsHandled,
  spadEvents,
  onStart,
  onPause,
  onResume,
  onReset,
  onSetSpeed,
  onSetMode,
}: ControlBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-slate-900/90 border-b border-slate-700/60">
      <div className="flex items-center gap-2">
        {!running ? (
          <button
            type="button"
            onClick={onStart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
          >
            <Play size={14} /> Start
          </button>
        ) : paused ? (
          <button
            type="button"
            onClick={onResume}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
          >
            <Play size={14} /> Resume
          </button>
        ) : (
          <button
            type="button"
            onClick={onPause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
          >
            <Pause size={14} /> Pause
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition-colors"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="h-6 w-px bg-slate-700 hidden sm:block" />

      <div className="font-mono text-lg text-cyan-400 tabular-nums">{formattedTime}</div>

      <div className="h-6 w-px bg-slate-700 hidden sm:block" />

      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-500 mr-1">Speed</span>
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSetSpeed(s)}
            className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
              speed === s ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            ×{s}
          </button>
        ))}
      </div>

      <div className="h-6 w-px bg-slate-700 hidden sm:block" />

      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-500 mr-1">Mode</span>
        <button
          type="button"
          onClick={() => onSetMode('nx')}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            mode === 'nx' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          NX Panel
        </button>
        <button
          type="button"
          onClick={() => onSetMode('atc')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            mode === 'atc' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <Zap size={12} /> ATC
        </button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span>
          On time: <strong className="text-emerald-400">{onTimePercent}%</strong>
        </span>
        <span>
          Handled: <strong className="text-slate-200">{trainsHandled}</strong>
        </span>
        {spadEvents > 0 && (
          <span>
            SPAD/TPWS: <strong className="text-red-400">{spadEvents}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
