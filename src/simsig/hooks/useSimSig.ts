import { useCallback, useEffect, useReducer, useRef } from 'react';
import { createInitialState, formatSimTime, reduceSimState } from '../engine/simulation';
import type { SimMode, SimSpeed, SimState } from '../types';

export function useSimSig() {
  const [state, dispatch] = useReducer(reduceSimState, undefined, createInitialState);
  const lastTick = useRef(performance.now());

  useEffect(() => {
    if (!state.running || state.paused) return;

    let frame: number;
    const loop = (now: number) => {
      const elapsed = (now - lastTick.current) / 1000;
      lastTick.current = now;
      if (elapsed > 0 && elapsed < 0.5) {
        dispatch({ type: 'TICK', payload: elapsed });
      }
      frame = requestAnimationFrame(loop);
    };

    lastTick.current = performance.now();
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [state.running, state.paused, state.speed]);

  const start = useCallback(() => dispatch({ type: 'START' }), []);
  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), []);
  const resume = useCallback(() => dispatch({ type: 'RESUME' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const setSpeed = useCallback((s: SimSpeed) => dispatch({ type: 'SET_SPEED', payload: s }), []);
  const setMode = useCallback((m: SimMode) => dispatch({ type: 'SET_MODE', payload: m }), []);

  const clickSignal = useCallback(
    (signalId: string) => {
      if (state.activeRoute?.fromSignal && state.activeRoute.fromSignal !== signalId) {
        dispatch({ type: 'SET_ROUTE', payload: signalId });
      } else {
        dispatch({ type: 'SELECT_SIGNAL', payload: signalId });
      }
    },
    [state.activeRoute],
  );

  const togglePoint = useCallback(
    (pointId: string) => dispatch({ type: 'TOGGLE_POINT', payload: pointId }),
    [],
  );

  return {
    state,
    formattedTime: formatSimTime(state.simTime),
    start,
    pause,
    resume,
    reset,
    setSpeed,
    setMode,
    clickSignal,
    togglePoint,
  };
}

export type SimSigControls = ReturnType<typeof useSimSig>;
