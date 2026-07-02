import { STATIONS, ROUTE_LENGTH_MILES } from '../data/network';
import {
  computeAutoAspect,
  createSections,
  isSouthportSignal,
  sectionIdsInOrder,
  SOUTHPORT_APPROACH_SECTION,
} from './signals';
import { stepTrain, trainLengthMiles } from './train';
import type { Aspect, GameState, LogEntry, SessionLengthMinutes, Signal, SessionSummary, Train } from './types';
import { createSignals } from './signals';

const SECTION_ORDER = sectionIdsInOrder();
export const SAVE_KEY = 'merseyrail-simsig-phase2-save-v1';
const STOP_EPSILON_MILES = 0.008;

let logCounter = 0;

function pushLog(log: LogEntry[], time: number, level: LogEntry['level'], text: string): LogEntry[] {
  logCounter += 1;
  return [...log.slice(-49), { id: `log-${logCounter}`, time, level, text }];
}

export function createInitialState(): GameState {
  const train: Train = {
    id: 't-2s05',
    headcode: '2S05',
    stock: 'class777',
    direction: 'up',
    mile: 0,
    speedMph: 0,
    state: 'stopped',
    targetPlatform: null,
    dwellUntil: null,
    lastStoppedStationId: null,
  };

  return {
    running: false,
    paused: true,
    speed: 1,
    simTimeSec: 0,
    sections: createSections(),
    signals: createSignals(),
    trains: [train],
    platformOccupancy: { 1: null, 2: null, 3: null },
    activeSelection: null,
    southportRouteSet: null,
    routesSet: {},
    phaseComplete: false,
    sessionLengthMinutes: 15,
    sessionEndsAt: null,
    sessionEnded: false,
    sessionSummary: null,
    log: pushLog(
      [],
      0,
      'info',
      'Service 2S05 is ready to depart Hunts Cross for Southport, calling at every station. This is a 15-minute session — set routes at Hall Road, Formby and Southport to keep it moving.',
    ),
  };
}

/** Which block section index (0-based, into SECTION_ORDER) a mile position falls in. */
function sectionIndexForMile(mile: number): number {
  for (let i = 0; i < STATIONS.length - 1; i++) {
    if (mile >= STATIONS[i].mile && mile < STATIONS[i + 1].mile) return i;
  }
  return STATIONS.length - 2;
}

function findSignalForStationIndex(signals: GameState['signals'], stationIdx: number): Signal | null {
  const station = STATIONS[stationIdx];
  return signals[`sig-${station.id}-up`] ?? null;
}

function controlledJunctionSignals(signals: GameState['signals']): Signal[] {
  return Object.values(signals).filter((s) => s.kind === 'controlled' && !isSouthportSignal(s));
}

function recomputeOccupancy(state: GameState): GameState {
  const sections = Object.fromEntries(
    Object.entries(state.sections).map(([id, s]) => [id, { ...s, occupiedBy: null as string | null }]),
  );

  for (const train of state.trains) {
    const len = trainLengthMiles(train);
    const tail = train.mile - len;
    const head = train.mile;
    for (const s of Object.values(sections)) {
      // Strict `>` on fromMile: a train sitting exactly at a signal (e.g.
      // dwelling at a station boundary) has not yet entered the section
      // ahead, so it must not block itself from being granted a route into
      // it. It still fully occupies the section behind (tail <= toMile).
      if (head > s.fromMile && tail <= s.toMile) {
        s.occupiedBy = train.id;
      }
    }
  }

  return { ...state, sections };
}

function recomputeSignals(state: GameState): GameState {
  const signals = { ...state.signals };

  for (const sig of Object.values(signals)) {
    if (sig.kind === 'auto') {
      signals[sig.id] = { ...sig, aspect: computeAutoAspect(state.sections, SECTION_ORDER, sig.protects) };
    }
  }

  // Southport approach — three-platform controlled signal.
  const approach = state.sections[SOUTHPORT_APPROACH_SECTION];
  const southportSig = Object.values(signals).find(isSouthportSignal);
  if (southportSig) {
    let aspect: Aspect = 'R';
    if (!approach?.occupiedBy && state.southportRouteSet !== null) {
      const platformFree = state.platformOccupancy[state.southportRouteSet] === null;
      aspect = platformFree ? 'G' : 'R';
    }
    signals[southportSig.id] = { ...signals[southportSig.id], aspect };
  }

  // Generic single-route controlled junctions (Hall Road, Formby): once the
  // player has set the route and the approach is clear, behave exactly like
  // an automatic signal for aspect purposes (green/yellow/double-yellow
  // depending what's further ahead).
  for (const sig of controlledJunctionSignals(signals)) {
    const routeSet = state.routesSet[sig.id];
    const occupied = !!state.sections[sig.protects]?.occupiedBy;
    const aspect: Aspect = routeSet && !occupied ? computeAutoAspect(state.sections, SECTION_ORDER, sig.protects) : 'R';
    signals[sig.id] = { ...signals[sig.id], aspect };
  }

  return { ...state, signals };
}

