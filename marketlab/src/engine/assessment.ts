import type { Annotation, Scenario } from "./types";

export function assess(s: Scenario, option: number, annotations: Annotation[]) {
  const answerCorrect = option === s.correctOption;
  const rule = s.annotation;
  const annotationCorrect =
    !rule ||
    annotations.some((a) => {
      if (a.kind !== rule.kind || a.createdAt > s.startIndex) return false;
      if (a.kind === "level")
        return a.price >= rule.low && a.price <= rule.high;
      const bottom = Math.min(a.price, a.endPrice ?? a.price);
      const top = Math.max(a.price, a.endPrice ?? a.price);
      const centre = (rule.low + rule.high) / 2;
      const allowed = rule.high - rule.low;
      return (
        bottom >= rule.low &&
        top <= rule.high &&
        bottom < centre &&
        top > centre &&
        top - bottom >= allowed * 0.2
      );
    });
  return {
    correct: answerCorrect && annotationCorrect,
    answerCorrect,
    annotationCorrect,
  };
}
