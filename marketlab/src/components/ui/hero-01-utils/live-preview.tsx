import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Pause,
  Play,
  SkipForward,
  MousePointer2,
} from "lucide-react";
import Chart from "@/components/Chart";
import { createLiveMarket, tickMarket, type LiveMarket } from "@/engine/live";
import { getInstrument } from "@/engine/instruments";
import type { Annotation, InstrumentId } from "@/engine/types";
import { ThemeContext } from "@/lib/theme";

export default function LivePreview({
  onEnter,
  onLesson,
}: {
  onEnter: () => void;
  onLesson: () => void;
}) {
  const [instrument, setInstrument] = useState<InstrumentId>("EUR/USD");
  const [market, setMarket] = useState<LiveMarket>(() =>
    createLiveMarket("EUR/USD", 3891),
  );
  const [playing, setPlaying] = useState(false);
  const [markings, setMarkings] = useState<Annotation[]>([]);
  const [choice, setChoice] = useState<"higher" | "lower" | null>(null);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setMarket((m) => tickMarket(m).market), 1000);
    return () => clearInterval(t);
  }, [playing]);
  const spec = getInstrument(instrument);
  const comparison =
    market.candles[Math.max(0, market.candles.length - 16)].close;
  const higher = market.candles.at(-1)!.close >= comparison;
  const correct = choice === (higher ? "higher" : "lower");
  function switchMarket(id: InstrumentId) {
    setInstrument(id);
    setMarket(createLiveMarket(id, 3891));
    setChoice(null);
    setMarkings([]);
    setPlaying(false);
  }
  function step() {
    setPlaying(false);
    setChoice(null);
    setMarket((m) => {
      let next = m;
      for (let i = 0; i < 10; i++) next = tickMarket(next).market;
      return next;
    });
  }
  return (
    <div className="lp-product-window" id="the-lab" tabIndex={-1}>
      <div className="lp-product-titlebar">
        <div className="lp-window-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span>CHARTSTEP / THE PRACTICE WORKSPACE</span>
        <button onClick={onEnter}>
          Open full workspace
          <ArrowUpRight size={13} />
        </button>
      </div>
      <div className="lp-product-body">
        <div className="lp-preview-main">
          <div
            className="lp-preview-tabs"
            role="group"
            aria-label="Preview market"
          >
            {(["EUR/USD", "XAU/USD", "GBP/USD"] as const).map((id) => (
              <button
                aria-pressed={instrument === id}
                className={instrument === id ? "active" : ""}
                onClick={() => switchMarket(id)}
                key={id}
              >
                {id === "XAU/USD" ? "Gold" : id}
                <span>{id === "XAU/USD" ? "XAU/USD" : "FOREX"}</span>
              </button>
            ))}
            <span className="lp-preview-session">
              <i /> PRACTICE SESSION
            </span>
          </div>
          <ThemeContext.Provider value="light">
            <Chart
              key={instrument}
              instrument={instrument}
              candles={market.candles}
              annotations={markings}
              onAnnotate={(a) => setMarkings((m) => [...m, a])}
              onClear={() => setMarkings([])}
              onUndo={() => setMarkings((m) => m.slice(0, -1))}
              index={market.candles.length - 1}
            />
          </ThemeContext.Provider>
          <div className="lp-preview-player">
            <div>
              <button
                className="lp-player-play"
                aria-label={
                  playing ? "Pause landing demo" : "Play landing demo"
                }
                onClick={() => {
                  setChoice(null);
                  setPlaying(!playing);
                }}
              >
                {playing ? (
                  <Pause size={16} />
                ) : (
                  <Play size={16} fill="currentColor" />
                )}
              </button>
              <button
                className="lp-next-bar"
                onClick={step}
                aria-label="Reveal next demo candle"
              >
                <SkipForward size={15} />
                <span>Next candle</span>
              </button>
              <span className="lp-player-speed">1×</span>
            </div>
            <span>
              {market.candles.length} candles revealed <i />{" "}
              {playing ? "Market moving" : "At your pace"}
            </span>
          </div>
        </div>
        <aside className="lp-preview-lesson">
          <div className="lp-preview-lesson-head">
            <BookOpen size={15} />
            <span>A FIRST LOOK</span>
            <span>01 / 03</span>
          </div>
          <div className="lp-preview-lesson-copy">
            <span className="lp-small-label">OBSERVE BEFORE YOU ACT</span>
            <h3>
              Start with
              <br />
              what you can see.
            </h3>
            <p>
              Compare the latest close with the close 15 candles ago. Where has{" "}
              {spec.id} finished?
            </p>
            <div
              className="lp-preview-choices"
              role="group"
              aria-label="Preview observation"
            >
              {(["higher", "lower"] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => {
                    setPlaying(false);
                    setChoice(value);
                  }}
                  className={choice === value ? "selected" : ""}
                >
                  <span className="lp-choice-radio">
                    {choice === value && <Check size={11} />}
                  </span>
                  {value === "higher" ? "Finishing higher" : "Finishing lower"}
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
            {choice ? (
              <div
                className={`lp-preview-feedback ${correct ? "correct" : ""}`}
                role="status"
              >
                <strong>
                  {correct
                    ? "That’s what the chart shows."
                    : "Take one more look."}
                </strong>
                <p>
                  The latest close is {higher ? "above" : "below"} the earlier
                  close. That describes this move. The next one is still
                  uncertain.
                </p>
              </div>
            ) : (
              <div className="lp-preview-hint">
                <MousePointer2 size={14} />
                <p>
                  Give it a try. You can draw on the chart and reveal more
                  candles, too.
                </p>
              </div>
            )}
            <button className="lp-preview-lesson-link" onClick={onLesson}>
              Try a guided lesson
              <ArrowRight size={14} />
            </button>
          </div>
        </aside>
      </div>
      <div className="lp-product-bottom">
        <span>
          <span className="lp-blue-dot" />
          Interactive preview · Synthetic prices · Fictional funds
        </span>
        <span>Room to pause. Room to think.</span>
      </div>
    </div>
  );
}
