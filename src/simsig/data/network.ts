/**
 * ============================================================================
 * NETWORK DATA — Merseyrail Northern Line (Hunts Cross ⇄ Southport)
 * ============================================================================
 *
 * This is the single source of truth for the route. Tweak stations, mileages,
 * speed limits or headcodes here — nothing else in the app should hardcode
 * infrastructure data.
 *
 * MILEAGES: `mile` is the approximate real-world distance (in miles) from
 * Hunts Cross, derived from published Network Rail Engineer's Line Reference
 * (ELR) mileage data for the Hunts Cross–Central section (HXS1) and
 * Central–Sandhills section (HXS2), extended with reasonable estimates for
 * the Sandhills–Southport coastal section (exact ELR chains not published).
 * These drive train physics/timing — they are NOT survey-accurate and are
 * deliberately NOT used for on-screen layout (the panel is a schematic
 * diagram, like a real signaller's panel, not a map).
 *
 * PANEL POSITION: `panelIndex` is simply the station's order along the line
 * (0 = Hunts Cross). The renderer spaces stations evenly by index, exactly
 * like a real SimSig / NX panel — clean and readable regardless of true
 * geography.
 * ============================================================================
 */

export type Direction = 'up' | 'down'; // up = towards Southport, down = towards Hunts Cross

export interface Station {
  id: string;
  name: string;
  short: string;
  mile: number;
  panelIndex: number;
  /** Number of platforms available for terminating/allocating (Southport only, for now) */
  platforms: number;
  underground: boolean;
}

/** Real station order, Hunts Cross → Southport. */
export const STATIONS: Station[] = [
  { id: 'hc', name: 'Hunts Cross', short: 'HXC', mile: 0.0, panelIndex: 0, platforms: 1, underground: false },
  { id: 'lsp', name: 'Liverpool South Parkway', short: 'LSP', mile: 0.83, panelIndex: 1, platforms: 1, underground: false },
  { id: 'crs', name: 'Cressington', short: 'CRS', mile: 1.74, panelIndex: 2, platforms: 1, underground: false },
  { id: 'agb', name: 'Aigburth', short: 'AGB', mile: 2.52, panelIndex: 3, platforms: 1, underground: false },
  { id: 'stm', name: 'St Michaels', short: 'STM', mile: 3.82, panelIndex: 4, platforms: 1, underground: false },
  { id: 'brw', name: 'Brunswick', short: 'BRW', mile: 4.87, panelIndex: 5, platforms: 1, underground: false },
  { id: 'lvc', name: 'Liverpool Central', short: 'LVC', mile: 6.28, panelIndex: 6, platforms: 1, underground: true },
  { id: 'moo', name: 'Moorfields', short: 'MOO', mile: 7.13, panelIndex: 7, platforms: 1, underground: true },
  { id: 'san', name: 'Sandhills', short: 'SAN', mile: 8.43, panelIndex: 8, platforms: 1, underground: false },
  { id: 'bkh', name: 'Bank Hall', short: 'BKH', mile: 9.33, panelIndex: 9, platforms: 1, underground: false },
  { id: 'bor', name: 'Bootle Oriel Road', short: 'BOR', mile: 10.03, panelIndex: 10, platforms: 1, underground: false },
  { id: 'bns', name: 'Bootle New Strand', short: 'BNS', mile: 10.63, panelIndex: 11, platforms: 1, underground: false },
  { id: 'sal', name: 'Seaforth & Litherland', short: 'S&L', mile: 11.53, panelIndex: 12, platforms: 1, underground: false },
  { id: 'wat', name: 'Waterloo', short: 'WAT', mile: 12.53, panelIndex: 13, platforms: 1, underground: false },
  { id: 'bac', name: 'Blundellsands & Crosby', short: 'B&C', mile: 13.53, panelIndex: 14, platforms: 1, underground: false },
  { id: 'hlr', name: 'Hall Road', short: 'HLR', mile: 14.63, panelIndex: 15, platforms: 1, underground: false },
  { id: 'hig', name: 'Hightown', short: 'HIG', mile: 16.23, panelIndex: 16, platforms: 1, underground: false },
  { id: 'for', name: 'Formby', short: 'FOR', mile: 18.33, panelIndex: 17, platforms: 1, underground: false },
  { id: 'frb', name: 'Freshfield', short: 'FRB', mile: 19.73, panelIndex: 18, platforms: 1, underground: false },
  { id: 'ain', name: 'Ainsdale', short: 'AIN', mile: 21.63, panelIndex: 19, platforms: 1, underground: false },
  { id: 'hil', name: 'Hillside', short: 'HIL', mile: 22.83, panelIndex: 20, platforms: 1, underground: false },
  { id: 'bir', name: 'Birkdale', short: 'BIR', mile: 23.83, panelIndex: 21, platforms: 1, underground: false },
  { id: 'sou', name: 'Southport', short: 'SOU', mile: 25.03, panelIndex: 22, platforms: 3, underground: false },
];

export const TOTAL_PANEL_STEPS = STATIONS.length - 1;
export const ROUTE_LENGTH_MILES = STATIONS[STATIONS.length - 1].mile;

/**
 * Line speed limits (mph), by mile marker range. Slower through the
 * underground core and station throats, faster on the coastal stretch.
 * `speedAt(mile)` below resolves the applicable limit for any position.
 */
interface SpeedZone {
  fromMile: number;
  toMile: number;
  limitMph: number;
}

export const SPEED_ZONES: SpeedZone[] = [
  { fromMile: 0.0, toMile: 0.6, limitMph: 25 }, // Hunts Cross throat
  { fromMile: 0.6, toMile: 5.9, limitMph: 50 },
  { fromMile: 5.9, toMile: 7.9, limitMph: 25 }, // underground core: Brunswick–Sandhills
  { fromMile: 7.9, toMile: 8.9, limitMph: 35 }, // Sandhills junction area
  { fromMile: 8.9, toMile: 16.0, limitMph: 50 },
  { fromMile: 16.0, toMile: 24.4, limitMph: 60 }, // fastest coastal stretch, Hightown–Birkdale
  { fromMile: 24.4, toMile: 25.03, limitMph: 15 }, // Southport approach/throat
];

export function speedLimitAt(mile: number): number {
  const zone = SPEED_ZONES.find((z) => mile >= z.fromMile && mile < z.toMile);
  return zone?.limitMph ?? SPEED_ZONES[SPEED_ZONES.length - 1].limitMph;
}

/**
 * Crossovers / points at real-world locations. Only the Southport approach
 * is functionally used for routing in this build; the others are modelled
 * here and drawn on the panel as a preview of later phases (short workings,
 * turnbacks, depot access) but are not yet interactive.
 */
export interface Crossover {
  id: string;
  name: string;
  mile: number;
  active: boolean;
}

export const CROSSOVERS: Crossover[] = [
  { id: 'xo-san', name: 'Sandhills Crossover', mile: 8.43, active: false },
  { id: 'xo-hlr', name: 'Hall Road Sidings Ladder', mile: 14.63, active: false },
  { id: 'xo-for', name: 'Formby Crossover', mile: 18.33, active: false },
  { id: 'xo-sou', name: 'Southport Approach', mile: 24.6, active: true },
];

/** Rolling stock — Merseyrail's current fleet. */
export type StockType = 'class777';

export const STOCK: Record<StockType, { name: string; lengthMiles: number; maxAccelMphS: number; maxBrakeMphS: number }> = {
  class777: {
    name: 'Class 777',
    lengthMiles: 0.045, // ~70m, four-car EMU
    maxAccelMphS: 3.2,
    maxBrakeMphS: 4.5,
  },
};
