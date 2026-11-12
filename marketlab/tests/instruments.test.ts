import { describe, it, expect } from "vitest";
import {
  instruments,
  getInstrument,
  validUnits,
  formatPrice,
} from "../src/engine/instruments";
import { createLiveMarket, tickMarket } from "../src/engine/live";
import {
  createReplay,
  currentCandle,
  replayReducer,
} from "../src/engine/replay";
import {
  initialAccount,
  openPosition,
  closePosition,
  unrealised,
  reserved,
  processCandle,
} from "../src/engine/trading";
import { validCandle } from "../src/engine/data";
import { scenarios } from "../src/content/scenarios";

describe.each(instruments)("$id fictional contract", (spec) => {
  const candle = {
    time: 1,
    open: spec.referencePrice,
    close: spec.referencePrice,
    high: spec.referencePrice,
    low: spec.referencePrice,
  };
  const buy = {
    side: "buy" as const,
    units: spec.defaultUnits,
    stop: spec.referencePrice - spec.stopDistance,
    target: spec.referencePrice + 2 * spec.stopDistance,
  };
  it("charges spread in USD per base unit and reserves actual notional", () => {
    const a = openPosition(initialAccount(), buy, candle, spec.spread, spec.id);
    expect(a.positions[0].instrument).toBe(spec.id);
    expect(unrealised(a, candle.close, spec.spread, spec.id)).toBeCloseTo(
      -spec.spread * buy.units,
      6,
    );
    expect(reserved(a)).toBeCloseTo(
      (candle.close + spec.spread / 2) * buy.units,
      6,
    );
    const closed = closePosition(
      a,
      a.positions[0].id,
      candle,
      spec.spread,
      spec.id,
    );
    expect(closed.balance).toBeCloseTo(10000 - spec.spread * buy.units, 6);
  });
  it("calculates both long and short gains from the executable exit quote", () => {
    for (const side of ["buy", "sell"] as const) {
      const long = side === "buy",
        distance = spec.stopDistance;
      const order = {
        ...buy,
        side,
        stop: spec.referencePrice + (long ? -distance : distance),
        target: spec.referencePrice + (long ? distance * 2 : -distance * 2),
      };
      const a = openPosition(
        initialAccount(),
        order,
        candle,
        spec.spread,
        spec.id,
      );
      const next = {
        ...candle,
        time: 2,
        close: candle.close + (long ? distance : -distance),
      };
      const closed = closePosition(
        a,
        a.positions[0].id,
        next,
        spec.spread,
        spec.id,
      );
      expect(closed.trades[0].pnl).toBeCloseTo(
        (distance - spec.spread) * order.units,
        6,
      );
      expect(closed.balance).toBeCloseTo(10000 + closed.trades[0].pnl, 6);
    }
  });
  it("uses the correct slippage on an adverse gap and the conservative stop-first rule", () => {
    const a = openPosition(initialAccount(), buy, candle, spec.spread, spec.id);
    const both = {
      time: 2,
      open: candle.close,
      high: buy.target + spec.stopDistance,
      low: buy.stop - spec.stopDistance,
      close: candle.close,
    };
    const stopped = processCandle(a, both, spec.spread, spec.id);
    expect(stopped.trades[0].reason).toBe("Stop-loss");
    expect(stopped.trades[0].exit).toBeCloseTo(buy.stop - spec.slippage, 8);
    const gap = { ...both, open: buy.stop - spec.stopDistance };
    expect(
      processCandle(a, gap, spec.spread, spec.id).trades[0].exit,
    ).toBeCloseTo(gap.open - spec.spread / 2 - spec.slippage, 8);
  });
  it("handles a target and short stop with its own price scale", () => {
    const a = openPosition(initialAccount(), buy, candle, spec.spread, spec.id);
    const target = {
      time: 2,
      open: candle.close,
      high: buy.target + spec.spread,
      low: candle.close,
      close: buy.target,
    };
    expect(
      processCandle(a, target, spec.spread, spec.id).trades[0].reason,
    ).toBe("Take-profit");
    const sell = {
      ...buy,
      side: "sell" as const,
      stop: buy.target,
      target: buy.stop,
    };
    const b = openPosition(
      initialAccount(),
      sell,
      candle,
      spec.spread,
      spec.id,
    );
    const stopped = processCandle(
      b,
      { ...target, high: sell.stop + spec.stopDistance },
      spec.spread,
      spec.id,
    );
    expect(stopped.trades[0].exit).toBeCloseTo(sell.stop + spec.slippage, 8);
  });
  it("validates instrument-specific quantity steps and rejects impossible funds", () => {
    expect(validUnits(spec.minUnits, spec)).toBe(true);
    expect(validUnits(spec.quantityStep * 0.5, spec)).toBe(false);
    expect(validUnits(NaN, spec)).toBe(false);
    expect(() =>
      openPosition(
        initialAccount(),
        { ...buy, units: spec.minUnits / 2 },
        candle,
        spec.spread,
        spec.id,
      ),
    ).toThrow();
    expect(() =>
      openPosition(
        initialAccount(),
        { ...buy, units: 1000000 },
        candle,
        spec.spread,
        spec.id,
      ),
    ).toThrow(/Choose fewer units/);
  });
  it("creates independent random histories and continues for thousands of ticks without a final bar", () => {
    let market = createLiveMarket(spec.id, 173920);
    const other = createLiveMarket(spec.id, 9999);
    expect(market.candles).not.toEqual(other.candles);
    expect(createLiveMarket(spec.id, 173920)).toEqual(market);
    const tick = market.tick,
      clock = market.clock;
    for (let i = 0; i < 6500; i++) market = tickMarket(market).market;
    expect(market.tick).toBe(tick + 6500);
    expect(market.clock).toBe(clock + 6500 * 90);
    expect(market.candles.length).toBe(600);
    expect(market.candles.every(validCandle)).toBe(true);
    for (const c of market.candles)
      expect(formatPrice(c.close, spec.id).split(".")[1]).toHaveLength(
        spec.precision,
      );
  });
});

