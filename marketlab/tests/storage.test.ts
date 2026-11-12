import { describe, it, expect, vi, afterEach } from "vitest";
import {
  readProgress,
  writeProgress,
  emptyProgress,
  STORAGE_KEY,
} from "../src/lib/storage";
import {
  readPractice,
  writePractice,
  clearPractice,
  PRACTICE_KEY,
} from "../src/lib/practice-storage";
import { scenarios } from "../src/content/scenarios";
import {
  createReplay,
  currentCandle,
  replayReducer,
} from "../src/engine/replay";
function mockStorage() {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
    removeItem: (k: string) => values.delete(k),
  });
  return values;
}
afterEach(() => vi.unstubAllGlobals());
describe("Local learning records", () => {
  it("loads safely when storage is empty, corrupt or unavailable", () => {
    const map = mockStorage();
    expect(readProgress()).toEqual(emptyProgress());
    map.set(STORAGE_KEY, "broken json");
    expect(readProgress()).toEqual(emptyProgress());
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("full");
      },
    });
    expect(readProgress()).toEqual(emptyProgress());
    expect(writeProgress(emptyProgress())).toBe(false);
  });
  it("persists journal, real completion, theme and chosen practice balance", () => {
    mockStorage();
    const p = {
      ...emptyProgress(),
      theme: "dark" as const,
      practiceBalance: 100000,
      completed: ["candle-body"],
      journal: [
        {
          id: "a",
          scenarioId: "candle-body",
          at: "2026-11-12T00:00:00Z",
          analysis: "Price rose",
          hypothesis: "Observe",
          risk: "Small",
          happened: "A pullback",
          learned: "Patterns are uncertain",
        },
      ],
    };
    expect(writeProgress(p)).toBe(true);
    expect(readProgress()).toEqual(p);
  });
  it("migrates older local records to sensible preferences", () => {
    const map = mockStorage();
    map.set(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        completed: [],
        practiceBalance: 5,
        theme: "unknown",
      }),
    );
    expect(readProgress().practiceBalance).toBe(10000);
    expect(readProgress().theme).toBe("light");
  });
});
describe("Practice recovery", () => {
  it("migrates an existing EUR/USD account without losing its positions or balance", () => {
    const map = mockStorage(),
      s = scenarios[0];
    let state = createReplay(s, false, "live");
    const mid = currentCandle(s, state).close;
    state = replayReducer(s, state, {
      type: "ORDER",
      order: {
        side: "buy",
        units: 1000,
        stop: mid - 0.001,
        target: mid + 0.002,
      },
    });
    const legacy = JSON.parse(JSON.stringify(state));
    delete legacy.instrument;
    delete legacy.live.instrument;
    delete legacy.live.sessionSeed;
    delete legacy.account.positions[0].instrument;
    map.set(
      PRACTICE_KEY,
      JSON.stringify({ version: 1, scenarioId: s.id, state: legacy }),
    );
    const recovered = readPractice(s, 10000);
    expect(recovered.account).toEqual(legacy.account);
    expect(recovered.instrument).toBe("EUR/USD");
    expect(recovered.live.instrument).toBe("EUR/USD");
    expect(recovered.playing).toBe(false);
  });
  it("recovers drawings and an open position while resuming paused", () => {
    mockStorage();
    const s = scenarios[0];
    let state = createReplay(s, false, "live", 50000);
    const mid = currentCandle(s, state).close;
    state = replayReducer(s, state, {
      type: "ORDER",
      order: {
        side: "buy",
        units: 1000,
        stop: mid - 0.001,
        target: mid + 0.002,
      },
    });
    state = replayReducer(s, state, {
      type: "ANNOTATE",
      annotation: {
        id: "line",
        kind: "level",
        price: mid,
        createdAt: state.index,
      },
    });
    writePractice(s.id, state);
    const restored = readPractice(s, 50000);
    expect(restored.account).toEqual(state.account);
    expect(restored.annotations).toEqual(state.annotations);
    expect(restored.playing).toBe(false);
    expect(restored.live).toEqual(state.live);
  });
  it("does not recover another scenario, balance or corrupt market data", () => {
    const map = mockStorage();
    const s = scenarios[0],
      state = createReplay(s, false, "live");
    writePractice(s.id, state);
    expect(readPractice(s, 100000).account.balance).toBe(100000);
    expect(readPractice(scenarios[1], 10000).playing).toBe(true);
    map.set(
      PRACTICE_KEY,
      JSON.stringify({
        version: 1,
        scenarioId: s.id,
        state: {
          ...state,
          live: {
            ...state.live,
            candles: [{ time: 1, open: 1, high: 0, low: 2, close: 1 }],
          },
        },
      }),
    );
    expect(readPractice(s, 10000).account.positions).toEqual([]);
    expect(readPractice(s, 10000).playing).toBe(true);
  });
  it("clears recovered data on demo reset and when switching out of continuous practice", () => {
    mockStorage();
    const s = scenarios[0];
    writePractice(s.id, createReplay(s, false, "live"));
    clearPractice();
    expect(localStorage.getItem(PRACTICE_KEY)).toBeNull();
    writePractice(s.id, createReplay(s, false, "live"));
    writePractice(s.id, createReplay(s));
    expect(localStorage.getItem(PRACTICE_KEY)).toBeNull();
  });
});
