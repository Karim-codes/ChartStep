import { describe, it, expect } from "vitest";
import { scenarios, categories } from "../src/content/scenarios";
import {
  makeCandles,
  confirmedSwings,
  validCandle,
  price,
} from "../src/engine/data";
import { assess } from "../src/engine/assessment";
import {
  createReplay,
  replayReducer,
  visibleCandles,
} from "../src/engine/replay";
import {
  initialAccount,
  quote,
  openPosition,
  closePosition,
  processCandle,
  profit,
  reserved,
  unrealised,
  availableFunds,
  SLIPPAGE,
  validateOrder,
} from "../src/engine/trading";
import { tickMarket } from "../src/engine/live";
import { currentCandle } from "../src/engine/replay";
import type { Candle } from "../src/engine/types";

const c = (
  time: number,
  open = 1.1,
  high = 1.101,
  low = 1.099,
  close = 1.1,
): Candle => ({ time, open, high, low, close });
const spread = 0.00012;
const order = { side: "buy" as const, units: 1000, stop: 1.099, target: 1.102 };

describe("Authored curriculum", () => {
  it("has 27 unique complete scenarios in nine categories, including chart assessments", () => {
    expect(scenarios).toHaveLength(27);
    expect(new Set(scenarios.map((s) => s.id)).size).toBe(27);
    expect(categories).toHaveLength(9);
    expect(
      scenarios.filter((s) => s.type === "Guided lesson" || s.annotation)
        .length,
    ).toBeGreaterThanOrEqual(8);
    expect(scenarios.filter((s) => s.annotation).length).toBeGreaterThanOrEqual(
      6,
    );
  });
  describe.each(scenarios)("$id", (s) => {
    it("has valid, ordered OHLC, an objective and complete educational feedback", () => {
      expect(s.candles.every(validCandle)).toBe(true);
      expect(
        s.candles.every((c, i) => i === 0 || c.time > s.candles[i - 1].time),
      ).toBe(true);
      expect(s.objective.length).toBeGreaterThan(10);
      expect(s.learn.length).toBeGreaterThan(100);
      expect(s.feedback.length).toBeGreaterThan(70);
      expect(s.outcome.length).toBeGreaterThan(60);
      expect(s.options[s.correctOption]).toBeTruthy();
      expect(s.revealIndex).toBeGreaterThan(s.startIndex);
      expect(s.revealIndex).toBeLessThan(s.candles.length);
    });
    it("replays exactly the revealed prefix with deterministic reset", () => {
      let state = createReplay(s);
      expect(visibleCandles(s, state.index)).toHaveLength(s.startIndex + 1);
      expect(visibleCandles(s, state.index).at(-1)).toEqual(
        s.candles[state.index],
      );
      for (let i = s.startIndex + 1; i < s.candles.length; i++) {
        state = replayReducer(s, state, { type: "NEXT" });
        expect(state.index).toBe(i);
        expect(visibleCandles(s, state.index)).toHaveLength(i + 1);
      }
      expect(replayReducer(s, state, { type: "NEXT" }).index).toBe(
        s.candles.length - 1,
      );
      state = replayReducer(s, state, { type: "RESTART" });
      expect(state.index).toBe(s.startIndex);
      expect(state.account).toEqual(initialAccount());
      expect(state.exploration).toBe(true);
    });
    it("assesses its configured answer and annotation and rejects the alternatives", () => {
      const rule = s.annotation;
      const annotations = rule
        ? [
            {
              id: "test",
              kind: rule.kind,
              price:
                rule.kind === "level"
                  ? (rule.low + rule.high) / 2
                  : rule.low + (rule.high - rule.low) * 0.15,
              endPrice: rule.high - (rule.high - rule.low) * 0.15,
              createdAt: s.startIndex,
            },
          ]
        : [];
      expect(assess(s, s.correctOption, annotations).correct).toBe(true);
      expect(
        assess(s, (s.correctOption + 1) % s.options.length, annotations)
          .correct,
      ).toBe(false);
      if (rule) {
        expect(assess(s, s.correctOption, []).correct).toBe(false);
        expect(
          assess(s, s.correctOption, [
            { ...annotations[0], price: 2, endPrice: 3 },
          ]).correct,
        ).toBe(false);
      }
    });
  });
  it("generates repeatable data from the same seed", () => {
    expect(makeCandles("up", 7)).toEqual(makeCandles("up", 7));
    expect(makeCandles("up", 8)).not.toEqual(makeCandles("up", 7));
  });
  it("demonstrates exactly the documented three-candle bullish and bearish gaps", () => {
    const bull = scenarios.find((s) => s.id === "bullish-fvg")!.candles;
    expect(bull[34].low).toBeGreaterThan(bull[32].high);
    const bear = scenarios.find((s) => s.id === "bearish-fvg")!.candles;
    expect(bear[34].high).toBeLessThan(bear[32].low);
  });
  it("includes the stated engulfing body and lower-wick/sweep observations", () => {
    const engulf = scenarios.find((s) => s.id === "engulfing")!.candles;
    expect(engulf[35].close).toBeLessThan(engulf[35].open);
    expect(engulf[36].open).toBeLessThan(engulf[35].close);
    expect(engulf[36].close).toBeGreaterThan(engulf[35].open);
    const low = scenarios.find((s) => s.id === "low-sweep")!.candles;
    expect(low[36].low).toBeLessThan(price(0));
    expect(low[36].close).toBeGreaterThan(price(0));
    const high = scenarios.find((s) => s.id === "high-sweep")!.candles;
    expect(high[36].high).toBeGreaterThan(price(9));
    expect(high[36].close).toBeLessThan(price(8));
  });
  it("confirms swings only after two revealed candles on each side", () => {
    const candles = [
      c(1, 1.1, 1.101),
      c(2, 1.1, 1.102),
      c(3, 1.1, 1.105),
      c(4, 1.1, 1.103),
      c(5, 1.1, 1.102),
    ];
    expect(confirmedSwings(candles.slice(0, 4))).toEqual([]);
    expect(confirmedSwings(candles)).toContainEqual({
      index: 2,
      price: 1.105,
      kind: "high",
    });
    for (const s of scenarios) {
      expect(
        confirmedSwings(visibleCandles(s, s.startIndex)).every(
          (p) => p.index <= s.startIndex - 2,
        ),
      ).toBe(true);
    }
  });
  it("places the uptrend exercise target at the latest confirmed swing low", () => {
    const s = scenarios.find((s) => s.id === "higher-highs")!;
    const low = confirmedSwings(visibleCandles(s, s.startIndex))
      .filter((p) => p.kind === "low")
      .at(-1)!;
    expect(low.price).toBeGreaterThanOrEqual(s.annotation!.low);
    expect(low.price).toBeLessThanOrEqual(s.annotation!.high);
  });
});

