import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export default function HelpPanel() {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-t border-slate-800">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <HelpCircle size={14} />
          How to play
        </span>
        {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-xs text-slate-400 space-y-2 leading-relaxed">
          <p>
            <strong className="text-slate-300">You are the signaller</strong> for the Merseyside Northern Line
            from Hunts Cross to Sandhills, including the City Line branch to Lime Street.
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Press <strong className="text-slate-300">Start</strong> to begin the 07:00 peak timetable.</li>
            <li>
              <strong className="text-slate-300">Set routes:</strong> click an entry signal, then click the exit
              signal. Points lock automatically.
            </li>
            <li>
              EMU services (cyan) run every 5 minutes on the Northern Line. DMU City Line services (orange) use
              Lime Street via Edge Hill.
            </li>
            <li>
              <strong className="text-slate-300">NX Panel</strong> mode uses standard SimSig-style operation with
              TORR (signals auto-replace).
            </li>
            <li>
              <strong className="text-slate-300">ATC mode</strong> enables AWS/TPWS train protection — trains will
              emergency-brake at red signals if you fail to set routes in time.
            </li>
          </ol>
          <p className="text-slate-500 pt-1">
            Based on the real Merseyrail network. Sandhills IECC controls the full Northern Line in reality.
          </p>
        </div>
      )}
    </div>
  );
}
