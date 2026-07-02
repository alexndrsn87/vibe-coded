import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import type { GameState, SessionLengthMinutes, SimSpeed } from '../engine/types';
import { formatCountdown, formatSimTime } from '../engine/gameState';
import { isSoundEnabled, setSoundEnabled } from '../audio/soundManager';

interface HUDProps {
  state: GameState;
  onStart: () => void;
  onTogglePause: () => void;
  onSpeed: (s: SimSpeed) => void;
  onReset: () => void;
  onSessionLength: (m: SessionLengthMinutes) => void;
}

const SPEEDS: SimSpeed[] = [1, 2, 4];
const SESSION_LENGTHS: SessionLengthMinutes[] = [15, 30, 60];

export default function HUD({ state, onStart, onTogglePause, onSpeed, onReset, onSessionLength }: HUDProps) {
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const remaining = state.sessionEndsAt !== null ? state.sessionEndsAt - state.simTimeSec : null;

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
          disabled={state.sessionEnded}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-white text-sm font-medium transition-colors disabled:opacity-40 ${
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

      {remaining !== null && (
        <span
          className={`font-mono text-sm tabular-nums px-2 py-0.5 rounded ${
            remaining < 60 ? 'text-red-300 bg-red-950/60' : 'text-slate-300 bg-slate-800/60'
          }`}
        >
          Session: {formatCountdown(remaining)}
        </span>
      )}

      <div className="h-6 w-px bg-slate-700 hidden sm:block" />

      <div className="flex items-center gap-1">
        <span className="text-xs text-slate-500 mr-1">Session</span>
        {SESSION_LENGTHS.map((m) => (
          <button
            key={m}
            type="button"
            disabled={state.running}
            onClick={() => onSessionLength(m)}
            className={`px-2 py-0.5 rounded text-xs font-mono transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              state.sessionLengthMinutes === m ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {m}m
          </button>
        ))}
      </div>

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

      <button
        type="button"
        onClick={() => {
          const next = !soundOn;
          setSoundOn(next);
          setSoundEnabled(next);
        }}
        title={soundOn ? 'Mute sound effects' : 'Unmute sound effects'}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-400 hover:bg-slate-800 transition-colors"
      >
        {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
      </button>

      <div className="flex-1" />

      {state.phaseComplete && (
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-900/60 text-emerald-300 font-medium">
          Southport reached
        </span>
      )}
    </div>
  );
}
