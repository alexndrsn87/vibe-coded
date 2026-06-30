import type { Point, Route, Signal, Station, TimetableEntry, TrackSection } from '../types';

/** Chainage 0 = Hunts Cross south fringe, increasing north towards Sandhills */

export const CHAINAGE = {
  huntsCrossSouth: 0,
  huntsCross: 0.4,
  wavertree: 1.6,
  edgeHill: 3.2,
  limeStreet: 4.0,
  liverpoolCentral: 4.8,
  moorfields: 5.4,
  sandhills: 6.2,
  sandhillsNorth: 6.8,
} as const;

export const STATIONS: Station[] = [
  {
    id: 'hc',
    name: 'Hunts Cross',
    chainage: CHAINAGE.huntsCross,
    platforms: [
      { id: 'hc-p1', name: 'Plat 1 (City)', length: 125, electrified: false },
      { id: 'hc-p2', name: 'Plat 2 (EMU)', length: 125, electrified: true },
      { id: 'hc-p3', name: 'Plat 3 (EMU)', length: 125, electrified: true },
    ],
  },
  {
    id: 'wt',
    name: 'Wavertree Technology Park',
    chainage: CHAINAGE.wavertree,
    platforms: [{ id: 'wt-p1', name: 'Platform', length: 130, electrified: true }],
  },
  {
    id: 'eh',
    name: 'Edge Hill',
    chainage: CHAINAGE.edgeHill,
    platforms: [
      { id: 'eh-p1', name: 'Plat 1', length: 140, electrified: true },
      { id: 'eh-p2', name: 'Plat 2', length: 140, electrified: true },
    ],
  },
  {
    id: 'ls',
    name: 'Lime Street',
    chainage: CHAINAGE.limeStreet,
    platforms: [
      { id: 'ls-p1', name: 'City Line', length: 200, electrified: false },
    ],
  },
  {
    id: 'lc',
    name: 'Liverpool Central',
    chainage: CHAINAGE.liverpoolCentral,
    platforms: [
      { id: 'lc-p1', name: 'Plat 1 (Ormskirk)', length: 130, electrified: true },
      { id: 'lc-p2', name: 'Plat 2 (Wirral)', length: 130, electrified: true },
      { id: 'lc-p3', name: 'Plat 3 (Northern)', length: 130, electrified: true },
    ],
  },
  {
    id: 'mf',
    name: 'Moorfields',
    chainage: CHAINAGE.moorfields,
    platforms: [{ id: 'mf-p1', name: 'Platform', length: 130, electrified: true }],
  },
  {
    id: 'sd',
    name: 'Sandhills',
    chainage: CHAINAGE.sandhills,
    platforms: [{ id: 'sd-p1', name: 'IEC Centre', length: 150, electrified: true }],
  },
];

