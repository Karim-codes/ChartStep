import type { Progress } from "../engine/types";
export const STORAGE_KEY = "marketlab.learning.v1";
export const emptyProgress = (): Progress => ({
  version: 1,
  completed: [],
  attempts: [],
  journal: [],
  sessions: [],
  lastScenarioId: "candle-body",
  academyTheme: false,
  theme: "light",
  practiceBalance: 10000,
});
export function readProgress(): Progress {
  try {
    const p = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!p || p.version !== 1) return emptyProgress();
    return {
      ...emptyProgress(),
      completed: Array.isArray(p.completed)
        ? p.completed.filter((v: unknown) => typeof v === "string")
        : [],
      attempts: Array.isArray(p.attempts)
        ? p.attempts.filter(
            (a: unknown) =>
              a &&
              typeof a === "object" &&
              "scenarioId" in a &&
              "correct" in a &&
              "at" in a,
          )
        : [],
      journal: Array.isArray(p.journal)
        ? p.journal.filter(
            (a: unknown) =>
              a &&
              typeof a === "object" &&
              "id" in a &&
              "learned" in a &&
              "at" in a,
          )
        : [],
      sessions: Array.isArray(p.sessions)
        ? p.sessions.filter(
            (a: unknown) =>
              a &&
              typeof a === "object" &&
              "id" in a &&
              "trades" in a &&
              Array.isArray(a.trades),
          )
        : [],
      lastScenarioId:
        typeof p.lastScenarioId === "string" ? p.lastScenarioId : "candle-body",
      academyTheme: p.academyTheme === true,
      theme: p.theme === "dark" ? "dark" : "light",
      practiceBalance: [10000, 50000, 100000].includes(p.practiceBalance)
        ? p.practiceBalance
        : 10000,
    };
  } catch {
    return emptyProgress();
  }
}
export function writeProgress(p: Progress): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}