describe("Fictional EUR/USD execution", () => {
  it("opens buys at ask and sells at bid, with an immediate spread loss", () => {
    expect(quote(1.1, spread).ask - quote(1.1, spread).bid).toBeCloseTo(
      spread,
      10,
    );
    const a = openPosition(initialAccount(), order, c(1), spread);
    expect(a.positions[0].entry).toBeCloseTo(1.10006, 8);
    expect(unrealised(a, 1.1, spread)).toBeCloseTo(-0.12, 6);
    const b = openPosition(
      initialAccount(),
      { ...order, side: "sell", stop: 1.102, target: 1.098 },
      c(1),
      spread,
    );
    expect(b.positions[0].entry).toBeCloseTo(1.09994, 8);
    expect(unrealised(b, 1.1, spread)).toBeCloseTo(-0.12, 6);
  });
  it("reserves full unleveraged notional across multiple positions", () => {
    const a = openPosition(initialAccount(), order, c(1), spread);
    expect(reserved(a)).toBeCloseTo(1100.06, 6);
    expect(a.balance).toBe(10000);
    expect(availableFunds(a, 1.1, spread)).toBeCloseTo(8899.82, 5);
    expect(validateOrder(a, { ...order, units: 9000 }, 1.1, spread)).toContain(
      "Choose fewer units",
    );
  });
  it("calculates long and short P&L in USD", () => {
    expect(profit({ entry: 1.1, side: "buy", units: 2000 }, 1.102)).toBe(4);
    expect(profit({ entry: 1.1, side: "sell", units: 2000 }, 1.098)).toBe(4);
  });
  it("manually closes at executable quote and updates balance, equity and history", () => {
    let a = openPosition(initialAccount(), order, c(1), spread);
    a = closePosition(
      a,
      a.positions[0].id,
      c(2, 1.101, 1.102, 1.1, 1.101),
      spread,
    );
    expect(a.positions).toHaveLength(0);
    expect(a.trades).toHaveLength(1);
    expect(a.trades[0].pnl).toBeCloseTo(0.88, 6);
    expect(a.balance).toBeCloseTo(10000.88, 6);
    expect(reserved(a)).toBe(0);
    expect(unrealised(a, 1.101, spread)).toBe(0);
    expect(closePosition(a, "missing", c(3), spread)).toEqual(a);
  });
  it("processes stop-loss using bid low and adverse slippage", () => {
    const a = processCandle(
      openPosition(initialAccount(), order, c(1), spread),
      c(2, 1.1, 1.1005, 1.0985, 1.099),
      spread,
    );
    expect(a.trades[0].reason).toBe("Stop-loss");
    expect(a.trades[0].exit).toBeCloseTo(order.stop - SLIPPAGE, 8);
    expect(a.balance).toBeCloseTo(9998.92, 6);
  });
  it("processes take-profit without a fabricated P&L", () => {
    const a = processCandle(
      openPosition(initialAccount(), order, c(1), spread),
      c(2, 1.101, 1.103, 1.1005, 1.1025),
      spread,
    );
    expect(a.trades[0].reason).toBe("Take-profit");
    expect(a.trades[0].exit).toBe(order.target);
    expect(a.trades[0].pnl).toBeCloseTo(1.94, 6);
  });
  it("uses stop-first if both boundaries are touched with no opening trigger", () => {
    const a = processCandle(
      openPosition(initialAccount(), order, c(1), spread),
      c(2, 1.1, 1.104, 1.097, 1.101),
      spread,
    );
    expect(a.trades[0].reason).toBe("Stop-loss");
  });
  it("honours a known target at the open before a later intrabar stop", () => {
    const a = processCandle(
      openPosition(initialAccount(), order, c(1), spread),
      c(2, 1.103, 1.104, 1.097, 1.1),
      spread,
    );
    expect(a.trades[0].reason).toBe("Take-profit");
    expect(a.trades[0].exit).toBe(order.target);
  });
  it("fills adverse stop gaps at the opening quote rather than the unavailable stop", () => {
    const a = processCandle(
      openPosition(initialAccount(), order, c(1), spread),
      c(2, 1.097, 1.098, 1.096, 1.097),
      spread,
    );
    expect(a.trades[0].exit).toBeCloseTo(1.097 - spread / 2 - SLIPPAGE, 8);
    expect(a.trades[0].exit).toBeLessThan(order.stop);
  });
  it("handles sell stops, targets and adverse upward gaps using ask prices", () => {
    const sell = {
      ...order,
      side: "sell" as const,
      stop: 1.102,
      target: 1.098,
    };
    let a = openPosition(initialAccount(), sell, c(1), spread);
    a = processCandle(a, c(2, 1.1, 1.103, 1.099, 1.102), spread);
    expect(a.trades[0].exit).toBeCloseTo(1.102 + SLIPPAGE, 8);
    let b = openPosition(initialAccount(), sell, c(1), spread);
    b = processCandle(b, c(2, 1.099, 1.1, 1.097, 1.098), spread);
    expect(b.trades[0].reason).toBe("Take-profit");
    let d = openPosition(initialAccount(), sell, c(1), spread);
    d = processCandle(d, c(2, 1.104, 1.105, 1.103, 1.104), spread);
    expect(d.trades[0].exit).toBeCloseTo(1.104 + spread / 2 + SLIPPAGE, 8);
  });
  it("does not retroactively process the entry candle", () => {
    const a = openPosition(
      initialAccount(),
      order,
      c(1, 1.1, 1.2, 1.0),
      spread,
    );
    expect(processCandle(a, c(1, 1.1, 1.2, 1.0), spread)).toEqual(a);
  });
  it.each([NaN, Infinity, 0, -1, 1.5, 1000001])(
    "rejects invalid units %s",
    (units) => {
      expect(() =>
        openPosition(initialAccount(), { ...order, units }, c(1), spread),
      ).toThrow();
    },
  );
  it.each([
    { stop: 0, target: 1.102 },
    { stop: 1.101, target: 1.102 },
    { stop: 1.099, target: 1.09 },
    { stop: NaN, target: 1.102 },
    { stop: 1.099, target: Infinity },
  ])("rejects impossible boundary parameters %j", (bad) => {
    expect(() =>
      openPosition(initialAccount(), { ...order, ...bad }, c(1), spread),
    ).toThrow();
  });
  it("processes multiple positions without skipping after an earlier fill", () => {
    let a = openPosition(initialAccount(), order, c(1), spread);
    a = openPosition(a, { ...order, units: 500 }, c(1), spread);
    a = processCandle(a, c(2, 1.1, 1.104, 1.097, 1.1), spread);
    expect(a.positions).toHaveLength(0);
    expect(a.trades).toHaveLength(2);
    expect(a.balance).toBeCloseTo(9998.38, 6);
  });
});

