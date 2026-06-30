import type { SignalAspect } from '../types';

const ASPECT_COLORS: Record<SignalAspect, string> = {
  R: '#ef4444',
  Y: '#eab308',
  YY: '#facc15',
  G: '#22c55e',
};

interface SignalLampProps {
  id: string;
  name: string;
  aspect: SignalAspect;
  x: number;
  y: number;
  selected: boolean;
  routeTarget: boolean;
  onClick: () => void;
}

function SignalLamp({ id, name, aspect, x, y, selected, routeTarget, onClick }: SignalLampProps) {
  return (
    <g transform={`translate(${x}, ${y})`} className="cursor-pointer" onClick={onClick}>
      <title>{`${name} — ${aspect === 'R' ? 'Stop' : aspect === 'Y' ? 'Caution' : 'Clear'}. Click to ${selected ? 'cancel' : routeTarget ? 'complete route' : 'set route from here'}.`}</title>
      <rect
        x={-14}
        y={-22}
        width={28}
        height={44}
        rx={4}
        fill="#1e293b"
        stroke={selected ? '#22d3ee' : routeTarget ? '#f59e0b' : '#475569'}
        strokeWidth={selected || routeTarget ? 2.5 : 1}
      />
      {(['R', 'Y', 'G'] as const).map((a, i) => (
        <circle
          key={a}
          cx={0}
          cy={-12 + i * 12}
          r={5}
          fill={aspect === a || (aspect === 'YY' && a === 'Y') ? ASPECT_COLORS[aspect] : '#334155'}
          opacity={aspect === a || (aspect === 'YY' && a === 'Y') ? 1 : 0.35}
        />
      ))}
      <text y={32} textAnchor="middle" fill="#94a3b8" fontSize={9} fontFamily="monospace">
        {name}
      </text>
    </g>
  );
}

interface TrackPanelProps {
  chainageToY: (c: number) => number;
  sections: { id: string; fromChainage: number; toChainage: number; occupiedBy: string | null; electrified: boolean }[];
  signals: { id: string; name: string; chainage: number; direction: 'up' | 'down'; aspect: SignalAspect }[];
  points: { id: string; name: string; chainage: number; position: 'normal' | 'reverse'; locked: boolean }[];
  stations: { id: string; name: string; chainage: number }[];
  trains: { id: string; headcode: string; chainage: number; direction: 'up' | 'down'; type: 'emu' | 'dmu'; atc: { tpwsBrake: boolean } }[];
  activeFromSignal: string | null;
  onSignalClick: (id: string) => void;
  onPointClick: (id: string) => void;
}