export const SECTIONS: TrackSection[] = [
  { id: 's-hc-s', name: 'HC South Fringe', fromChainage: 0, toChainage: 0.25, speedLimit: 30, electrified: true, occupiedBy: null },
  { id: 's-hc', name: 'Hunts Cross', fromChainage: 0.25, toChainage: 0.55, speedLimit: 20, electrified: true, occupiedBy: null },
  { id: 's-hc-w', name: 'HC to Wavertree', fromChainage: 0.55, toChainage: 1.6, speedLimit: 20, electrified: true, occupiedBy: null },
  { id: 's-wt', name: 'Wavertree', fromChainage: 1.6, toChainage: 1.85, speedLimit: 20, electrified: true, occupiedBy: null },
  { id: 's-wt-eh', name: 'Wavertree to Edge Hill', fromChainage: 1.85, toChainage: 3.2, speedLimit: 20, electrified: true, occupiedBy: null },
  { id: 's-eh', name: 'Edge Hill', fromChainage: 3.2, toChainage: 3.45, speedLimit: 20, electrified: true, occupiedBy: null },
  { id: 's-eh-ls', name: 'Edge Hill to Lime St', fromChainage: 3.2, toChainage: 4.0, speedLimit: 45, electrified: false, occupiedBy: null },
  { id: 's-eh-lc', name: 'Edge Hill to Central', fromChainage: 3.45, toChainage: 4.8, speedLimit: 20, electrified: true, occupiedBy: null },
  { id: 's-lc', name: 'Liverpool Central', fromChainage: 4.8, toChainage: 5.05, speedLimit: 15, electrified: true, occupiedBy: null },
  { id: 's-lc-mf', name: 'Central to Moorfields', fromChainage: 5.05, toChainage: 5.4, speedLimit: 20, electrified: true, occupiedBy: null },
  { id: 's-mf', name: 'Moorfields', fromChainage: 5.4, toChainage: 5.55, speedLimit: 20, electrified: true, occupiedBy: null },
  { id: 's-mf-sd', name: 'Moorfields to Sandhills', fromChainage: 5.55, toChainage: 6.2, speedLimit: 20, electrified: true, occupiedBy: null },
  { id: 's-sd', name: 'Sandhills', fromChainage: 6.2, toChainage: 6.45, speedLimit: 20, electrified: true, occupiedBy: null },
  { id: 's-sd-n', name: 'Sandhills North Fringe', fromChainage: 6.45, toChainage: 6.8, speedLimit: 30, electrified: true, occupiedBy: null },
];

export const POINTS: Point[] = [
  {
    id: 'eh-p1',
    name: 'EH Junction (Lime St)',
    position: 'normal',
    locked: false,
    normalSection: 's-eh-lc',
    reverseSection: 's-eh-ls',
    chainage: CHAINAGE.edgeHill,
  },
  {
    id: 'hc-p1',
    name: 'HC West Jn (CLC)',
    position: 'normal',
    locked: false,
    normalSection: 's-hc-w',
    reverseSection: 's-hc-s',
    chainage: CHAINAGE.huntsCross,
  },
];

export const SIGNALS: Signal[] = [
  { id: 'HC01', name: 'HC01', chainage: 0.1, direction: 'up', aspect: 'R', approachControlled: false, berthSection: 's-hc-s', routeIds: ['r-hc-up-main'], autoReplace: true },
  { id: 'HC05', name: 'HC05', chainage: 0.5, direction: 'down', aspect: 'R', approachControlled: true, berthSection: 's-hc-w', routeIds: ['r-hc-down-main', 'r-hc-down-clc'], autoReplace: true },
  { id: 'WT01', name: 'WT01', chainage: 1.7, direction: 'down', aspect: 'R', approachControlled: false, berthSection: 's-wt-eh', routeIds: ['r-wt-down'], autoReplace: true },
  { id: 'EH03', name: 'EH03', chainage: 3.3, direction: 'down', aspect: 'R', approachControlled: true, berthSection: 's-eh-lc', routeIds: ['r-eh-down-main', 'r-eh-down-ls'], autoReplace: true },
  { id: 'LS01', name: 'LS01', chainage: 3.95, direction: 'up', aspect: 'R', approachControlled: false, berthSection: 's-eh-ls', routeIds: ['r-ls-up'], autoReplace: true },
  { id: 'LC01', name: 'LC01', chainage: 4.85, direction: 'down', aspect: 'R', approachControlled: false, berthSection: 's-lc-mf', routeIds: ['r-lc-down'], autoReplace: true },
  { id: 'LC03', name: 'LC03', chainage: 5.0, direction: 'up', aspect: 'R', approachControlled: false, berthSection: 's-lc', routeIds: ['r-lc-up'], autoReplace: true },
  { id: 'MF01', name: 'MF01', chainage: 5.45, direction: 'down', aspect: 'R', approachControlled: false, berthSection: 's-mf-sd', routeIds: ['r-mf-down'], autoReplace: true },
  { id: 'ML01', name: 'ML01', chainage: 6.5, direction: 'up', aspect: 'R', approachControlled: false, berthSection: 's-sd', routeIds: ['r-sd-up'], autoReplace: true },
  { id: 'ML05', name: 'ML05', chainage: 6.65, direction: 'down', aspect: 'R', approachControlled: false, berthSection: 's-sd-n', routeIds: ['r-sd-down'], autoReplace: true },
];