describe("Replay and assessment lifecycle", () => {
  const s = scenarios[0];
  it("clears orders, drawings and submitted assessment when rewinding", () => {
    let state = createReplay(s);
    const mid = s.candles[state.index].close;
    state = replayReducer(s, state, {
      type: "ORDER",
      order: { ...order, stop: mid - 0.001, target: mid + 0.002 },
    });
    state = replayReducer(s, state, {
      type: "ANNOTATE",
      annotation: {
        id: "a",
        kind: "level",
        price: mid,
        createdAt: state.index,
      },
    });
    state = replayReducer(s, state, { type: "SELECT", option: 0 });
    state = replayReducer(s, state, { type: "SUBMIT" });
    state = replayReducer(s, state, { type: "NEXT" });
    state = replayReducer(s, state, { type: "PREVIOUS" });
    expect(state.index).toBe(s.startIndex);
    expect(state.account).toEqual(initialAccount());
    expect(state.annotations).toEqual([]);
    expect(state.submitted).toBe(false);
    expect(state.selected).toBeNull();
    expect(state.exploration).toBe(true);
    expect(state.playing).toBe(false);
  });
  it("locks answers and drawings after submission", () => {
    let state = createReplay(s);
    state = replayReducer(s, state, { type: "SELECT", option: 0 });
    state = replayReducer(s, state, { type: "SUBMIT" });
    expect(replayReducer(s, state, { type: "SELECT", option: 1 })).toEqual(
      state,
    );
    expect(
      replayReducer(s, state, {
        type: "ANNOTATE",
        annotation: {
          id: "late",
          kind: "level",
          price: 1.1,
          createdAt: state.index,
        },
      }),
    ).toEqual(state);
  });
  it("does not submit an empty answer and marks revealed-before-answer attempts as exploration", () => {
    const state = createReplay(s);
    expect(replayReducer(s, state, { type: "SUBMIT" })).toEqual(state);
    let advanced = replayReducer(s, state, { type: "NEXT" });
    advanced = replayReducer(s, advanced, { type: "SELECT", option: 0 });
    advanced = replayReducer(s, advanced, { type: "SUBMIT" });
    expect(advanced.exploration).toBe(true);
  });
  it("bounds playback speeds and pauses at the end", () => {
    let state = createReplay(s);
    state = replayReducer(s, state, { type: "SPEED", speed: 100 });
    expect(state.speed).toBe(1);
    state = replayReducer(s, state, { type: "SPEED", speed: 4 });
    expect(state.speed).toBe(4);
    state = { ...state, index: s.candles.length - 2, playing: true };
    state = replayReducer(s, state, { type: "NEXT" });
    expect(state.playing).toBe(false);
  });
  it("does not use future data to confirm a visible swing", () => {
    const prefix = visibleCandles(s, s.startIndex);
    const before = confirmedSwings(prefix);
    const mutated = {
      ...s,
      candles: [
        ...prefix,
        ...s.candles
          .slice(s.startIndex + 1)
          .map((c) => ({ ...c, high: c.high * 2, close: c.close * 2 })),
      ],
    };
    expect(confirmedSwings(visibleCandles(mutated, s.startIndex))).toEqual(
      before,
    );
  });
});

