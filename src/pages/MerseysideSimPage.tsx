import { Link } from 'react-router-dom';
import { Train } from 'lucide-react';
import ControlBar from '../simsig/components/ControlBar';
import HelpPanel from '../simsig/components/HelpPanel';
import MessageLog from '../simsig/components/MessageLog';
import TrackPanel from '../simsig/components/TrackPanel';
import TrainList from '../simsig/components/TrainList';
import { useSimSig } from '../simsig/hooks/useSimSig';

const CHAINAGE_MIN = 0;
const CHAINAGE_MAX = 6.8;
const PANEL_TOP = 40;
const PANEL_BOTTOM = 680;

function chainageToY(chainage: number): number {
  const t = (chainage - CHAINAGE_MIN) / (CHAINAGE_MAX - CHAINAGE_MIN);
  return PANEL_BOTTOM - t * (PANEL_BOTTOM - PANEL_TOP);
}

export default function MerseysideSimPage() {
  const sim = useSimSig();
  const { state } = sim;

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-200 flex flex-col">
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-3">
          <Train className="text-cyan-400" size={22} />
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Merseyside Northern Line</h1>
            <p className="text-xs text-slate-500">Hunts Cross · Lime Street · Sandhills — Signalling Simulator</p>
          </div>
        </div>
        <Link
          to="/"
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded hover:bg-slate-800"
        >
          ← Back
        </Link>
      </header>

      <ControlBar
        running={state.running}
        paused={state.paused}
        mode={state.mode}
        speed={state.speed}
        formattedTime={sim.formattedTime}
        onTimePercent={state.score.onTimePercent}
        trainsHandled={state.score.trainsHandled}
        spadEvents={state.score.spadEvents}
        onStart={sim.start}
        onPause={sim.pause}
        onResume={sim.resume}
        onReset={sim.reset}
        onSetSpeed={sim.setSpeed}
        onSetMode={sim.setMode}
      />

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <div className="flex-1 min-h-[400px] lg:min-h-0 bg-[#0a0f1a] border-r border-slate-800">
          <TrackPanel
            chainageToY={chainageToY}
            sections={Object.values(state.sections)}
            signals={Object.values(state.signals)}
            points={Object.values(state.points)}
            stations={state.stations}
            trains={state.trains}
            activeFromSignal={state.activeRoute?.fromSignal ?? null}
            onSignalClick={sim.clickSignal}
            onPointClick={sim.togglePoint}
          />
        </div>

        <aside className="w-full lg:w-72 flex flex-col bg-slate-950/60 border-t lg:border-t-0 lg:border-l border-slate-800 max-h-[40vh] lg:max-h-none">
          <div className="px-3 py-2 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Trains
          </div>
          <div className="max-h-48 overflow-y-auto">
            <TrainList trains={state.trains} formattedTime={sim.formattedTime} mode={state.mode} />
          </div>

          <div className="px-3 py-2 border-b border-t border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Log
          </div>
          <MessageLog messages={state.messages} />

          <HelpPanel />
        </aside>
      </div>
    </div>
  );
}