export const ROUTES: Route[] = [
  { id: 'r-hc-up-main', name: 'HC Up Main', fromSignal: 'HC01', toSignal: 'HC05', points: [], sections: ['s-hc-s', 's-hc'] },
  { id: 'r-hc-down-main', name: 'HC Down Main', fromSignal: 'HC05', toSignal: 'HC01', points: [{ id: 'hc-p1', position: 'normal' }], sections: ['s-hc', 's-hc-w', 's-wt', 's-wt-eh', 's-eh', 's-eh-lc', 's-lc', 's-lc-mf', 's-mf', 's-mf-sd', 's-sd', 's-sd-n', 's-hc-s'] },
  { id: 'r-hc-down-clc', name: 'HC to Lime St', fromSignal: 'HC05', toSignal: 'LS01', points: [{ id: 'hc-p1', position: 'reverse' }, { id: 'eh-p1', position: 'reverse' }], sections: ['s-hc', 's-hc-s', 's-hc-w', 's-wt', 's-wt-eh', 's-eh', 's-eh-ls'] },
  { id: 'r-wt-down', name: 'WT Down', fromSignal: 'WT01', toSignal: 'HC05', points: [], sections: ['s-wt-eh', 's-eh', 's-hc-w', 's-hc'] },
  { id: 'r-eh-down-main', name: 'EH Down Main', fromSignal: 'EH03', toSignal: 'WT01', points: [{ id: 'eh-p1', position: 'normal' }], sections: ['s-eh-lc', 's-eh', 's-wt-eh', 's-wt'] },
  { id: 'r-eh-down-ls', name: 'EH to Lime St', fromSignal: 'EH03', toSignal: 'LS01', points: [{ id: 'eh-p1', position: 'reverse' }], sections: ['s-eh-lc', 's-eh', 's-eh-ls'] },
  { id: 'r-ls-up', name: 'Lime St Up', fromSignal: 'LS01', toSignal: 'EH03', points: [{ id: 'eh-p1', position: 'reverse' }], sections: ['s-eh-ls', 's-eh'] },
  { id: 'r-lc-up', name: 'LC Up', fromSignal: 'LC03', toSignal: 'EH03', points: [], sections: ['s-lc', 's-eh-lc', 's-eh'] },
  { id: 'r-lc-down', name: 'LC Down', fromSignal: 'LC01', toSignal: 'MF01', points: [], sections: ['s-lc-mf', 's-mf'] },
  { id: 'r-mf-down', name: 'MF Down', fromSignal: 'MF01', toSignal: 'ML05', points: [], sections: ['s-mf-sd', 's-sd', 's-sd-n'] },
  { id: 'r-sd-up', name: 'Sandhills Up', fromSignal: 'ML01', toSignal: 'LC03', points: [], sections: ['s-sd', 's-mf', 's-lc-mf', 's-lc'] },
  { id: 'r-sd-down', name: 'Sandhills Down', fromSignal: 'ML05', toSignal: 'HC05', points: [], sections: ['s-sd-n', 's-sd', 's-mf-sd', 's-mf', 's-lc-mf', 's-lc', 's-eh-lc', 's-eh', 's-wt-eh', 's-wt', 's-hc-w', 's-hc'] },
];

function mins(h: number, m: number): number {
  return h * 3600 + m * 60;
}