describe("Continuous synthetic practice", () => {
  const s = scenarios[0];
  it.each([10000, 50000, 100000])(
    "starts with the selected $%s account and preserves it through restart",
    (balance) => {
      let state = createReplay(s, false, "live", balance);
      expect(state.account.balance).toBe(balance);
      expect(state.playing).toBe(true);
      state = replayReducer(s, state, { type: "RESTART" });
      expect(state.account.balance).toBe(balance);
      expect(state.mode).toBe("live");
    },
  );
  it("rejects unsupported balances and changing account clears trades without clearing drawings", () => {
    expect(initialAccount(25).balance).toBe(10000);
    let state = createReplay(s, false, "live");
    state = replayReducer(s, state, {
      type: "ANNOTATE",
      annotation: {
        id: "x",
        kind: "level",
        price: 1.084,
        createdAt: state.index,
      },
    });
    const mid = currentCandle(s, state).close;
    state = replayReducer(s, state, {
      type: "ORDER",
      order: { ...order, stop: mid - 0.001, target: mid + 0.002 },
    });
    state = replayReducer(s, state, { type: "SET_BALANCE", balance: 50000 });
    expect(state.account).toEqual(initialAccount(50000));
    expect(state.annotations).toHaveLength(1);
  });
  it("generates a valid bounded stream beyond the end of every authored scenario", () => {
    let state = createReplay(s, false, "live");
    const startingTick = state.live.tick;
    for (let i = 0; i < 7000; i++)
      state = replayReducer(s, state, { type: "NEXT" });
    expect(state.playing).toBe(true);
    expect(state.live.tick).toBe(startingTick + 7000);
    expect(state.live.candles.length).toBeLessThanOrEqual(600);
    expect(state.live.candles.every(validCandle)).toBe(true);
    expect(
      state.live.candles.every(
        (c, i, cs) => i === 0 || c.time - cs[i - 1].time === 900,
      ),
    ).toBe(true);
  });
  it("reproduces the same ticks without preloading future bars", () => {
    const a = createReplay(s, false, "live"),
      b = createReplay(s, false, "live");
    expect(a.live.candles).toHaveLength(s.startIndex + 1);
    expect(tickMarket(a.live)).toEqual(tickMarket(b.live));
    expect(a.live.clock).toBeLessThan(a.live.candles.at(-1)!.time + 900);
  });
  it("updates unrealised P&L, permits additional buys and closes a chosen one without removing the others", () => {
    let state = createReplay(s, false, "live");
    const mid = currentCandle(s, state).close;
    state = replayReducer(s, state, {
      type: "ORDER",
      order: { ...order, stop: mid - 0.005, target: mid + 0.005 },
    });
    const first = state.account.positions[0].id;
    state = replayReducer(s, state, {
      type: "ORDER",
      order: { ...order, units: 500, stop: mid - 0.005, target: mid + 0.005 },
    });
    expect(state.account.positions).toHaveLength(2);
    const prior = unrealised(state.account, mid, s.spread);
    state = replayReducer(s, state, { type: "NEXT" });
    expect(
      unrealised(state.account, currentCandle(s, state).close, s.spread),
    ).not.toBe(prior);
    state = replayReducer(s, state, { type: "CLOSE", id: first });
    expect(state.account.positions).toHaveLength(1);
    expect(state.account.trades).toHaveLength(1);
    expect(state.account.balance).toBeCloseTo(
      10000 + state.account.trades[0].pnl,
      6,
    );
  });
  it("keeps drawings while streaming and forbids rewind in continuous mode", () => {
    let state = createReplay(s, false, "live");
    state = replayReducer(s, state, {
      type: "ANNOTATE",
      annotation: {
        id: "t",
        kind: "trend",
        price: 1.08,
        endPrice: 1.09,
        time: 1,
        endTime: 2,
        createdAt: state.index,
      },
    });
    state = replayReducer(s, state, { type: "NEXT" });
    expect(state.annotations).toHaveLength(1);
    expect(replayReducer(s, state, { type: "PREVIOUS" })).toEqual(state);
    state = replayReducer(s, state, { type: "UNDO" });
    expect(state.annotations).toHaveLength(0);
  });
  it("does not award a fresh scored attempt after viewing the continuous market", () => {
    let state = createReplay(s, false, "live");
    state = replayReducer(s, state, { type: "MODE", mode: "replay" });
    expect(state.exploration).toBe(true);
    expect(state.account).toEqual(initialAccount());
  });
});
