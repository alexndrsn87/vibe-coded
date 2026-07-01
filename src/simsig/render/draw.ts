import { CROSSOVERS, STATIONS, STOCK, TOTAL_PANEL_STEPS } from '../data/network';
import type { GameState } from '../engine/types';

export const TRACK_Y = 130;
export const MARGIN_LEFT = 60;
export const MARGIN_RIGHT = 210; // room for the Southport platform fan
export const SIGNAL_LANE_Y = TRACK_Y + 34;
export const PLATFORM_LANE_HEIGHT = 30;

export interface Hotspot {
  kind: 'signal' | 'platform' | 'station' | 'crossover';
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tooltip: string;
}

export interface Layout {
  width: number;
  height: number;
  spacing: number;
  stationX: Record<string, number>;
  hotspots: Hotspot[];
}

export function computeLayout(containerWidth: number, height: number): Layout {
  const usableWidth = Math.max(containerWidth - MARGIN_LEFT - MARGIN_RIGHT, 400);
  const spacing = usableWidth / TOTAL_PANEL_STEPS;
  const stationX: Record<string, number> = {};
  STATIONS.forEach((s) => {
    stationX[s.id] = MARGIN_LEFT + s.panelIndex * spacing;
  });

  return { width: containerWidth, height, spacing, stationX, hotspots: [] };
}

const ASPECT_COLORS: Record<string, string> = { R: '#ef4444', Y: '#eab308', YY: '#facc15', G: '#22c55e' };

function drawSignalLamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  aspect: string,
  controlled: boolean,
  selected: boolean,
  awaitingRoute: boolean,
) {
  const w = controlled ? 20 : 14;
  const h = controlled ? 30 : 22;

  ctx.save();
  ctx.beginPath();
  const radius = 4;
  ctx.moveTo(x - w / 2 + radius, y - h / 2);
  ctx.arcTo(x + w / 2, y - h / 2, x + w / 2, y + h / 2, radius);
  ctx.arcTo(x + w / 2, y + h / 2, x - w / 2, y + h / 2, radius);
  ctx.arcTo(x - w / 2, y + h / 2, x - w / 2, y - h / 2, radius);
  ctx.arcTo(x - w / 2, y - h / 2, x + w / 2, y - h / 2, radius);
  ctx.closePath();
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.lineWidth = selected ? 3 : controlled ? 2 : 1;
  ctx.strokeStyle = selected ? '#22d3ee' : controlled ? (awaitingRoute ? '#f59e0b' : '#64748b') : '#475569';
  ctx.stroke();
  ctx.restore();

  const dotR = controlled ? 3.4 : 2.6;
  const positions = controlled ? [-8, 0, 8] : [-6, 0, 6];
  const order = ['R', 'Y', 'G'];
  order.forEach((a, i) => {
    const lit = aspect === a || (aspect === 'YY' && a === 'Y');
    ctx.beginPath();
    ctx.arc(x, y + positions[i], dotR, 0, Math.PI * 2);
    ctx.fillStyle = lit ? ASPECT_COLORS[aspect] : '#1e293b';
    ctx.fill();
    if (lit) {
      ctx.save();
      ctx.shadowColor = ASPECT_COLORS[aspect];
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }
  });
}

