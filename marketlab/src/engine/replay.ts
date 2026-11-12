import {
  initialAccount,
  openPosition,
  closePosition,
  processCandle,
  type OrderInput,
} from "./trading";
import type { Account, Annotation, Scenario, InstrumentId } from "./types";
import {
  advanceSeed,
  createLiveMarket,
  tickMarket,
  type LiveMarket,
} from "./live";
import { getInstrument } from "./instruments";

export interface ReplayState {
  index: number;
  maxIndex: number;
  playing: boolean;
  speed: number;
  exploration: boolean;
  account: Account;
  annotations: Annotation[];
  selected: number | null;
  submitted: boolean;
  error: string | null;
  mode: "replay" | "live";
  initialBalance: number;
  live: LiveMarket;
  instrument: InstrumentId;
}
export const createReplay = (
  s: Scenario,
  exploration = false,
  mode: "replay" | "live" = "replay",
  initialBalance = 10000,
  options: { instrument?: InstrumentId; seed?: number } = {},
): ReplayState => {
  const live = createLiveMarket(
    options.instrument ?? "EUR/USD",
    options.seed ?? 173920,
  );
  const initialIndex = mode === "live" ? live.candles.length - 1 : s.startIndex;
  return {
    index: initialIndex,
    maxIndex: initialIndex,
    playing: mode === "live",
    speed: 1,
    exploration,
    account: initialAccount(initialBalance),
    annotations: [],
    selected: null,
    submitted: false,
    error: null,
    mode,
    initialBalance: initialAccount(initialBalance).balance,
    instrument: mode === "live" ? (options.instrument ?? "EUR/USD") : "EUR/USD",
    live,
  };
};
export type ReplayAction =
  | { type: "NEXT" }
  | { type: "PREVIOUS" }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "SPEED"; speed: number }
  | { type: "RESTART"; seed?: number }
  | { type: "ANNOTATE"; annotation: Annotation }
  | { type: "CLEAR" }
  | { type: "UNDO" }
  | { type: "SELECT"; option: number }
  | { type: "SUBMIT" }
  | { type: "ORDER"; order: OrderInput }
  | { type: "CLOSE"; id: string }
  | { type: "ERROR"; error: string | null }
  | { type: "MODE"; mode: "replay" | "live"; seed?: number }
  | { type: "INSTRUMENT"; instrument: InstrumentId; seed?: number }
  | { type: "SET_BALANCE"; balance: number };
export const currentCandle = (s: Scenario, state: ReplayState) =>
  state.mode === "live"
    ? { ...state.live.candles.at(-1)!, time: state.live.clock }
    : s.candles[state.index];
export const executionSpread = (s: Scenario, state: ReplayState) =>
  state.mode === "live" ? getInstrument(state.instrument).spread : s.spread;
export function replayReducer(
  s: Scenario,
  state: ReplayState,
  action: ReplayAction,
): ReplayState {
  switch (action.type) {
    case "NEXT": {
      if (state.mode === "live") {
        const { market, movement } = tickMarket(state.live);
        return {
          ...state,
          live: market,
          index:
            state.index +
            (market.candles.at(-1)!.time > state.live.candles.at(-1)!.time
              ? 1
              : 0),
          account: processCandle(
            state.account,
            movement,
            executionSpread(s, state),
            state.instrument,
          ),
          error: state.error,
        };
      }
      if (state.index >= s.candles.length - 1)
        return { ...state, playing: false };
      const index = state.index + 1;
      return {
        ...state,
        index,
        maxIndex: Math.max(index, state.maxIndex),
        playing: state.playing && index < s.candles.length - 1,
        account: processCandle(state.account, s.candles[index], s.spread),
        error: null,
      };
    }
    case "PREVIOUS":
      return state.mode === "live" || state.index <= s.startIndex
        ? state
        : {
            ...createReplay(s, true, "replay", state.initialBalance),
            index: state.index - 1,
            maxIndex: state.maxIndex,
            speed: state.speed,
          };
    case "RESTART":
      return {
        ...createReplay(
          s,
          state.exploration || state.maxIndex > s.startIndex,
          state.mode,
          state.initialBalance,
          {
            instrument: state.instrument,
            seed: action.seed ?? advanceSeed(state.live.seed),
          },
        ),
        speed: state.speed,
      };
    case "MODE":
      return createReplay(
        s,
        action.mode === "replay" &&
          (state.exploration ||
            state.mode === "live" ||
            state.maxIndex > s.startIndex),
        action.mode,
        state.initialBalance,
        {
          instrument: state.instrument,
          seed: action.seed ?? advanceSeed(state.live.seed),
        },
      );
    case "INSTRUMENT": {
      if (state.mode !== "live") return state;
      if (state.account.positions.length)
        return {
          ...state,
          error:
            "Close your open positions before switching markets. Your balance and trade history will stay.",
        };
      if (state.instrument === action.instrument) return state;
      const live = createLiveMarket(
        action.instrument,
        action.seed ?? advanceSeed(state.live.seed),
      );
      return {
        ...state,
        instrument: action.instrument,
        live,
        annotations: [],
        index: live.candles.length - 1,
        maxIndex: live.candles.length - 1,
        error: null,
      };
    }
    case "SET_BALANCE":
      return {
        ...state,
        initialBalance: initialAccount(action.balance).balance,
        account: initialAccount(action.balance),
        error: null,
      };
    case "PLAY":
      return {
        ...state,
        playing: state.mode === "live" || state.index < s.candles.length - 1,
      };
    case "PAUSE":
      return { ...state, playing: false };
    case "SPEED":
      return {
        ...state,
        speed: [0.5, 1, 2, 4].includes(action.speed) ? action.speed : 1,
      };
    case "ANNOTATE":
      return state.mode === "replay" && state.submitted
        ? state
        : { ...state, annotations: [...state.annotations, action.annotation] };
    case "CLEAR":
      return state.mode === "replay" && state.submitted
        ? state
        : { ...state, annotations: [] };
    case "UNDO":
      return state.mode === "replay" && state.submitted
        ? state
        : { ...state, annotations: state.annotations.slice(0, -1) };
    case "SELECT":
      return state.submitted ? state : { ...state, selected: action.option };
    case "SUBMIT":
      return state.mode === "live" || state.selected === null || state.submitted
        ? state
        : {
            ...state,
            submitted: true,
            exploration: state.exploration || state.index > s.startIndex,
            playing: true,
          };
    case "ORDER": {
      try {
        return {
          ...state,
          account: openPosition(
            state.account,
            action.order,
            currentCandle(s, state),
            executionSpread(s, state),
            state.instrument,
          ),
          error: null,
        };
      } catch (e) {
        return {
          ...state,
          error: e instanceof Error ? e.message : "Check your order.",
        };
      }
    }
    case "CLOSE":
      return {
        ...state,
        account: closePosition(
          state.account,
          action.id,
          currentCandle(s, state),
          executionSpread(s, state),
          state.instrument,
        ),
      };
    case "ERROR":
      return { ...state, error: action.error };
  }
}
export const visibleCandles = (s: Scenario, index: number) =>
  s.candles.slice(0, Math.max(0, Math.min(index + 1, s.candles.length)));
