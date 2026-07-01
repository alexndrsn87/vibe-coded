import { Link } from 'react-router-dom';
import { Train } from 'lucide-react';
import EventFeed from '../simsig/components/EventFeed';
import HUD from '../simsig/components/HUD';
import TrackCanvas from '../simsig/components/TrackCanvas';
import { useGameLoop } from '../simsig/hooks/useGameLoop';

export default function MerseysideSimPage() {
  const { state, start, togglePause, changeSpeed, resetGame, clickSignal, selectPlatform } = useGameLoop();

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-200 flex flex-col">
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-3">
          <Train className="text-cyan-400" size={22} />
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Merseyrail Northern Line</h1>
            <p className="text-xs text-slate-500">
              Hunts Cross → Southport · Signalling Simulator ·{' '}
              <span className="text-cyan-400 font-medium">Phase 1</span>
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

      <HUD state={state} onStart={start} onTogglePause={togglePause} onSpeed={changeSpeed} onReset={resetGame} />

      <div className="px-4 py-2.5 bg-slate-900/50 border-b border-slate-800 text-xs text-slate-400 leading-relaxed">
        <strong className="text-slate-300">How to play:</strong> press <strong className="text-slate-300">Start</strong>,
        then click the <strong className="text-amber-400">BIR-SOU</strong> controlled signal near Southport, then click a
        free platform to set the route. Everything else on the line runs on automatic signals, just like the real
        railway — red means occupied, green means clear ahead, yellow/double-yellow warn of a train further ahead.
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
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
              Full interlocking, the timetable engine, multiple trains, and assist mode land in the next phases —
              this build proves the core click-to-route interaction.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
