import { createReplay, type ReplayState } from "../engine/replay";
import { validCandle } from "../engine/data";
import type { Position, Scenario, Trade } from "../engine/types";
import { newMarketSeed } from "../engine/live";
import { isInstrumentId } from "../engine/instruments";
export const PRACTICE_KEY = "marketlab.practice.v1";
const isPosition = (p: Position) =>
  p &&
  typeof p.id === "string" &&
  ["buy", "sell"].includes(p.side) &&
  [
    p.units,
    p.entry,
    p.stop,
    p.target,
    p.notional,
    p.openedAt,
    p.initialRisk,
  ].every(Number.isFinite) &&
  p.units > 0 &&
  p.entry > 0 &&
  p.stop > 0 &&
  p.target > 0;
export function readPractice(s: Scenario, balance: number): ReplayState {
  const fresh = createReplay(s, false, "live", balance, {
    seed: newMarketSeed(),
  });
  try {
    const saved = JSON.parse(localStorage.getItem(PRACTICE_KEY) ?? "null");
    const state = saved?.state;
    if (
      saved?.version !== 1 ||
      saved.scenarioId !== s.id ||
      state?.mode !== "live" ||
      state.initialBalance !== balance
    )
      return fresh;
    const instrument = state.instrument ?? "EUR/USD";
    if (
      !state.live ||
      !Array.isArray(state.live.candles) ||
      !state.live.candles.length ||
      state.live.candles.length > 600 ||
      !state.live.candles.every(validCandle)
    )
      return fresh;
    if (
      !state.account ||
      !Number.isFinite(state.account.balance) ||
      !Array.isArray(state.account.positions) ||
      !state.account.positions.every(isPosition) ||
      !Array.isArray(state.account.trades) ||
      !state.account.trades.every(
        (t: Trade) =>
          isPosition(t) && Number.isFinite(t.exit) && Number.isFinite(t.pnl),
      )
    )
      return fresh;
    if (
      ![
        state.index,
        state.maxIndex,
        state.live.clock,
        state.live.seed,
        state.live.tick,
      ].every(Number.isFinite) ||
      ![0.5, 1, 2, 4].includes(state.speed)
    )
      return fresh;
    if (
      !isInstrumentId(instrument) ||
      (state.live.instrument && state.live.instrument !== instrument) ||
      state.account.positions.some(
        (p: Position) => (p.instrument ?? "EUR/USD") !== instrument,
      )
    )
      return fresh;
    return {
      ...fresh,
      ...state,
      instrument,
      live: {
        ...state.live,
        instrument,
        sessionSeed: state.live.sessionSeed ?? state.live.seed,
      },
      playing: false,
      error: null,
      annotations: Array.isArray(state.annotations)
        ? state.annotations.filter(
            (a: {
              price: number;
              endPrice: number;
              time: number;
              endTime: number;
              kind: string;
            }) =>
              Number.isFinite(a.price) &&
              a.price > 0 &&
              ["level", "zone", "trend"].includes(a.kind) &&
              (a.kind === "level" || Number.isFinite(a.endPrice)) &&
              (a.kind !== "trend" ||
                (Number.isFinite(a.time) && Number.isFinite(a.endTime))),
          )
        : [],
    };
  } catch {
    return fresh;
  }
}
export function writePractice(scenarioId: string, state: ReplayState) {
  try {
    if (state.mode === "live")
      localStorage.setItem(
        PRACTICE_KEY,
        JSON.stringify({ version: 1, scenarioId, state }),
      );
    else localStorage.removeItem(PRACTICE_KEY);
  } catch {
    /* Progress export and explicit session save remain available. */
  }
}
export function clearPractice() {
  try {
    localStorage.removeItem(PRACTICE_KEY);
  } catch {
    /* Storage may be unavailable. */
  }
}