/** Auto-release routes at generic controlled junctions once the train has fully passed (TORR). */
function releaseUsedRoutes(state: GameState): GameState {
  let routesSet = state.routesSet;
  let log = state.log;

  for (const sig of controlledJunctionSignals(state.signals)) {
    if (!routesSet[sig.id]) continue;
    const passed = state.trains.some((t) => t.mile > sig.mile + 0.02);
    if (passed) {
      routesSet = { ...routesSet, [sig.id]: false };
      log = pushLog(log, state.simTimeSec, 'info', `Route released at ${sig.label} — set it again for the next service.`);
    }
  }

  return { ...state, routesSet, log };
}

function stepTrains(state: GameState, dtSec: number): GameState {
  let log = state.log;

  const trains = state.trains.map((train) => {
    if (train.state === 'arrived') return train;

    // Dwelling at a station — hold at zero regardless of signal state.
    if (train.dwellUntil !== null) {
      if (state.simTimeSec < train.dwellUntil) {
        return { ...train, speedMph: 0, state: 'stopped' as const };
      }
      const departed = { ...train, dwellUntil: null };
      log = pushLog(log, state.simTimeSec, 'info', `${departed.headcode} is ready to depart ${labelForStation(departed.lastStoppedStationId)}.`);
      return stepOne(departed, state, dtSec);
    }

    return stepOne(train, state, dtSec);
  });

  return { ...state, trains, log };
}

function labelForStation(stationId: string | null): string {
  const station = STATIONS.find((s) => s.id === stationId);
  return station?.name ?? 'the last station';
}

function stepOne(train: Train, state: GameState, dtSec: number): Train {
  const currentSectionIdx = sectionIndexForMile(train.mile);
  const nextStationIdx = currentSectionIdx + 1;
  const isFinalStation = nextStationIdx >= STATIONS.length - 1;

  // A train sitting exactly at a station (dwelling, or just arrived) has not
  // yet been granted entry into the section ahead — it must still obey that
  // station's OWN signal. Once it has actually pulled away and is running
  // through the section, the relevant signal to prepare for is the one at
  // the NEXT station (braking distance ahead). Getting this wrong would mean
  // controlled junctions like Hall Road/Formby are silently skipped.
  //
  // The `speedMph === 0` guard matters: the instant a stationary train is
  // granted a green and starts moving, its mile creeps fractionally past
  // the station boundary, which would otherwise make it look like it's
  // occupying (and blocking) the very section it just entered — flipping
  // the signal back to red and stopping it dead. Once it's actually moving,
  // it has already accepted the signal's authority and should look ahead.
  const atStationBoundary =
    train.speedMph === 0 && Math.abs(train.mile - STATIONS[currentSectionIdx].mile) < STOP_EPSILON_MILES;
  const governingStationIdx = atStationBoundary ? currentSectionIdx : nextStationIdx;

  let governingAspect: Aspect = 'G';
  let distanceAhead = Infinity;
  let approachingStop: { mile: number } | null = null;

  if (governingStationIdx <= STATIONS.length - 2) {
    const sig = findSignalForStationIndex(state.signals, governingStationIdx);
    if (sig) {
      governingAspect = sig.aspect;
      distanceAhead = STATIONS[governingStationIdx].mile - train.mile;
    }
  }

  if (nextStationIdx <= STATIONS.length - 2) {
    approachingStop = { mile: STATIONS[nextStationIdx].mile };
  } else {
    // Past the last station before Southport — free running into the platform.
    approachingStop = { mile: ROUTE_LENGTH_MILES };
  }

  const updated = stepTrain(train, dtSec, governingAspect, distanceAhead, approachingStop);

  // Arrived at Southport terminus.
  if (
    isFinalStation &&
    updated.speedMph === 0 &&
    Math.abs(updated.mile - ROUTE_LENGTH_MILES) < STOP_EPSILON_MILES &&
    state.southportRouteSet !== null
  ) {
    return { ...updated, state: 'arrived', targetPlatform: state.southportRouteSet };
  }

  // Arrived (dwelling) at an intermediate station for the first time.
  if (
    !isFinalStation &&
    approachingStop &&
    updated.speedMph === 0 &&
    Math.abs(updated.mile - approachingStop.mile) < STOP_EPSILON_MILES
  ) {
    const station = STATIONS[nextStationIdx];
    if (updated.lastStoppedStationId !== station.id) {
      return {
        ...updated,
        mile: station.mile,
        state: 'stopped',
        dwellUntil: state.simTimeSec + station.dwellSec,
        lastStoppedStationId: station.id,
      };
    }
    return { ...updated, state: 'waiting' };
  }

  return updated;
}

