import { STATIONS, ROUTE_LENGTH_MILES } from '../data/network';
import {
  computeAutoAspect,
  createSections,
  sectionIdsInOrder,
  SOUTHPORT_APPROACH_SECTION,
} from './signals';
import { stepTrain, trainLengthMiles } from './train';
import type { Aspect, GameState, LogEntry, Signal, Train } from './types';
import { createSignals } from './signals';

const SECTION_ORDER = sectionIdsInOrder();
export const SAVE_KEY = 'merseyrail-simsig-phase1-save-v1';

let logCounter = 0;

function pushLog(log: LogEntry[], time: number, level: LogEntry['level'], text: string): LogEntry[] {
  logCounter += 1;
  return [...log.slice(-39), { id: `log-${logCounter}`, time, level, text }];
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
    phaseComplete: false,
    log: pushLog(
      [],
      0,
      'info',
      'Service 2S05 is ready to depart Hunts Cross for Southport. Click the BIR-SOU signal near the end of the line, then choose a platform to let it into Southport.',
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

function recomputeOccupancy(state: GameState): GameState {
  const sections = Object.fromEntries(
    Object.entries(state.sections).map(([id, s]) => [id, { ...s, occupiedBy: null as string | null }]),
  );

  for (const train of state.trains) {
    const len = trainLengthMiles(train);
    const tail = train.mile - len;
    const head = train.mile;
    for (const s of Object.values(sections)) {
      if (head >= s.fromMile && tail <= s.toMile) {
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

  const approach = state.sections[SOUTHPORT_APPROACH_SECTION];
  const birId = Object.values(signals).find((s) => s.kind === 'controlled')?.id;
  if (birId) {
    let aspect: Aspect = 'R';
    if (!approach?.occupiedBy && state.southportRouteSet !== null) {
      const platformFree = state.platformOccupancy[state.southportRouteSet] === null;
      aspect = platformFree ? 'G' : 'R';
    }
    signals[birId] = { ...signals[birId], aspect };
  }

  return { ...state, signals };
}

function stepTrains(state: GameState, dtSec: number): GameState {
  const trains = state.trains.map((train) => {
    if (train.state === 'arrived') return train;

    const currentSectionIdx = sectionIndexForMile(train.mile);
    const nextStationIdx = currentSectionIdx + 1;

    let governingAspect: Aspect = 'G';
    let distanceAhead = Infinity;
    let approachingPlatform: { mile: number } | null = null;

    if (nextStationIdx <= STATIONS.length - 2) {
      const sig = findSignalForStationIndex(state.signals, nextStationIdx);
      if (sig) {
        governingAspect = sig.aspect;
        distanceAhead = STATIONS[nextStationIdx].mile - train.mile;
      }
    } else {
      // Past the last controlled signal — free running into the platform.
      approachingPlatform = { mile: ROUTE_LENGTH_MILES };
    }

    const updated = stepTrain(train, dtSec, governingAspect, distanceAhead, approachingPlatform);

    // Arrival check
    if (
      approachingPlatform &&
      updated.speedMph === 0 &&
      Math.abs(updated.mile - ROUTE_LENGTH_MILES) < 0.01 &&
      state.southportRouteSet !== null
    ) {
      return { ...updated, state: 'arrived' as const, targetPlatform: state.southportRouteSet };
    }

    return updated;
  });

  return { ...state, trains };
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
          `Service ${train.headcode} has arrived at Southport Platform ${train.targetPlatform}. Phase 1 complete — nice signalling!`,
        );
        phaseComplete = true;
      }
    }
  }

  return { ...state, platformOccupancy, log, phaseComplete };
}

export function tick(state: GameState, dtSec: number): GameState {
  if (!state.running || state.paused) return state;

  let next = { ...state, simTimeSec: state.simTimeSec + dtSec };
  next = recomputeOccupancy(next);
  next = recomputeSignals(next);
  next = stepTrains(next, dtSec);
  next = recomputeOccupancy(next);
  next = checkArrivals(next);
  return next;
}

export function start(state: GameState): GameState {
  return { ...state, running: true, paused: false };
}

export function togglePause(state: GameState): GameState {
  return { ...state, paused: !state.paused };
}

export function setSpeed(state: GameState, speed: GameState['speed']): GameState {
  return { ...state, speed };
}

export function reset(): GameState {
  return createInitialState();
}

/** Player clicks the controlled signal (Birkdale approach to Southport). */
export function clickControlledSignal(state: GameState, signalId: string): GameState {
  const signal = state.signals[signalId];
  if (!signal || signal.kind !== 'controlled') return state;

  if (state.southportRouteSet !== null) {
    // Toggle off: cancel the route, provided the train hasn't already
    // committed to the final section.
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

/** Player clicks a platform marker at Southport to complete the route. */
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