/** Peak-period Northern Line & City Line services (seconds from 07:00) */
export const TIMETABLE: TimetableEntry[] = [
  // EMU Northern Line - Hunts Cross to Southport (via Sandhills fringe)
  { id: 't1', headcode: '2S01', type: 'emu', destination: 'Southport', direction: 'up', departTime: mins(7, 0), originChainage: CHAINAGE.huntsCrossSouth, stops: [
    { stationId: 'hc', arriveTime: mins(7, 0), departTime: mins(7, 1) },
    { stationId: 'wt', arriveTime: mins(7, 3), departTime: mins(7, 3) },
    { stationId: 'eh', arriveTime: mins(7, 5), departTime: mins(7, 5) },
    { stationId: 'lc', arriveTime: mins(7, 7), departTime: mins(7, 8) },
    { stationId: 'sd', arriveTime: mins(7, 11), departTime: mins(7, 11) },
  ]},
  { id: 't2', headcode: '2S02', type: 'emu', destination: 'Southport', direction: 'up', departTime: mins(7, 5), originChainage: CHAINAGE.huntsCrossSouth, stops: [
    { stationId: 'hc', arriveTime: mins(7, 5), departTime: mins(7, 6) },
    { stationId: 'wt', arriveTime: mins(7, 8), departTime: mins(7, 8) },
    { stationId: 'eh', arriveTime: mins(7, 10), departTime: mins(7, 10) },
    { stationId: 'lc', arriveTime: mins(7, 12), departTime: mins(7, 13) },
    { stationId: 'sd', arriveTime: mins(7, 16), departTime: mins(7, 16) },
  ]},
  { id: 't3', headcode: '2S03', type: 'emu', destination: 'Southport', direction: 'up', departTime: mins(7, 10), originChainage: CHAINAGE.huntsCrossSouth, stops: [
    { stationId: 'hc', arriveTime: mins(7, 10), departTime: mins(7, 11) },
    { stationId: 'wt', arriveTime: mins(7, 13), departTime: mins(7, 13) },
    { stationId: 'eh', arriveTime: mins(7, 15), departTime: mins(7, 15) },
    { stationId: 'lc', arriveTime: mins(7, 17), departTime: mins(7, 18) },
    { stationId: 'sd', arriveTime: mins(7, 21), departTime: mins(7, 21) },
  ]},
  { id: 't4', headcode: '2S04', type: 'emu', destination: 'Ormskirk', direction: 'up', departTime: mins(7, 15), originChainage: CHAINAGE.huntsCrossSouth, stops: [
    { stationId: 'hc', arriveTime: mins(7, 15), departTime: mins(7, 16) },
    { stationId: 'wt', arriveTime: mins(7, 18), departTime: mins(7, 18) },
    { stationId: 'lc', arriveTime: mins(7, 22), departTime: mins(7, 23) },
    { stationId: 'sd', arriveTime: mins(7, 26), departTime: mins(7, 26) },
  ]},
  // Down services from Sandhills fringe
  { id: 't5', headcode: '2N01', type: 'emu', destination: 'Hunts Cross', direction: 'down', departTime: mins(7, 2), originChainage: CHAINAGE.sandhillsNorth, stops: [
    { stationId: 'sd', arriveTime: mins(7, 2), departTime: mins(7, 3) },
    { stationId: 'lc', arriveTime: mins(7, 6), departTime: mins(7, 7) },
    { stationId: 'eh', arriveTime: mins(7, 9), departTime: mins(7, 9) },
    { stationId: 'wt', arriveTime: mins(7, 11), departTime: mins(7, 11) },
    { stationId: 'hc', arriveTime: mins(7, 13), departTime: mins(7, 14) },
  ]},
  { id: 't6', headcode: '2N02', type: 'emu', destination: 'Hunts Cross', direction: 'down', departTime: mins(7, 7), originChainage: CHAINAGE.sandhillsNorth, stops: [
    { stationId: 'sd', arriveTime: mins(7, 7), departTime: mins(7, 8) },
    { stationId: 'lc', arriveTime: mins(7, 11), departTime: mins(7, 12) },
    { stationId: 'eh', arriveTime: mins(7, 14), departTime: mins(7, 14) },
    { stationId: 'wt', arriveTime: mins(7, 16), departTime: mins(7, 16) },
    { stationId: 'hc', arriveTime: mins(7, 18), departTime: mins(7, 19) },
  ]},
  { id: 't7', headcode: '2N03', type: 'emu', destination: 'Hunts Cross', direction: 'down', departTime: mins(7, 12), originChainage: CHAINAGE.sandhillsNorth, stops: [
    { stationId: 'sd', arriveTime: mins(7, 12), departTime: mins(7, 13) },
    { stationId: 'lc', arriveTime: mins(7, 16), departTime: mins(7, 17) },
    { stationId: 'eh', arriveTime: mins(7, 19), departTime: mins(7, 19) },
    { stationId: 'wt', arriveTime: mins(7, 21), departTime: mins(7, 21) },
    { stationId: 'hc', arriveTime: mins(7, 23), departTime: mins(7, 24) },
  ]},
  { id: 't8', headcode: '2N04', type: 'emu', destination: 'Hunts Cross', direction: 'down', departTime: mins(7, 17), originChainage: CHAINAGE.sandhillsNorth, stops: [
    { stationId: 'sd', arriveTime: mins(7, 17), departTime: mins(7, 18) },
    { stationId: 'lc', arriveTime: mins(7, 21), departTime: mins(7, 22) },
    { stationId: 'eh', arriveTime: mins(7, 24), departTime: mins(7, 24) },
    { stationId: 'wt', arriveTime: mins(7, 26), departTime: mins(7, 26) },
    { stationId: 'hc', arriveTime: mins(7, 28), departTime: mins(7, 29) },
  ]},
  // City Line DMU - Lime Street to Hunts Cross
  { id: 't9', headcode: '1M01', type: 'dmu', destination: 'Hunts Cross', direction: 'down', departTime: mins(7, 8), originChainage: CHAINAGE.limeStreet, stops: [
    { stationId: 'ls', arriveTime: mins(7, 8), departTime: mins(7, 9) },
    { stationId: 'eh', arriveTime: mins(7, 11), departTime: mins(7, 12) },
    { stationId: 'hc', arriveTime: mins(7, 16), departTime: mins(7, 17) },
  ]},
  { id: 't10', headcode: '1M02', type: 'dmu', destination: 'Warrington', direction: 'up', departTime: mins(7, 20), originChainage: CHAINAGE.huntsCrossSouth, stops: [
    { stationId: 'hc', arriveTime: mins(7, 20), departTime: mins(7, 22) },
    { stationId: 'eh', arriveTime: mins(7, 25), departTime: mins(7, 26) },
    { stationId: 'ls', arriveTime: mins(7, 28), departTime: mins(7, 29) },
  ]},
  // Additional services for density
  { id: 't11', headcode: '2S05', type: 'emu', destination: 'Southport', direction: 'up', departTime: mins(7, 20), originChainage: CHAINAGE.huntsCrossSouth, stops: [
    { stationId: 'hc', arriveTime: mins(7, 20), departTime: mins(7, 21) },
    { stationId: 'lc', arriveTime: mins(7, 27), departTime: mins(7, 28) },
    { stationId: 'sd', arriveTime: mins(7, 31), departTime: mins(7, 31) },
  ]},
  { id: 't12', headcode: '2N05', type: 'emu', destination: 'Hunts Cross', direction: 'down', departTime: mins(7, 22), originChainage: CHAINAGE.sandhillsNorth, stops: [
    { stationId: 'sd', arriveTime: mins(7, 22), departTime: mins(7, 23) },
    { stationId: 'lc', arriveTime: mins(7, 26), departTime: mins(7, 27) },
    { stationId: 'hc', arriveTime: mins(7, 33), departTime: mins(7, 34) },
  ]},
];

export const SIM_START_TIME = mins(7, 0);
