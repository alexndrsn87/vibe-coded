import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Train } from 'lucide-react';
import EventFeed from '../simsig/components/EventFeed';
import HUD from '../simsig/components/HUD';
import TrackCanvas from '../simsig/components/TrackCanvas';
import { useGameLoop } from '../simsig/hooks/useGameLoop';
import { playSound } from '../simsig/audio/soundManager';

const GRADE_STYLES: Record<string, string> = {
  S: 'text-amber-300 border-amber-400/50 bg-amber-950/40',
  A: 'text-emerald-300 border-emerald-400/50 bg-emerald-950/40',
  B: 'text-cyan-300 border-cyan-400/50 bg-cyan-950/40',
  C: 'text-slate-300 border-slate-500/50 bg-slate-900/40',
};

export default function MerseysideSimPage() {
  const { state, start, togglePause, changeSpeed, setSessionLength, resetGame, clickSignal, selectPlatform } =
    useGameLoop();
  const lastLogId = useRef<string | null>(null);

  useEffect(() => {
    const last = state.log[state.log.length - 1];
    if (!last || last.id === lastLogId.current) return;
    lastLogId.current = last.id;

    if (last.text.includes('Session complete')) playSound('sessionEnd');
    else if (last.text.includes('arrived at Southport')) playSound('arrival');
    else if (last.level === 'success') playSound('routeSet');
    else if (last.level === 'warn') playSound('routeWarn');
    else if (last.text.includes('cancelled')) playSound('routeCancel');
  }, [state.log]);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-200 flex flex-col">
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-3">
          <Train className="text-cyan-400" size={22} />
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Merseyrail Northern Line</h1>
            <p className="text-xs text-slate-500">
              Hunts Cross → Southport · Signalling Simulator ·{' '}
              <span className="text-cyan-400 font-medium">Phase 2</span>
            </p>
          </div>
        </div>
        <Link
          to="/"
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded hover:bg-slate-800"
        >
          ← Back
        </Link>
      </header>

      <HUD
        state={state}
        onStart={start}
        onTogglePause={togglePause}
        onSpeed={changeSpeed}
        onReset={resetGame}
        onSessionLength={setSessionLength}
      />

      <div className="px-4 py-2.5 bg-slate-900/50 border-b border-slate-800 text-xs text-slate-400 leading-relaxed">
        <strong className="text-slate-300">How to play:</strong> press <strong className="text-slate-300">Start</strong>{' '}
        for a {state.sessionLengthMinutes}-minute session. The service calls at every station — dwell is automatic.
        Three signals need you: <strong className="text-amber-400">HLR</strong> (Hall Road),{' '}
        <strong className="text-amber-400">FOR</strong> (Formby) and <strong className="text-amber-400">BIR-SOU</strong>{' '}
        (Southport). Click the amber-bordered signal, then click the next signal (or a platform at Southport) to set
        the route. Everything else runs on automatic signals — red means occupied, green means clear ahead.
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
        <div className="flex-1 min-h-[280px] lg:min-h-0 bg-[#0a0f1a] border-r border-slate-800 flex items-center overflow-x-auto">
          <TrackCanvas state={state} onSignalClick={clickSignal} onPlatformClick={selectPlatform} />
        </div>

        <aside className="w-full lg:w-80 flex flex-col bg-slate-950/60 border-t lg:border-t-0 lg:border-l border-slate-800 max-h-[40vh] lg:max-h-none">
          <div className="px-3 py-2 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Event feed
          </div>
          <EventFeed log={state.log} />

          <div className="px-3 py-3 border-t border-slate-800 text-xs text-slate-500 space-y-1.5">
            <p>
              <strong className="text-slate-300">Legend:</strong>
            </p>
            <p>🔴 Red section = train occupying that block. 🟢 Green dashed line = route set into a platform.</p>
            <p className="text-slate-600">
              Assist mode, incidents, achievements and the Lime Street interchange land in later phases — this build
              covers full-route interlocking, station dwell times and 15/30/60-minute sessions.
            </p>
          </div>
        </aside>

        {state.sessionEnded && state.sessionSummary && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-sm mx-4 rounded-xl border border-slate-700 bg-slate-900 p-6 text-center shadow-2xl">
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Session complete</p>
              <div
                className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 text-4xl font-bold ${
                  GRADE_STYLES[state.sessionSummary.grade]
                }`}
              >
                {state.sessionSummary.grade}
              </div>
              <p className="text-sm text-slate-300 mb-4">{state.sessionSummary.headline}</p>
              <div className="flex justify-center gap-6 text-xs text-slate-400 mb-5">
                <div>
                  <div className="text-lg font-mono text-white">{state.sessionSummary.percentComplete}%</div>
                  <div>of route covered</div>
                </div>
                <div>
                  <div className="text-lg font-mono text-white">{state.sessionSummary.distanceMiles.toFixed(1)}</div>
                  <div>miles run</div>
                </div>
              </div>
              <button
                type="button"
                onClick={resetGame}
                className="w-full px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
              >
                Play again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
