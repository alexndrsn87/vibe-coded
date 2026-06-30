import { SIM_START_TIME, TIMETABLE } from '../data/northernLine';
import type { SimMessage, SimMode, SimSpeed, SimState, Train, TimetableEntry } from '../types';
import {
  areSectionsClear,
  aspectAllowsMovement,
  findRoute,
  getSignalAhead,
  isSectionClear,
  replaceSignalAfterTrain,
  sectionAtChainage,
  setRoute,
  speedLimitForAspect,
  mphToKms,
} from './signalling';
import {
  POINTS,
  ROUTES,
  SECTIONS,
  SIGNALS,
  STATIONS,
} from '../data/northernLine';

let messageCounter = 0;

function cloneSections() {
  return Object.fromEntries(SECTIONS.map((s) => [s.id, { ...s, occupiedBy: null }]));
}

function cloneSignals() {
  return Object.fromEntries(SIGNALS.map((s) => [s.id, { ...s }]));
}

function clonePoints() {
  return Object.fromEntries(POINTS.map((p) => [p.id, { ...p }]));
}

function cloneRoutes() {
  return Object.fromEntries(ROUTES.map((r) => [r.id, { ...r }]));
}

export function createInitialState(): SimState {
  return {
    running: false,
    paused: true,
    mode: 'nx',
    speed: 1,
    simTime: SIM_START_TIME,
    startTime: SIM_START_TIME,
    sections: cloneSections(),
    signals: cloneSignals(),
    points: clonePoints(),
    routes: cloneRoutes(),
    stations: STATIONS,
    trains: [],
    activeRoute: null,
    score: { trainsHandled: 0, totalDelay: 0, spadEvents: 0, onTimePercent: 100 },
    messages: [
      {
        id: 'welcome',
        time: SIM_START_TIME,
        level: 'info',
        text: 'Merseyside Northern Line — click a signal, then its destination to set a route.',
      },
    ],
  };
}

function addMessage(
  state: SimState,
  level: SimMessage['level'],
  text: string,
): SimMessage[] {
  messageCounter += 1;
  return [
    ...state.messages.slice(-49),
    { id: `msg-${messageCounter}`, time: state.simTime, level, text },
  ];
}

function createTrainFromEntry(entry: TimetableEntry): Train {
  const maxSpeed = entry.type === 'emu' ? 0.009 : 0.018; // km/s (~20mph EMU, ~40mph DMU)
  return {
    id: entry.id,
    headcode: entry.headcode,
    type: entry.type,
    serviceId: entry.id,
    destination: entry.destination,
    direction: entry.direction,
    chainage: entry.originChainage,
    speed: 0,
    maxSpeed,
    length: entry.type === 'emu' ? 0.06 : 0.08,
    platformStopId: null,
    state: 'waiting',
    delaySeconds: 0,
    scheduledChainage: entry.originChainage,
    scheduledTime: entry.departTime,
    atc: { awsActive: false, tpwsBrake: false, driverAck: true, overspeed: false },
  };
}

function spawnDueTrains(state: SimState): SimState {
  const spawnedIds = new Set(state.trains.map((t) => t.id));
  const newTrains: Train[] = [];

  for (const entry of TIMETABLE) {
    if (spawnedIds.has(entry.id)) continue;
    if (state.simTime >= entry.departTime && state.simTime < entry.departTime + 120) {
      newTrains.push(createTrainFromEntry(entry));
    }
  }

  if (newTrains.length === 0) return state;

  return {
    ...state,
    trains: [...state.trains, ...newTrains],
    messages: addMessage(
      state,
      'info',
      `Train ${newTrains.map((t) => t.headcode).join(', ')} entered the panel.`,
    ),
  };
}

function updateSectionOccupancy(sections: SimState['sections'], trains: Train[]) {
  const updated = Object.fromEntries(
    Object.entries(sections).map(([id, s]) => [id, { ...s, occupiedBy: null as string | null }]),
  );

  for (const train of trains) {
    const tail = train.direction === 'up' ? train.chainage - train.length : train.chainage;
    const head = train.direction === 'up' ? train.chainage : train.chainage + train.length;

    for (const section of Object.values(updated)) {
      const overlaps =
        (head >= section.fromChainage && tail <= section.toChainage) ||
        (tail <= section.toChainage && head >= section.fromChainage);
      if (overlaps) {
        section.occupiedBy = train.id;
      }
    }
  }

  return updated;
}

function nextStopForTrain(train: Train, simTime: number): { stationId: string; arriveTime: number; departTime: number } | null {
  const entry = TIMETABLE.find((t) => t.id === train.serviceId);
  if (!entry) return null;

  for (const stop of entry.stops) {
    if (simTime <= stop.departTime + 30) {
      const station = STATIONS.find((s) => s.id === stop.stationId);
      if (station && Math.abs(train.chainage - station.chainage) > 0.05) {
        return stop;
      }
      if (station && train.state === 'stopped' && simTime < stop.departTime) {
        return stop;
      }
    }
  }
  return null;
}

