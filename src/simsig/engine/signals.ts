import { STATIONS, ROUTE_LENGTH_MILES } from '../data/network';
import type { Aspect, BlockSection, Signal } from './types';

/**
 * Block sections: one per gap between consecutive stations, plus a final
 * section spanning the Southport approach into the platform throat.
 * This mirrors how a real signaller's panel breaks the line into
 * track-circuited blocks.
 */
export function createSections(): Record<string, BlockSection> {
  const sections: Record<string, BlockSection> = {};
  for (let i = 0; i < STATIONS.length - 1; i++) {
    const id = `blk-${STATIONS[i].id}-${STATIONS[i + 1].id}`;
    sections[id] = { id, fromMile: STATIONS[i].mile, toMile: STATIONS[i + 1].mile, occupiedBy: null };
  }
  return sections;
}

export function sectionIdsInOrder(): string[] {
  const ids: string[] = [];
  for (let i = 0; i < STATIONS.length - 1; i++) {
    ids.push(`blk-${STATIONS[i].id}-${STATIONS[i + 1].id}`);
  }
  return ids;
}

/** The final approach section, protected by the controlled Southport signal. */
export const SOUTHPORT_APPROACH_SECTION = sectionIdsInOrder()[sectionIdsInOrder().length - 1];

/** Virtual per-platform sections at Southport (not part of the main block chain). */
export function createPlatformSections(): Record<string, BlockSection> {
  const sections: Record<string, BlockSection> = {};
  for (let p = 1; p <= 3; p++) {
    const id = `plat-sou-${p}`;
    sections[id] = { id, fromMile: ROUTE_LENGTH_MILES, toMile: ROUTE_LENGTH_MILES + 0.05, occupiedBy: null };
  }
  return sections;
}

/**
 * One automatic signal per block, positioned at the start of each section
 * (i.e. at each station, protecting the road ahead to the next station).
 * The final signal before Southport (at Birkdale) is a controlled signal —
 * the player must set a route into a platform before it will clear.
 */
export function createSignals(): Record<string, Signal> {
  const signals: Record<string, Signal> = {};
  const order = sectionIdsInOrder();

  for (let i = 0; i < STATIONS.length - 1; i++) {
    const station = STATIONS[i];
    const sectionId = order[i];
    const isLast = i === STATIONS.length - 2; // Birkdale -> Southport
    const id = `sig-${station.id}-up`;
    signals[id] = {
      id,
      label: `${station.short}${isLast ? '-SOU' : ''}`,
      mile: station.mile,
      direction: 'up',
      kind: isLast ? 'controlled' : 'auto',
      protects: sectionId,
      aspect: 'R',
    };
  }

  return signals;
}

/**
 * Standard 4-aspect automatic signalling logic: look ahead up to two
 * sections beyond the one this signal protects.
 *   - section ahead occupied           -> Red
 *   - section ahead clear, next occ.   -> Yellow
 *   - next clear, one further occ.     -> Double Yellow
 *   - all three clear                  -> Green
 */
export function computeAutoAspect(
  sections: Record<string, BlockSection>,
  order: string[],
  protectsId: string,
): Aspect {
  const idx = order.indexOf(protectsId);
  if (idx === -1) return 'R';

  const s0 = sections[order[idx]];
  if (!s0 || s0.occupiedBy) return 'R';

  const s1 = order[idx + 1] ? sections[order[idx + 1]] : null;
  if (s1 && s1.occupiedBy) return 'Y';

  const s2 = order[idx + 2] ? sections[order[idx + 2]] : null;
  if (s2 && s2.occupiedBy) return 'YY';

  return 'G';
}

export function aspectAllowsEntry(aspect: Aspect): boolean {
  return aspect !== 'R';
}

export function aspectMaxSpeedFactor(aspect: Aspect): number {
  switch (aspect) {
    case 'R':
      return 0;
    case 'Y':
      return 0.35;
    case 'YY':
      return 0.7;
    case 'G':
      return 1;
  }
}