export function draw(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  state: GameState,
  hoveredId: string | null,
): Hotspot[] {
  const { width, height, spacing, stationX } = layout;
  const hotspots: Hotspot[] = [];

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#080b14';
  ctx.fillRect(0, 0, width, height);

  // Subtle grid
  ctx.strokeStyle = 'rgba(148,163,184,0.05)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx < width; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, height);
    ctx.stroke();
  }

  const lastStation = STATIONS[STATIONS.length - 1];
  const lineEndX = stationX[lastStation.id];

  // Main running line (double-rail look)
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(MARGIN_LEFT - 20, TRACK_Y);
  ctx.lineTo(lineEndX, TRACK_Y);
  ctx.stroke();

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(MARGIN_LEFT - 20, TRACK_Y - 4);
  ctx.lineTo(lineEndX, TRACK_Y - 4);
  ctx.moveTo(MARGIN_LEFT - 20, TRACK_Y + 4);
  ctx.lineTo(lineEndX, TRACK_Y + 4);
  ctx.stroke();

  // Track circuit occupancy overlay (red = occupied)
  ctx.lineWidth = 9;
  for (const section of Object.values(state.sections)) {
    if (!section.occupiedBy) continue;
    const fromStation = STATIONS.find((s) => s.mile === section.fromMile);
    const toStation = STATIONS.find((s) => s.mile === section.toMile);
    const x1 = fromStation ? stationX[fromStation.id] : MARGIN_LEFT;
    const x2 = toStation ? stationX[toStation.id] : lineEndX;
    ctx.strokeStyle = 'rgba(239,68,68,0.55)';
    ctx.beginPath();
    ctx.moveTo(x1, TRACK_Y);
    ctx.lineTo(x2, TRACK_Y);
    ctx.stroke();
  }

  // Route highlight into the selected/ set Southport platform
  if (state.southportRouteSet !== null) {
    const platIdx = state.southportRouteSet;
    const platY = TRACK_Y + (platIdx - 2) * PLATFORM_LANE_HEIGHT;
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 4;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(lineEndX, TRACK_Y);
    ctx.lineTo(lineEndX + 40, platY);
    ctx.lineTo(lineEndX + 150, platY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Crossovers (visual placeholders, inactive except Southport)
  for (const xo of CROSSOVERS) {
    if (xo.id === 'xo-sou') continue; // represented by the platform fan itself
    const nearestStation = STATIONS.reduce((best, s) => (Math.abs(s.mile - xo.mile) < Math.abs(best.mile - xo.mile) ? s : best));
    const x = stationX[nearestStation.id];
    ctx.save();
    ctx.translate(x, TRACK_Y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
    hotspots.push({
      kind: 'crossover',
      id: xo.id,
      x: x - 6,
      y: TRACK_Y - 6,
      w: 12,
      h: 12,
      tooltip: `${xo.name} — crossover point. Inactive in Phase 1; short workings and turnbacks arrive in a later phase.`,
    });
  }

  // Stations
  STATIONS.forEach((s) => {
    const x = stationX[s.id];
    ctx.strokeStyle = s.underground ? '#7c3aed' : '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, TRACK_Y - 10);
    ctx.lineTo(x, TRACK_Y + 10);
    ctx.stroke();

    ctx.save();
    ctx.translate(x, TRACK_Y - 16);
    ctx.rotate(-Math.PI / 5);
    ctx.fillStyle = s.underground ? '#c4b5fd' : '#cbd5e1';
    ctx.font = '11px "Space Grotesk", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(s.name, 0, 0);
    ctx.restore();

    hotspots.push({
      kind: 'station',
      id: s.id,
      x: x - 8,
      y: TRACK_Y - 10,
      w: 16,
      h: 20,
      tooltip: `${s.name}${s.underground ? ' (underground core)' : ''} — mile ${s.mile.toFixed(2)} from Hunts Cross.`,
    });
  });

  // Automatic + controlled signals
  Object.values(state.signals).forEach((sig) => {
    const station = STATIONS.find((s) => `sig-${s.id}-up` === sig.id);
    if (!station) return;
    const x = stationX[station.id];
    const y = SIGNAL_LANE_Y;
    const controlled = sig.kind === 'controlled';
    const selected = state.activeSelection?.fromSignalId === sig.id;
    const awaitingRoute = controlled && state.southportRouteSet === null && sig.aspect === 'R';
    drawSignalLamp(ctx, x, y, sig.aspect, controlled, selected, awaitingRoute);

    ctx.fillStyle = hoveredId === sig.id ? '#e2e8f0' : '#64748b';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(sig.label, x, y + (controlled ? 24 : 18));

    hotspots.push({
      kind: 'signal',
      id: sig.id,
      x: x - (controlled ? 12 : 9),
      y: y - (controlled ? 17 : 13),
      w: controlled ? 24 : 18,
      h: controlled ? 34 : 26,
      tooltip: controlled
        ? `${sig.label} — controlled signal, entry to Southport. Aspect: ${sig.aspect}. ${
            state.southportRouteSet === null
              ? 'Click to select, then click a platform to set the route.'
              : `Route set to Platform ${state.southportRouteSet}. Click to cancel.`
          }`
        : `${sig.label} — automatic signal. Aspect: ${sig.aspect}.`,
    });
  });

  // Southport platform fan
  const souX = lineEndX;
  for (let p = 1; p <= 3; p++) {
    const platY = TRACK_Y + (p - 2) * PLATFORM_LANE_HEIGHT;
    const occupiedTrain = state.platformOccupancy[p];
    const isRouteTarget = state.southportRouteSet === p;
    const isSelectable = !!state.activeSelection;

    ctx.strokeStyle = occupiedTrain ? 'rgba(239,68,68,0.6)' : isRouteTarget ? '#22c55e' : '#334155';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(souX + 40, platY);
    ctx.lineTo(souX + 150, platY);
    ctx.stroke();

    const boxX = souX + 160;
    const boxW = 46;
    const boxH = 22;
    ctx.fillStyle = isSelectable ? 'rgba(34,211,238,0.15)' : 'rgba(30,41,59,0.9)';
    ctx.strokeStyle = isSelectable ? '#22d3ee' : '#475569';
    ctx.lineWidth = isSelectable ? 2 : 1;
    ctx.beginPath();
    ctx.roundRect(boxX, platY - boxH / 2, boxW, boxH, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 11px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Plat ${p}`, boxX + boxW / 2, platY + 4);

    hotspots.push({
      kind: 'platform',
      id: `plat-${p}`,
      x: boxX,
      y: platY - boxH / 2,
      w: boxW,
      h: boxH,
      tooltip: occupiedTrain
        ? `Southport Platform ${p} — occupied.`
        : `Southport Platform ${p} — clear. ${isSelectable ? 'Click to route the train in here.' : ''}`,
    });
  }

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('750V DC third rail', MARGIN_LEFT - 20, TRACK_Y + 46);

  // Trains
  state.trains.forEach((train) => {
    let x = mileToX(train.mile, layout);
    let y = TRACK_Y;
    if (train.state === 'arrived' && train.targetPlatform) {
      y = TRACK_Y + (train.targetPlatform - 2) * PLATFORM_LANE_HEIGHT;
      x = souX + 95;
    }
    const w = 34;
    const h = 13;
    const stock = STOCK[train.stock];
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = train.state === 'arrived' ? '#22c55e' : '#22d3ee';
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(train.headcode, 0, 3);
    ctx.restore();

    ctx.fillStyle = '#475569';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    const label = train.state === 'arrived' ? `${stock.name} · arrived` : `${stock.name} · ${Math.round(train.speedMph)} mph`;
    ctx.fillText(label, x, y - 22);
  });

  return hotspots;
}

export function mileToX(mile: number, layout: Layout): number {
  const { spacing } = layout;
  // Interpolate between the two bounding stations by mile fraction.
  for (let i = 0; i < STATIONS.length - 1; i++) {
    const a = STATIONS[i];
    const b = STATIONS[i + 1];
    if (mile >= a.mile && mile <= b.mile) {
      const t = (mile - a.mile) / (b.mile - a.mile || 1);
      const xa = layout.stationX[a.id];
      const xb = layout.stationX[b.id];
      return xa + (xb - xa) * t;
    }
  }
  const last = STATIONS[STATIONS.length - 1];
  return layout.stationX[last.id] ?? spacing;
}

export function hitTest(hotspots: Hotspot[], x: number, y: number, padding = 6): Hotspot | null {
  for (let i = hotspots.length - 1; i >= 0; i--) {
    const h = hotspots[i];
    if (x >= h.x - padding && x <= h.x + h.w + padding && y >= h.y - padding && y <= h.y + h.h + padding) {
      return h;
    }
  }
  return null;
}