function moveTrain(
  train: Train,
  state: SimState,
  dt: number,
): { train: Train; spad: boolean } {
  let spad = false;
  const sections = state.sections;
  const sectionId = sectionAtChainage(sections, train.chainage);
  const section = sectionId ? sections[sectionId] : null;
  const sectionLimit = section?.speedLimit ?? 20;

  const signalAhead = getSignalAhead(state.signals, train.chainage, train.direction);
  const signalAspect = signalAhead?.aspect ?? 'G';
  const aspectSpeed = speedLimitForAspect(signalAspect, sectionLimit);

  const nextStop = nextStopForTrain(train, state.simTime);
  let targetSpeed = aspectSpeed;

  // Station approach braking
  if (nextStop) {
    const station = STATIONS.find((s) => s.id === nextStop.stationId);
    if (station) {
      const dist = Math.abs(station.chainage - train.chainage);
      if (dist < 0.15) targetSpeed = Math.min(targetSpeed, mphToKms(10));
      if (dist < 0.05) targetSpeed = 0;
    }
  }

  // ATC / TPWS mode
  let atc = { ...train.atc };
  if (state.mode === 'atc') {
    atc.awsActive = signalAspect === 'Y' || signalAspect === 'R';
    if (signalAspect === 'R' && train.speed > 0.002) {
      atc.tpwsBrake = true;
      targetSpeed = 0;
      if (!train.atc.tpwsBrake) spad = true;
    } else {
      atc.tpwsBrake = false;
    }
    if (atc.awsActive && !atc.driverAck) {
      targetSpeed = 0;
    }
    atc.overspeed = train.speed > mphToKms(sectionLimit) * 1.1;
    if (atc.overspeed) targetSpeed = Math.min(targetSpeed, mphToKms(sectionLimit) * 0.7);
  }

  // Departure from stop
  if (train.state === 'stopped' && nextStop) {
    if (state.simTime >= nextStop.departTime) {
      const canDepart = !signalAhead || aspectAllowsMovement(signalAspect);
      if (canDepart && isSectionClear(sections, sectionId ?? '', train.id)) {
        return {
          train: { ...train, state: 'departing', atc },
          spad: false,
        };
      }
    }
    return { train: { ...train, speed: 0, atc }, spad: false };
  }

  if (train.state === 'waiting' && train.speed === 0) {
    const canMove = !signalAhead || aspectAllowsMovement(signalAspect);
    if (canMove) {
      train = { ...train, state: 'running' };
    } else {
      return {
        train: { ...train, delaySeconds: train.delaySeconds + dt, state: 'waiting', atc },
        spad: false,
      };
    }
  }

  // Acceleration / braking
  const accel = train.type === 'emu' ? 0.004 : 0.003;
  const brake = 0.008;
  let newSpeed = train.speed;

  if (newSpeed < targetSpeed) {
    newSpeed = Math.min(targetSpeed, newSpeed + accel * dt);
  } else if (newSpeed > targetSpeed) {
    newSpeed = Math.max(targetSpeed, newSpeed - brake * dt);
    train = { ...train, state: 'braking' };
  } else {
    train = { ...train, state: newSpeed > 0 ? 'running' : 'stopped' };
  }

  const direction = train.direction === 'up' ? 1 : -1;
  const newChainage = train.chainage + direction * newSpeed * dt;

  // Check if arrived at station
  if (nextStop && newSpeed < mphToKms(3)) {
    const station = STATIONS.find((s) => s.id === nextStop.stationId);
    if (station && Math.abs(newChainage - station.chainage) < 0.03) {
      return {
        train: {
          ...train,
          chainage: station.chainage,
          speed: 0,
          state: 'stopped',
          delaySeconds: train.delaySeconds + Math.max(0, state.simTime - nextStop.arriveTime),
          atc,
        },
        spad: false,
      };
    }
  }

  // Remove trains that have left the panel
  if (newChainage < -0.5 || newChainage > 7.5) {
    return {
      train: { ...train, chainage: newChainage, speed: 0, state: 'running', atc },
      spad: false,
    };
  }

  return {
    train: { ...train, chainage: newChainage, speed: newSpeed, atc },
    spad,
  };
}