function checkArrivals(state: GameState): GameState {
  let platformOccupancy = state.platformOccupancy;
  let log = state.log;
  let phaseComplete = state.phaseComplete;

  for (const train of state.trains) {
    if (train.state === 'arrived' && train.targetPlatform !== null) {
      if (platformOccupancy[train.targetPlatform] !== train.id) {
        platformOccupancy = { ...platformOccupancy, [train.targetPlatform]: train.id };
        log = pushLog(
          log,
          state.simTimeSec,
          'success',
          `Service ${train.headcode} has arrived at Southport Platform ${train.targetPlatform}. Great signalling all the way from Hunts Cross!`,
        );
        phaseComplete = true;
      }
    }
  }

  return { ...state, platformOccupancy, log, phaseComplete };
}

function buildSessionSummary(state: GameState): SessionSummary {
  const train = state.trains[0];
  const distanceMiles = train ? Math.max(0, Math.min(train.mile, ROUTE_LENGTH_MILES)) : 0;
  const percentComplete = Math.round((distanceMiles / ROUTE_LENGTH_MILES) * 100);

  let grade: SessionSummary['grade'] = 'C';
  let headline = 'A tough shift — the Southport line never stops testing you.';
  if (train?.state === 'arrived') {
    grade = 'S';
    headline = 'Perfect run — every route set, service delivered to Southport on the nose.';
  } else if (percentComplete >= 70) {
    grade = 'A';
    headline = 'Strong signalling — the service was well on its way to Southport.';
  } else if (percentComplete >= 40) {
    grade = 'B';
    headline = 'Solid start — a bit more pace at the controlled junctions next time.';
  }

  return { grade, percentComplete, distanceMiles, headline };
}

function checkSessionEnd(state: GameState): GameState {
  if (state.sessionEnded || state.sessionEndsAt === null) return state;
  if (state.simTimeSec < state.sessionEndsAt) return state;

  const summary = buildSessionSummary(state);
  return {
    ...state,
    sessionEnded: true,
    paused: true,
    sessionSummary: summary,
    log: pushLog(
      state.log,
      state.simTimeSec,
      'success',
      `Session complete — grade ${summary.grade}. ${summary.headline}`,
    ),
  };
}

export function tick(state: GameState, dtSec: number): GameState {
  if (!state.running || state.paused) return state;

  let next = { ...state, simTimeSec: state.simTimeSec + dtSec };
  next = recomputeOccupancy(next);
  next = recomputeSignals(next);
  next = stepTrains(next, dtSec);
  next = recomputeOccupancy(next);
  next = releaseUsedRoutes(next);
  next = checkArrivals(next);
  next = checkSessionEnd(next);
  return next;
}

export function start(state: GameState): GameState {
  if (state.running) return { ...state, paused: false };
  return {
    ...state,
    running: true,
    paused: false,
    sessionEndsAt: state.simTimeSec + state.sessionLengthMinutes * 60,
  };
}

export function togglePause(state: GameState): GameState {
  if (state.sessionEnded) return state;
  return { ...state, paused: !state.paused };
}

export function setSpeed(state: GameState, speed: GameState['speed']): GameState {
  return { ...state, speed };
}

export function setSessionLength(state: GameState, minutes: SessionLengthMinutes): GameState {
  if (state.running) return state; // can't change once underway
  return { ...state, sessionLengthMinutes: minutes };
}

export function reset(previousSessionLength?: SessionLengthMinutes): GameState {
  const fresh = createInitialState();
  if (previousSessionLength) fresh.sessionLengthMinutes = previousSessionLength;
  return fresh;
}

