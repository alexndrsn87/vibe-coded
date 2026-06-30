/** Merseyside Northern Line signalling simulation types */

export type SignalAspect = 'R' | 'Y' | 'YY' | 'G';
export type PointPosition = 'normal' | 'reverse';
export type TrainType = 'emu' | 'dmu';
export type SimMode = 'nx' | 'atc';
export type SimSpeed = 1 | 2 | 4 | 8;

export interface Station {
  id: string;
  name: string;
  chainage: number;
  platforms: Platform[];
}

export interface Platform {
  id: string;
  name: string;
  length: number;
  electrified: boolean;
}

export interface TrackSection {
  id: string;
  name: string;
  fromChainage: number;
  toChainage: number;
  speedLimit: number;
  electrified: boolean;
  occupiedBy: string | null;
}

export interface Point {
  id: string;
  name: string;
  position: PointPosition;
  locked: boolean;
  /** Section reached when normal */
  normalSection: string;
  /** Section reached when reverse */
  reverseSection: string;
  chainage: number;
}

export interface Signal {
  id: string;
  name: string;
  chainage: number;
  direction: 'up' | 'down';
  aspect: SignalAspect;
  approachControlled: boolean;
  /** Track section this signal protects (berth) */
  berthSection: string;
  /** Routes available from this signal */
  routeIds: string[];
  autoReplace: boolean;
}

export interface Route {
  id: string;
  name: string;
  fromSignal: string;
  toSignal: string;
  points: { id: string; position: PointPosition }[];
  sections: string[];
}

export interface Train {
  id: string;
  headcode: string;
  type: TrainType;
  serviceId: string;
  destination: string;
  direction: 'up' | 'down';
  chainage: number;
  speed: number;
  maxSpeed: number;
  length: number;
  platformStopId: string | null;
  state: 'running' | 'stopped' | 'waiting' | 'braking' | 'departing';
  delaySeconds: number;
  scheduledChainage: number;
  scheduledTime: number;
  atc: {
    awsActive: boolean;
    tpwsBrake: boolean;
    driverAck: boolean;
    overspeed: boolean;
  };
}

export interface TimetableEntry {
  id: string;
  headcode: string;
  type: TrainType;
  destination: string;
  direction: 'up' | 'down';
  departTime: number;
  originChainage: number;
  stops: { stationId: string; arriveTime: number; departTime: number }[];
}

export interface SimState {
  running: boolean;
  paused: boolean;
  mode: SimMode;
  speed: SimSpeed;
  simTime: number;
  startTime: number;
  sections: Record<string, TrackSection>;
  signals: Record<string, Signal>;
  points: Record<string, Point>;
  routes: Record<string, Route>;
  stations: Station[];
  trains: Train[];
  activeRoute: { fromSignal: string; toSignal: string | null } | null;
  score: {
    trainsHandled: number;
    totalDelay: number;
    spadEvents: number;
    onTimePercent: number;
  };
  messages: SimMessage[];
}

export interface SimMessage {
  id: string;
  time: number;
  level: 'info' | 'warn' | 'alert';
  text: string;
}

export interface SimAction {
  type:
    | 'START'
    | 'PAUSE'
    | 'RESUME'
    | 'SET_SPEED'
    | 'SET_MODE'
    | 'SELECT_SIGNAL'
    | 'SET_ROUTE'
    | 'TOGGLE_POINT'
    | 'TICK'
    | 'RESET';
  payload?: unknown;
}