function tickSimulation(state: SimState, dt: number): SimState {
  let next = spawnDueTrains(state);
  let spadCount = 0;

  const updatedTrains: Train[] = [];
  for (const train of next.trains) {
    const result = moveTrain(train, next, dt);
    if (result.spad) spadCount += 1;
    if (result.train.chainage >= -0.5 && result.train.chainage <= 7.5) {
      updatedTrains.push(result.train);
    } else if (train.chainage >= -0.5 && train.chainage <= 7.5) {
      next = {
        ...next,
        score: {
          ...next.score,
          trainsHandled: next.score.trainsHandled + 1,
          totalDelay: next.score.totalDelay + train.delaySeconds,
        },
      };
    }
  }

  const sections = updateSectionOccupancy(next.sections, updatedTrains);

  // TORR - auto replace signals when berth clears
  let signals = { ...next.signals };
  if (next.mode === 'nx') {
    for (const sig of Object.values(signals)) {
      if (sig.aspect !== 'R' && sig.autoReplace) {
        const berth = sections[sig.berthSection];
        if (berth && berth.occupiedBy === null) {
          // Keep route until train fully passes - simplified: revert after 3s
        }
      }
    }
    for (const train of updatedTrains) {
      for (const sig of Object.values(signals)) {
        if (sig.aspect !== 'R') {
          const passed =
            (train.direction === 'up' && train.chainage > sig.chainage + 0.05) ||
            (train.direction === 'down' && train.chainage < sig.chainage - 0.05);
          if (passed && sections[sig.berthSection]?.occupiedBy === null) {
            signals = replaceSignalAfterTrain(signals, sig.id);
          }
        }
      }
    }
  }

  // Approach control - step Y to G when berth clear
  for (const sig of Object.values(signals)) {
    if (sig.approachControlled && sig.aspect === 'Y') {
      const berthClear = isSectionClear(sections, sig.berthSection);
      if (berthClear) {
        signals[sig.id] = { ...sig, aspect: 'G' };
      }
    }
  }

  const totalDelay = updatedTrains.reduce((s, t) => s + t.delaySeconds, 0);
  const onTime = updatedTrains.length
    ? Math.max(0, 100 - (totalDelay / updatedTrains.length) * 2)
    : 100;

  let messages = next.messages;
  if (spadCount > 0) {
    messages = addMessage(
      { ...next, messages },
      'alert',
      `TPWS brake demand — ${spadCount} SPAD risk event(s)!`,
    );
  }

  return {
    ...next,
    simTime: next.simTime + dt,
    trains: updatedTrains,
    sections,
    signals,
    score: {
      ...next.score,
      spadEvents: next.score.spadEvents + spadCount,
      totalDelay,
      onTimePercent: Math.round(onTime),
    },
    messages,
  };
}

export function reduceSimState(state: SimState, action: { type: string; payload?: unknown }): SimState {
  switch (action.type) {
    case 'START':
      return { ...state, running: true, paused: false };

    case 'PAUSE':
      return { ...state, paused: true };

    case 'RESUME':
      return { ...state, paused: false };

    case 'SET_SPEED':
      return { ...state, speed: action.payload as SimSpeed };

    case 'SET_MODE':
      return {
        ...state,
        mode: action.payload as SimMode,
        messages: addMessage(
          state,
          'info',
          `Mode: ${action.payload === 'atc' ? 'ATC (AWS/TPWS active)' : 'NX Signalling'}`,
        ),
      };

    case 'SELECT_SIGNAL': {
      const signalId = action.payload as string;
      if (state.activeRoute?.fromSignal === signalId) {
        return { ...state, activeRoute: null };
      }
      return { ...state, activeRoute: { fromSignal: signalId, toSignal: null } };
    }

    case 'SET_ROUTE': {
      const toSignal = action.payload as string;
      if (!state.activeRoute) return state;
      const route = findRoute(state.routes, state.activeRoute.fromSignal, toSignal);
      if (!route) {
        return {
          ...state,
          activeRoute: null,
          messages: addMessage(state, 'warn', `No route from ${state.activeRoute.fromSignal} to ${toSignal}`),
        };
      }
      if (!canSetRoute(state, route)) {
        return {
          ...state,
          activeRoute: null,
          messages: addMessage(state, 'warn', `Route blocked: ${route.name}`),
        };
      }
      return setRoute(state, route);
    }

    case 'TOGGLE_POINT': {
      const pointId = action.payload as string;
      const point = state.points[pointId];
      if (!point || point.locked) return state;
      const newPos = point.position === 'normal' ? 'reverse' : 'normal';
      return {
        ...state,
        points: { ...state.points, [pointId]: { ...point, position: newPos } },
        messages: addMessage(state, 'info', `Point ${point.name} set ${newPos}`),
      };
    }

    case 'TICK': {
      if (!state.running || state.paused) return state;
      const dt = (action.payload as number) * state.speed;
      return tickSimulation(state, dt);
    }

    case 'RESET':
      return createInitialState();

    default:
      return state;
  }
}

function canSetRoute(state: SimState, route: import('../types').Route): boolean {
  if (!areSectionsClear(state.sections, route.sections)) return false;
  for (const rp of route.points) {
    const point = state.points[rp.id];
    if (point?.locked && point.position !== rp.position) return false;
  }
  return true;
}

export function formatSimTime(seconds: number): string {
  const h = Math.floor(seconds / 3600) % 24;
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
