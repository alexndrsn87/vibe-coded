import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  clearSave,
  clickPlatform,
  clickSignal as clickSignalState,
  createInitialState,
  loadGame,
  reset as resetState,
  saveGame,
  setSessionLength as setSessionLengthState,
  setSpeed as setSpeedState,
  start as startState,
  tick,
  togglePause as togglePauseState,
} from '../engine/gameState';
import type { GameState, SessionLengthMinutes, SimSpeed } from '../engine/types';

type Action =
  | { type: 'TICK'; dt: number }
  | { type: 'START' }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'SET_SPEED'; speed: SimSpeed }
  | { type: 'SET_SESSION_LENGTH'; minutes: SessionLengthMinutes }
  | { type: 'RESET' }
  | { type: 'CLICK_SIGNAL'; id: string }
  | { type: 'CLICK_PLATFORM'; platform: number }
  | { type: 'LOAD'; state: GameState };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'TICK':
      return tick(state, action.dt);
    case 'START':
      return startState(state);
    case 'TOGGLE_PAUSE':
      return togglePauseState(state);
    case 'SET_SPEED':
      return setSpeedState(state, action.speed);
    case 'SET_SESSION_LENGTH':
      return setSessionLengthState(state, action.minutes);
    case 'RESET':
      return resetState(state.sessionLengthMinutes);
    case 'CLICK_SIGNAL':
      return clickSignalState(state, action.id);
    case 'CLICK_PLATFORM':
      return clickPlatform(state, action.platform);
    case 'LOAD':
      return action.state;
    default:
      return state;
  }
}

const FIXED_DT = 1 / 30;
const MAX_TICKS_PER_FRAME = 12;

export function useGameLoop() {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const saved = loadGame();
    return saved ?? createInitialState();
  });

  const accumulator = useRef(0);
  const lastFrame = useRef<number | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let raf: number;

    const loop = (now: number) => {
      if (lastFrame.current === null) lastFrame.current = now;
      const elapsed = Math.min((now - lastFrame.current) / 1000, 0.25);
      lastFrame.current = now;

      const current = stateRef.current;
      if (current.running && !current.paused) {
        accumulator.current += elapsed * current.speed;
        let ticks = 0;
        while (accumulator.current >= FIXED_DT && ticks < MAX_TICKS_PER_FRAME) {
          dispatch({ type: 'TICK', dt: FIXED_DT });
          accumulator.current -= FIXED_DT;
          ticks += 1;
        }
      } else {
        accumulator.current = 0;
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => saveGame(stateRef.current), 3000);
    return () => clearInterval(interval);
  }, []);

  const start = useCallback(() => dispatch({ type: 'START' }), []);
  const togglePause = useCallback(() => dispatch({ type: 'TOGGLE_PAUSE' }), []);
  const changeSpeed = useCallback((speed: SimSpeed) => dispatch({ type: 'SET_SPEED', speed }), []);
  const setSessionLength = useCallback(
    (minutes: SessionLengthMinutes) => dispatch({ type: 'SET_SESSION_LENGTH', minutes }),
    [],
  );
  const resetGame = useCallback(() => {
    clearSave();
    dispatch({ type: 'RESET' });
  }, []);
  const clickSignal = useCallback((id: string) => dispatch({ type: 'CLICK_SIGNAL', id }), []);
  const selectPlatform = useCallback((platform: number) => dispatch({ type: 'CLICK_PLATFORM', platform }), []);

  return {
    state,
    start,
    togglePause,
    changeSpeed,
    setSessionLength,
    resetGame,
    clickSignal,
    selectPlatform,
  };
}