export default function TrackPanel({
  chainageToY,
  sections,
  signals,
  points,
  stations,
  trains,
  activeFromSignal,
  onSignalClick,
  onPointClick,
}: TrackPanelProps) {
  const mainLineX = 280;
  const limeStreetX = 120;

  return (
    <svg viewBox="0 0 560 720" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="grid" width={20} height={20} patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth={0.5} />
        </pattern>
      </defs>
      <rect width={560} height={720} fill="#0a0f1a" />
      <rect width={560} height={720} fill="url(#grid)" opacity={0.4} />

      <text x={280} y={24} textAnchor="middle" fill="#64748b" fontSize={11} fontFamily="monospace">
        ↑ SANDHILLS / SOUTHPORT · ORMSKIRK · KIRKBY
      </text>
      <text x={280} y={706} textAnchor="middle" fill="#64748b" fontSize={11} fontFamily="monospace">
        ↓ HUNTS CROSS · ALLERTON · WARRINGTON
      </text>

      {/* Lime Street branch */}
      <text x={limeStreetX} y={chainageToY(3.8) - 8} textAnchor="middle" fill="#94a3b8" fontSize={10}>
        Lime Street
      </text>
      <path
        d={`M ${limeStreetX} ${chainageToY(4.0)} L ${limeStreetX} ${chainageToY(3.2)} L ${mainLineX - 30} ${chainageToY(3.2)}`}
        fill="none"
        stroke="#475569"
        strokeWidth={3}
        strokeDasharray={sections.find((s) => s.id === 's-eh-ls')?.electrified ? '0' : '6 4'}
      />

      {/* Main line */}
      <line
        x1={mainLineX}
        y1={chainageToY(0)}
        x2={mainLineX}
        y2={chainageToY(6.8)}
        stroke="#334155"
        strokeWidth={6}
      />

      {/* Third rail indicator */}
      <line
        x1={mainLineX + 8}
        y1={chainageToY(0.3)}
        x2={mainLineX + 8}
        y2={chainageToY(6.5)}
        stroke="#2563eb"
        strokeWidth={2}
        opacity={0.5}
      />
      <text x={mainLineX + 20} y={chainageToY(1)} fill="#3b82f6" fontSize={8} opacity={0.7}>
        750V DC
      </text>

      {/* Track sections occupancy */}
      {sections
        .filter((s) => s.id !== 's-eh-ls')
        .map((s) => (
          <rect
            key={s.id}
            x={mainLineX - 18}
            y={Math.min(chainageToY(s.fromChainage), chainageToY(s.toChainage))}
            width={36}
            height={Math.abs(chainageToY(s.toChainage) - chainageToY(s.fromChainage))}
            fill={s.occupiedBy ? 'rgba(239,68,68,0.25)' : 'transparent'}
            rx={2}
          />
        ))}

      {/* Stations */}
      {stations
        .filter((s) => s.id !== 'ls')
        .map((st) => (
          <g key={st.id}>
            <rect
              x={mainLineX - 70}
              y={chainageToY(st.chainage) - 12}
              width={140}
              height={24}
              fill="rgba(30,41,59,0.8)"
              stroke="#475569"
              rx={3}
            />
            <text
              x={mainLineX}
              y={chainageToY(st.chainage) + 4}
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize={10}
              fontWeight={600}
            >
              {st.name}
            </text>
          </g>
        ))}

      {/* Lime Street station box */}
      <rect
        x={limeStreetX - 50}
        y={chainageToY(4.0) - 12}
        width={100}
        height={24}
        fill="rgba(30,41,59,0.8)"
        stroke="#78716c"
        rx={3}
      />
      <text x={limeStreetX} y={chainageToY(4.0) + 4} textAnchor="middle" fill="#d6d3d1" fontSize={10} fontWeight={600}>
        Lime Street
      </text>

      {/* Points */}
      {points.map((p) => {
        const y = chainageToY(p.chainage);
        const x = p.id === 'eh-p1' ? mainLineX - 30 : mainLineX;
        return (
          <g key={p.id} className="cursor-pointer" onClick={() => !p.locked && onPointClick(p.id)}>
            <title>{`${p.name}: ${p.position}${p.locked ? ' (locked)' : ' — click to toggle'}`}</title>
            <circle cx={x} cy={y} r={8} fill={p.position === 'reverse' ? '#f59e0b' : '#22c55e'} stroke={p.locked ? '#ef4444' : '#94a3b8'} strokeWidth={2} />
            <text x={x + 16} y={y + 4} fill="#94a3b8" fontSize={8}>
              {p.name.split(' ')[0]}
            </text>
          </g>
        );
      })}

      {/* Signals on main line */}
      {signals
        .filter((s) => s.id !== 'LS01')
        .map((sig) => (
          <SignalLamp
            key={sig.id}
            id={sig.id}
            name={sig.name}
            aspect={sig.aspect}
            x={mainLineX + (sig.direction === 'up' ? 50 : -50)}
            y={chainageToY(sig.chainage)}
            selected={activeFromSignal === sig.id}
            routeTarget={!!activeFromSignal && activeFromSignal !== sig.id}
            onClick={() => onSignalClick(sig.id)}
          />
        ))}

      {/* Lime Street signal */}
      {signals
        .filter((s) => s.id === 'LS01')
        .map((sig) => (
          <SignalLamp
            key={sig.id}
            id={sig.id}
            name={sig.name}
            aspect={sig.aspect}
            x={limeStreetX - 40}
            y={chainageToY(sig.chainage)}
            selected={activeFromSignal === sig.id}
            routeTarget={!!activeFromSignal && activeFromSignal !== sig.id}
            onClick={() => onSignalClick(sig.id)}
          />
        ))}

      {/* Trains */}
      {trains.map((t) => {
        const y = chainageToY(t.chainage);
        const color = t.type === 'emu' ? '#22d3ee' : '#f97316';
        return (
          <g key={t.id} transform={`translate(${mainLineX}, ${y})`}>
            <rect
              x={-22}
              y={-6}
              width={44}
              height={12}
              rx={3}
              fill={t.atc.tpwsBrake ? '#ef4444' : color}
              stroke="#fff"
              strokeWidth={1}
              opacity={0.95}
            />
            <text x={0} y={3} textAnchor="middle" fill="#0a0f1a" fontSize={8} fontWeight={700} fontFamily="monospace">
              {t.headcode}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