describe("Multi-instrument session lifecycle", () => {
  const s = scenarios[0];
  it("starts a different history and future on each new practice session", () => {
    let state = createReplay(s, false, "live");
    const paths = new Set<string>();
    for (let i = 0; i < 8; i++) {
      paths.add(JSON.stringify(state.live.candles));
      state = replayReducer(s, state, { type: "RESTART" });
    }
    expect(paths.size).toBe(8);
    expect(state.account).toEqual(initialAccount());
    expect(state.playing).toBe(true);
  });
  it("preserves balance and instrument-tagged history when switching markets", () => {
    let state = createReplay(s, false, "live");
    const mid = currentCandle(s, state).close;
    state = replayReducer(s, state, {
      type: "ORDER",
      order: { side: "buy", units: 1000, stop: mid - 0.01, target: mid + 0.01 },
    });
    state = replayReducer(s, state, {
      type: "CLOSE",
      id: state.account.positions[0].id,
    });
    const account = state.account;
    state = replayReducer(s, state, {
      type: "INSTRUMENT",
      instrument: "XAU/USD",
      seed: 42,
    });
    expect(state.account).toEqual(account);
    expect(state.instrument).toBe("XAU/USD");
    expect(state.live.instrument).toBe("XAU/USD");
    expect(currentCandle(s, state).close).toBeGreaterThan(1000);
    expect(state.account.trades[0].instrument).toBe("EUR/USD");
    const gold = currentCandle(s, state).close;
    state = replayReducer(s, state, {
      type: "ORDER",
      order: { side: "buy", units: 0.1, stop: gold - 12, target: gold + 24 },
    });
    expect(state.account.positions[0].instrument).toBe("XAU/USD");
  });
  it("blocks market switching and cross-instrument fills while positions are open", () => {
    let state = createReplay(s, false, "live");
    const mid = currentCandle(s, state).close;
    state = replayReducer(s, state, {
      type: "ORDER",
      order: { side: "buy", units: 1000, stop: mid - 0.01, target: mid + 0.01 },
    });
    const blocked = replayReducer(s, state, {
      type: "INSTRUMENT",
      instrument: "XAU/USD",
    });
    expect(blocked.instrument).toBe("EUR/USD");
    expect(blocked.account).toEqual(state.account);
    expect(blocked.error).toContain("Close your open positions");
    const gold = getInstrument("XAU/USD"),
      c = { time: 9999999999, open: 2400, close: 2400, high: 2500, low: 2300 };
    expect(processCandle(state.account, c, gold.spread, gold.id)).toEqual(
      state.account,
    );
    expect(
      closePosition(
        state.account,
        state.account.positions[0].id,
        c,
        gold.spread,
        gold.id,
      ),
    ).toEqual(state.account);
  });
  it("does not alter any guided scenario data or its repeatable lesson assessment", () => {
    const before = JSON.stringify(s.candles);
    let state = createReplay(s);
    state = replayReducer(s, state, { type: "MODE", mode: "live", seed: 42 });
    state = replayReducer(s, state, {
      type: "INSTRUMENT",
      instrument: "XAU/USD",
    });
    state = replayReducer(s, state, { type: "MODE", mode: "replay" });
    expect(state.instrument).toBe("EUR/USD");
    expect(currentCandle(s, state)).toEqual(s.candles[s.startIndex]);
    expect(JSON.stringify(s.candles)).toBe(before);
  });
});