/** Player clicks a controlled signal: Southport approach, or a generic single-route junction. */
export function clickSignal(state: GameState, signalId: string): GameState {
  const signal = state.signals[signalId];
  if (!signal) return state;

  if (signal.kind === 'controlled') {
    if (isSouthportSignal(signal)) return clickSouthportSignal(state, signalId);
    return clickGenericJunctionSignal(state, signalId);
  }

  // Automatic signal clicked while a generic junction route is pending —
  // treat it as an attempt to confirm the route (click entry, click exit).
  if (state.activeSelection) {
    const fromSignal = state.signals[state.activeSelection.fromSignalId];
    if (fromSignal && fromSignal.kind === 'controlled' && !isSouthportSignal(fromSignal)) {
      const expected = expectedExitSignalId(fromSignal);
      if (expected === signalId) {
        return completeGenericRoute(state, fromSignal.id);
      }
      return {
        ...state,
        activeSelection: null,
        log: pushLog(state.log, state.simTimeSec, 'warn', `No route from ${fromSignal.label} to ${signal.label}.`),
      };
    }
  }

  return state;
}

function clickSouthportSignal(state: GameState, signalId: string): GameState {
  if (state.southportRouteSet !== null) {
    const approach = state.sections[SOUTHPORT_APPROACH_SECTION];
    if (approach?.occupiedBy) {
      return {
        ...state,
        log: pushLog(state.log, state.simTimeSec, 'warn', 'Cannot cancel — a train is already on the approach.'),
      };
    }
    return {
      ...state,
      southportRouteSet: null,
      activeSelection: null,
      log: pushLog(state.log, state.simTimeSec, 'info', 'Route into Southport cancelled.'),
    };
  }

  if (state.activeSelection?.fromSignalId === signalId) {
    return { ...state, activeSelection: null };
  }

  return { ...state, activeSelection: { fromSignalId: signalId } };
}

function clickGenericJunctionSignal(state: GameState, signalId: string): GameState {
  const signal = state.signals[signalId];
  if (state.routesSet[signalId]) {
    const approach = state.sections[signal.protects];
    if (approach?.occupiedBy) {
      return {
        ...state,
        log: pushLog(state.log, state.simTimeSec, 'warn', `Cannot cancel — a train is already on the approach to ${signal.label}.`),
      };
    }
    return {
      ...state,
      routesSet: { ...state.routesSet, [signalId]: false },
      activeSelection: null,
      log: pushLog(state.log, state.simTimeSec, 'info', `Route at ${signal.label} cancelled.`),
    };
  }

  if (state.activeSelection?.fromSignalId === signalId) {
    return { ...state, activeSelection: null };
  }

  return { ...state, activeSelection: { fromSignalId: signalId } };
}

function expectedExitSignalId(fromSignal: Signal): string | null {
  const stationIdx = STATIONS.findIndex((s) => `sig-${s.id}-up` === fromSignal.id);
  if (stationIdx === -1 || stationIdx + 1 >= STATIONS.length) return null;
  return `sig-${STATIONS[stationIdx + 1].id}-up`;
}

function completeGenericRoute(state: GameState, signalId: string): GameState {
  const signal = state.signals[signalId];
  const section = state.sections[signal.protects];

  if (section?.occupiedBy) {
    return {
      ...state,
      activeSelection: null,
      log: pushLog(state.log, state.simTimeSec, 'warn', `Route conflicts — the section ahead of ${signal.label} is occupied.`),
    };
  }

  const exitId = expectedExitSignalId(signal);
  const exitLabel = exitId ? state.signals[exitId]?.label ?? exitId : 'the next signal';

  return {
    ...state,
    routesSet: { ...state.routesSet, [signalId]: true },
    activeSelection: null,
    log: pushLog(state.log, state.simTimeSec, 'success', `Route set: ${signal.label} signal → ${exitLabel}.`),
  };
}

/** Player clicks a platform marker at Southport to complete the approach route. */
export function clickPlatform(state: GameState, platform: number): GameState {
  if (!state.activeSelection) {
    return {
      ...state,
      log: pushLog(
        state.log,
        state.simTimeSec,
        'warn',
        'Select the BIR-SOU signal first, then choose a platform to route the train into it.',
      ),
    };
  }

  if (state.platformOccupancy[platform]) {
    return {
      ...state,
      activeSelection: null,
      log: pushLog(
        state.log,
        state.simTimeSec,
        'warn',
        `Route conflicts — Platform ${platform} is occupied. Choose a different platform.`,
      ),
    };
  }

  return {
    ...state,
    southportRouteSet: platform,
    activeSelection: null,
    log: pushLog(state.log, state.simTimeSec, 'success', `Route set: BIR-SOU signal → Southport Platform ${platform}.`),
  };
}

export function formatSimTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatCountdown(seconds: number): string {
  const clamped = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function saveGame(state: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (e.g. private browsing) — fail silently.
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}
