import type { Point, Route, Signal, SignalAspect, SimState, TrackSection } from '../types';

export function sectionAtChainage(
  sections: Record<string, TrackSection>,
  chainage: number,
): string | null {
  for (const section of Object.values(sections)) {
    if (chainage >= section.fromChainage && chainage <= section.toChainage) {
      return section.id;
    }
  }
  return null;
}

export function isSectionClear(
  sections: Record<string, TrackSection>,
  sectionId: string,
  excludeTrainId?: string,
): boolean {
  const section = sections[sectionId];
  if (!section) return false;
  return section.occupiedBy === null || section.occupiedBy === excludeTrainId;
}

export function areSectionsClear(
  sections: Record<string, TrackSection>,
  sectionIds: string[],
  excludeTrainId?: string,
): boolean {
  return sectionIds.every((id) => isSectionClear(sections, id, excludeTrainId));
}

export function findRoute(
  routes: Record<string, Route>,
  fromSignal: string,
  toSignal: string,
): Route | null {
  return (
    Object.values(routes).find(
      (r) => r.fromSignal === fromSignal && r.toSignal === toSignal,
    ) ?? null
  );
}

export function canSetRoute(state: SimState, route: Route): boolean {
  if (!areSectionsClear(state.sections, route.sections)) return false;

  for (const rp of route.points) {
    const point = state.points[rp.id];
    if (!point) return false;
    if (point.locked && point.position !== rp.position) return false;
  }

  const fromSig = state.signals[route.fromSignal];
  if (!fromSig) return false;

  return true;
}

export function setRoute(state: SimState, route: Route): SimState {
  const points = { ...state.points };
  for (const rp of route.points) {
    const point = points[rp.id];
    if (point) {
      points[rp.id] = { ...point, position: rp.position, locked: true };
    }
  }

  const signals = { ...state.signals };
  const fromSig = signals[route.fromSignal];
  if (fromSig) {
    const aspect = fromSig.approachControlled ? 'Y' : 'G';
    signals[route.fromSignal] = { ...fromSig, aspect };
  }

  return {
    ...state,
    points,
    signals,
    activeRoute: null,
    messages: [
      ...state.messages.slice(-49),
      {
        id: `msg-${Date.now()}`,
        time: state.simTime,
        level: 'info',
        text: `Route set: ${route.name} (${route.fromSignal} → ${route.toSignal})`,
      },
    ],
  };
}

export function aspectForTrain(
  signal: Signal,
  sections: Record<string, TrackSection>,
  routeSections: string[],
): SignalAspect {
  if (!areSectionsClear(sections, routeSections)) return 'R';

  const berthClear = isSectionClear(sections, signal.berthSection);
  if (!berthClear) return 'R';

  if (signal.approachControlled) return 'Y';
  return 'G';
}

export function replaceSignalAfterTrain(
  signals: Record<string, Signal>,
  signalId: string,
): Record<string, Signal> {
  const sig = signals[signalId];
  if (!sig || !sig.autoReplace) return signals;
  return { ...signals, [signalId]: { ...sig, aspect: 'R' } };
}

export function unlockPointsForRoute(
  points: Record<string, Point>,
  route: Route,
): Record<string, Point> {
  const updated = { ...points };
  for (const rp of route.points) {
    const point = updated[rp.id];
    if (point) {
      updated[rp.id] = { ...point, locked: false };
    }
  }
  return updated;
}

export function getSignalAhead(
  signals: Record<string, Signal>,
  chainage: number,
  direction: 'up' | 'down',
): Signal | null {
  const all = Object.values(signals);
  if (direction === 'up') {
    return all.filter((s) => s.chainage > chainage + 0.02).sort((a, b) => a.chainage - b.chainage)[0] ?? null;
  }
  return all.filter((s) => s.chainage < chainage - 0.02).sort((a, b) => b.chainage - a.chainage)[0] ?? null;
}

export function aspectAllowsMovement(aspect: SignalAspect): boolean {
  return aspect === 'G' || aspect === 'Y' || aspect === 'YY';
}

export function mphToKms(mph: number): number {
  return mph * 0.00044704; // miles/hour to km/s
}

export function speedLimitForAspect(aspect: SignalAspect, sectionLimitMph: number): number {
  const limit = mphToKms(sectionLimitMph);
  switch (aspect) {
    case 'R':
      return 0;
    case 'Y':
      return Math.min(limit, mphToKms(15));
    case 'YY':
      return Math.min(limit, mphToKms(25));
    case 'G':
      return limit;
  }
}
