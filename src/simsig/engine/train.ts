import { ROUTE_LENGTH_MILES, speedLimitAt, STOCK } from '../data/network';
import { aspectMaxSpeedFactor } from './signals';
import type { Aspect, Train } from './types';

const MPH_TO_MILES_PER_SEC = 1 / 3600;

/**
 * Advance one train by `dtSec`. Pure function — takes the signal aspect
 * governing the section the train is about to enter (or currently in) and
 * returns the updated train. Physics uses simple constant accel/brake
 * (no jerk limiting) which is plenty realistic-feeling at this scale.
 */
export function stepTrain(
  train: Train,
  dtSec: number,
  governingAspect: Aspect,
  distanceToSignalAheadMiles: number,
  approachingPlatform: { mile: number } | null,
): Train {
  const stock = STOCK[train.stock];
  const lineLimit = speedLimitAt(train.mile);
  const aspectFactor = aspectMaxSpeedFactor(governingAspect);
  let targetMph = lineLimit * (aspectFactor === 0 ? 1 : aspectFactor === 1 ? 1 : aspectFactor);

  // If the signal ahead is at red, target speed must reach 0 by the time we
  // get there — brake early using a simple braking-distance check.
  let mustStopForSignal = false;
  if (governingAspect === 'R') {
    const brakingDistanceNeeded = (train.speedMph * train.speedMph) / (2 * stock.maxBrakeMphS * 3600);
    if (distanceToSignalAheadMiles <= Math.max(brakingDistanceNeeded, 0.02)) {
      mustStopForSignal = true;
      targetMph = 0;
    }
  }

  // Station stop braking — slow for the platform if approaching one.
  if (approachingPlatform) {
    const distToStop = Math.abs(approachingPlatform.mile - train.mile);
    const brakingDistanceNeeded = (train.speedMph * train.speedMph) / (2 * stock.maxBrakeMphS * 3600);
    if (distToStop <= Math.max(brakingDistanceNeeded, 0.015)) {
      targetMph = 0;
    }
  }

  let newSpeed = train.speedMph;
  if (newSpeed < targetMph) {
    newSpeed = Math.min(targetMph, newSpeed + stock.maxAccelMphS * dtSec);
  } else if (newSpeed > targetMph) {
    newSpeed = Math.max(targetMph, newSpeed - stock.maxBrakeMphS * dtSec);
  }

  // If we're stopped and blocked by a signal/platform, hold at 0 exactly.
  if ((mustStopForSignal || approachingPlatform) && newSpeed < 0.3 && targetMph === 0) {
    newSpeed = 0;
  }

  const directionSign = train.direction === 'up' ? 1 : -1;
  const deltaMiles = directionSign * newSpeed * MPH_TO_MILES_PER_SEC * dtSec;
  let newMile = train.mile + deltaMiles;
  newMile = Math.max(0, Math.min(ROUTE_LENGTH_MILES + 0.05, newMile));

  let state: Train['state'] = 'running';
  if (newSpeed === 0 && approachingPlatform) state = 'stopped';
  else if (newSpeed === 0 && mustStopForSignal) state = 'stopped';
  else if (newSpeed < train.speedMph) state = 'braking';

  return { ...train, mile: newMile, speedMph: newSpeed, state };
}

export function trainLengthMiles(train: Train): number {
  return STOCK[train.stock].lengthMiles;
}
