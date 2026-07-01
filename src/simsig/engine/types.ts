import type { Direction } from '../data/network';

export type Aspect = 'R' | 'Y' | 'YY' | 'G';

/** A single block of track between two signals. Occupancy drives interlocking. */
export interface BlockSection {
  id: string;
  fromMile: number;
  toMile: number;
  /** Train id currently occupying this section, or null if clear. */
  occupiedBy: string | null;
}

export interface Signal {
  id: string;
  label: string;
  mile: number;
  direction: Direction;
  /** Automatic signals clear themselves from track-circuit state. Controlled signals require the player to set a route. */
  kind: 'auto' | 'controlled';
  /** Section immediately ahead of this signal, i.e. what it protects. */
  protects: string;
  aspect: Aspect;
}

/** Southport-only for Phase 1: a route from the approach-controlled signal into one platform. */
export interface PlatformRoute {
  platform: number;
  sectionId: string;
  mile: number;
}

export interface Train {
  id: string;
  headcode: string;
  stock: 'class777';
  direction: Direction;
  mile: number;
  speedMph: number;
  state: 'running' | 'braking' | 'stopped' | 'arrived';
  targetPlatform: number | null;
}

export type SimSpeed = 1 | 2 | 4;

export interface ActiveRouteSelection {
  fromSignalId: string;
}

export interface GameState {
  running: boolean;
  paused: boolean;
  speed: SimSpeed;
  simTimeSec: number;
  sections: Record<string, BlockSection>;
  signals: Record<string, Signal>;
  trains: Train[];
  /** Southport platform occupancy: platform number -> train id */
  platformOccupancy: Record<number, string | null>;
  activeSelection: ActiveRouteSelection | null;
  southportRouteSet: number | null; // platform number the approach route currently points to
  log: LogEntry[];
  phaseComplete: boolean;
}

export interface LogEntry {
  id: string;
  time: number;
  level: 'info' | 'warn' | 'success';
  text: string;
}
