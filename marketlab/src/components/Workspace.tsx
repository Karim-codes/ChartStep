import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  ShieldCheck,
  Info,
  CheckCircle2,
  NotebookPen,
  X,
  Target,
  Save,
  ArrowUpRight,
} from "lucide-react";
import { scenarios } from "../content/scenarios";
import {
  createReplay,
  currentCandle,
  executionSpread,
  replayReducer,
  visibleCandles,
  type ReplayAction,
  type ReplayState,
} from "../engine/replay";
import { assess } from "../engine/assessment";
import {
  PRACTICE_BALANCES,
  availableFunds,
  closePosition,
  entryPrice,
  exitPrice,
  profit,
  quote,
  reserved,
  unrealised,
} from "../engine/trading";
import type {
  Attempt,
  JournalEntry,
  SavedSession,
  Scenario,
  Side,
} from "../engine/types";
import Chart from "./Chart";
import { JournalForm } from "../App";
import { readPractice, writePractice } from "../lib/practice-storage";
import { newMarketSeed } from "../engine/live";
import {
  instruments,
  getInstrument,
  formatPrice,
  spreadDescription,
  slippageDescription,
} from "../engine/instruments";
import type { InstrumentId } from "../engine/types";

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );
interface Props {
  scenario: Scenario;
  trading: boolean;
  initialBalance: number;
  onBalanceChange: (balance: number) => void;
  onSwitch: (id: string) => void;
  onAttempt: (a: Attempt) => void;
  onSession: (s: SavedSession) => void;
  onJournal: (e: JournalEntry) => void;
  completed: string[];
  onGlossary: () => void;
  onLibrary: () => void;
  onProgress: () => void;
}
export default function Workspace({
  scenario: s,
  trading,
  initialBalance,
  onBalanceChange,
  onSwitch,
  onAttempt,
  onSession,
  onJournal,
  completed,
  onGlossary,
  onLibrary,
  onProgress,
}: Props) {
  const [state, dispatch] = useReducer(
    (state: ReplayState, action: ReplayAction) =>
      replayReducer(s, state, action),
    s,
    () =>
      trading
        ? readPractice(s, initialBalance)
        : createReplay(s, completed.includes(s.id), "replay", initialBalance),
  );
  const [panel, setPanel] = useState<"lesson" | "trade" | "reflect">(
    trading ? "trade" : "lesson",
  );
  const [resetKey, setResetKey] = useState(0);
  const [savedSignature, setSavedSignature] = useState("");
  const [showRules, setShowRules] = useState(false);
  const reported = useRef(false);
  const sessionId = useRef(crypto.randomUUID());
  const signature = `${state.index}:${state.account.positions.length}:${state.account.trades.length}:${state.account.balance}`;
  const saved = signature === savedSignature;
  const live = state.mode === "live";
  const spec = getInstrument(state.instrument);
  const candle = currentCandle(s, state);
  const candles = useMemo(
    () => (live ? state.live.candles : visibleCandles(s, state.index)),
    [s, state.index, state.live.candles, live],
  );
  const result = assess(s, state.selected ?? -1, state.annotations);
  const feedbackReady =
    !live && state.submitted && state.index >= s.revealIndex;
  const explored =
    state.exploration || (!state.submitted && state.index > s.startIndex);
  const next =
    scenarios[
      (scenarios.findIndex((sc) => sc.id === s.id) + 1) % scenarios.length
    ];
  const progress =
    ((state.index - s.startIndex) / (s.candles.length - 1 - s.startIndex)) *
    100;
  useEffect(() => {
    if (trading) writePractice(s.id, state);
  }, [trading, s.id, state]);
  useEffect(() => {
    if (!state.playing) return;
    const t = setInterval(() => dispatch({ type: "NEXT" }), 1000 / state.speed);
    return () => clearInterval(t);
  }, [state.playing, state.speed]);
  useEffect(() => {
    if (feedbackReady && state.playing && state.index === s.revealIndex)
      dispatch({ type: "PAUSE" });
  }, [feedbackReady, state.index, state.playing, s.revealIndex]);
  useEffect(() => {
    if (!feedbackReady || reported.current) return;
    reported.current = true;
    onAttempt({
      scenarioId: s.id,
      correct: result.correct,
      at: new Date().toISOString(),
      exploration: state.exploration,
      answer: s.options[state.selected ?? 0],
    });
  }, [
    feedbackReady,
    onAttempt,
    result.correct,
    s,
    state.exploration,
    state.selected,
  ]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        (["INPUT", "TEXTAREA", "SELECT", "BUTTON", "SUMMARY", "A"].includes(
          e.target.tagName,
        ) ||
          e.target.isContentEditable)
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        dispatch({ type: state.playing ? "PAUSE" : "PLAY" });
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        dispatch({ type: "NEXT" });
      }
      if (e.key === "ArrowLeft" && !live) {
        e.preventDefault();
        dispatch({ type: "PREVIOUS" });
        reported.current = false;
        setSavedSignature("");
      }
    };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, [state.playing, live]);
  function restart() {
    dispatch({ type: "RESTART", seed: newMarketSeed() });
    reported.current = false;
    setResetKey((k) => k + 1);
    setSavedSignature("");
    sessionId.current = crypto.randomUUID();
  }
  function saveSession() {
    dispatch({ type: "PAUSE" });
    let account = state.account;
    for (const p of account.positions) {
      account = closePosition(
        account,
        p.id,
        candle,
        executionSpread(s, state),
        state.instrument,
      );
      dispatch({ type: "CLOSE", id: p.id });
    }
    onSession({
      id: sessionId.current,
      scenarioId: s.id,
      at: new Date().toISOString(),
      balance: account.balance,
      initialBalance: state.initialBalance,
      mode: state.mode,
      trades: account.trades,
      instrument: state.instrument,
    });
    setSavedSignature(
      `${state.index}:${account.positions.length}:${account.trades.length}:${account.balance}`,
    );
  }
  function changeMode(mode: "live" | "replay") {
    dispatch({ type: "MODE", mode, seed: newMarketSeed() });
    setPanel(mode === "live" ? "trade" : "lesson");
    reported.current = false;
    setResetKey((k) => k + 1);
    setSavedSignature("");
    sessionId.current = crypto.randomUUID();
  }
  function changeBalance(balance: number) {
    dispatch({ type: "SET_BALANCE", balance });
    onBalanceChange(balance);
    setSavedSignature("");
    sessionId.current = crypto.randomUUID();
  }
  function changeInstrument(instrument: InstrumentId) {
    dispatch({ type: "INSTRUMENT", instrument, seed: newMarketSeed() });
    setResetKey((k) => k + 1);
    setSavedSignature("");
  }
  return (
    <>
      <div className="workspace-titlebar">
        <div>
          <button className="back-link" onClick={onLibrary}>
            <ArrowLeft size={15} />
            Scenario library
          </button>
          <div className="workspace-title">
            <h1>{live ? "Your practice market" : s.title}</h1>
            <span className={`pill ${explored ? "sand-pill" : "green"}`}>
              {live
                ? "Continuous practice"
                : explored
                  ? "Exploration mode"
                  : s.type}
            </span>
          </div>
          <p>
            {live
              ? "A moving market. A clear plan. All the space you need to practise."
              : s.description}
          </p>
        </div>
        <label className="scenario-switch">
          {live ? (
            <>
              <span>Practice market</span>
              <select
                aria-label="Practice instrument"
                value={state.instrument}
                disabled={state.account.positions.length > 0}
                onChange={(e) =>
                  changeInstrument(e.target.value as InstrumentId)
                }
              >
                {(["Forex", "Metals"] as const).map((group) => (
                  <optgroup key={group} label={group}>
                    {instruments
                      .filter((i) => i.group === group)
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} · {i.id}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </>
          ) : (
            <>
              <span>Explore another scenario</span>
              <select
                value={s.id}
                onChange={(e) => onSwitch(e.target.value)}
                aria-label="Switch scenario"
              >
                {scenarios.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.title}
                  </option>
                ))}
              </select>
            </>
          )}
        </label>
      </div>
      <div className="practice-setup">
        <div
          className="market-mode-toggle"
          role="group"
          aria-label="Market mode"
        >
          <button
            className={!live ? "selected" : ""}
            onClick={() => changeMode("replay")}
          >
            <BookOpen size={15} />
            Guided replay
          </button>
          <button
            className={live ? "selected" : ""}
            onClick={() => changeMode("live")}
          >
            <span className="stream-dot" />
            Continuous market
          </button>
        </div>
        {live && (
          <button className="button secondary fresh-market" onClick={restart}>
            <RotateCcw size={14} />
            Fresh market
          </button>
        )}
        <label className="balance-picker">
          Starting account
          <select
            aria-label="Starting account balance"
            value={state.initialBalance}
            onChange={(e) => changeBalance(Number(e.target.value))}
          >
            {PRACTICE_BALANCES.map((b) => (
              <option key={b} value={b}>
                {usd(b)} virtual
              </option>
            ))}
          </select>
        </label>
        <p>
          Changing mode or balance starts a fresh account.{" "}
          {live &&
            (state.account.positions.length
              ? "Close positions to switch markets; your balance and history stay."
              : "Switch markets to explore gold, silver and forex. Balance and history stay; chart drawings reset.")}
        </p>
      </div>
      <div className="simulation-notice">
        <span>
          <i />{" "}
          {live
            ? "CONTINUOUS SIMULATION · NOT LIVE MARKET DATA"
            : "SYNTHETIC MARKET · FICTIONAL FUNDS"}
        </span>
        <button onClick={onGlossary}>
          <BookOpen size={14} />
          Need a definition?
          <ArrowUpRight size={13} />
        </button>
      </div>
      <div className="workspace-grid">
        <section className="replay-column">
          <div className="replay-chart-panel">
            <Chart
              key={`${state.mode}-${state.instrument}`}
              instrument={state.instrument}
              candles={candles}
              index={state.index}
              annotations={state.annotations}
              onAnnotate={(annotation) =>
                dispatch({ type: "ANNOTATE", annotation })
              }
              onClear={() => dispatch({ type: "CLEAR" })}
              locked={!live && state.submitted}
              resetKey={resetKey}
              onUndo={() => dispatch({ type: "UNDO" })}
              positions={state.account.positions}
            />
            <div className="replay-controls">
              <div className="playback-buttons">
                <button
                  className="icon-button"
                  aria-label={live ? "New market session" : "Restart scenario"}
                  onClick={restart}
                >
                  <RotateCcw size={17} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Previous candle (clears orders and assessment)"
                  disabled={live || state.index <= s.startIndex}
                  onClick={() => {
                    dispatch({ type: "PREVIOUS" });
                    reported.current = false;
                    setSavedSignature("");
                  }}
                >
                  <SkipBack size={17} />
                </button>
                <button
                  className="play-button"
                  aria-label={state.playing ? "Pause replay" : "Play replay"}
                  disabled={!live && state.index === s.candles.length - 1}
                  onClick={() =>
                    dispatch({ type: state.playing ? "PAUSE" : "PLAY" })
                  }
                >
                  {state.playing ? (
                    <Pause size={18} />
                  ) : (
                    <Play size={18} fill="currentColor" />
                  )}
                </button>
                <button
                  className="icon-button"
                  aria-label="Next candle"
                  disabled={!live && state.index === s.candles.length - 1}
                  onClick={() => dispatch({ type: "NEXT" })}
                >
                  <SkipForward size={17} />
                </button>
                <label className="speed-select">
                  <span className="sr-only">Playback speed</span>
                  <select
                    aria-label="Playback speed"
                    value={state.speed}
                    onChange={(e) =>
                      dispatch({ type: "SPEED", speed: Number(e.target.value) })
                    }
                  >
                    {[0.5, 1, 2, 4].map((n) => (
                      <option key={n} value={n}>
                        {n}×
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={12} />
                </label>
              </div>
              <div className="replay-count">
                <span>
                  {live ? (
                    <>
                      <i className="stream-dot" />{" "}
                      {state.playing ? "Market moving" : "Market paused"}
                    </>
                  ) : (
                    <>
                      Candle <strong>{state.index + 1}</strong> /{" "}
                      {s.candles.length}
                    </>
                  )}
                </span>
                <span className="replay-utc">
                  {new Date(candle.time * 1000).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "UTC",
                  })}{" "}
                  UTC
                </span>
              </div>
            </div>
            <div
              className={`replay-progress ${live ? "stream-progress" : ""}`}
              role="progressbar"
              aria-label="Scenario replay progress"
              aria-valuenow={live ? undefined : Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: live ? "100%" : `${progress}%` }} />
            </div>
          </div>
          <div className="chart-position-strip">
            <PositionActions
              state={state}
              scenario={s}
              dispatch={dispatch}
              compact
            />
          </div>
          <div className="replay-helper">
            <Info size={15} />
            <p>
              {live
                ? "Synthetic quotes update every second at 1× speed. A new 15-minute candle forms every ten simulated ticks. Pause whenever you need; orders and drawings stay in place. Your practice account is saved on this device and resumes paused after leaving. Each new session has a fresh price path."
                : state.index === s.candles.length - 1
                  ? "All candles revealed. Review your decision, save a reflection or explore another scenario."
                  : explored
                    ? "Exploration is for learning. Decisions in this run receive feedback without assessed completion."
                    : "The future stays hidden until you reveal it. Make your decision first for an assessed attempt."}
              <span>
                {" "}
                {live
                  ? "Restart begins a new fictional session."
                  : "Rewinding clears orders, annotations and the current answer."}{" "}
                Restart resets your selected {usd(state.initialBalance)}{" "}
                account.
              </span>
            </p>
          </div>
          <section className="workspace-context">
            <div>
              <span className="section-eyebrow">YOUR LEARNING OBJECTIVE</span>
              <h3>{live ? "Practise a repeatable process" : s.objective}</h3>
              <p>
                {live ? `Ongoing synthetic ${spec.name} market` : s.category} ·{" "}
                {s.difficulty} · {s.duration} minutes
              </p>
            </div>
            <span className="context-icon">
              <Target size={26} />
            </span>
          </section>
          <details className="keyboard-help">
            <summary>
              Make the workspace your own
              <ChevronDown size={15} />
            </summary>
            <p>
              <kbd>Space</kbd> Play / pause <kbd>→</kbd> Next candle{" "}
              <kbd>←</kbd> Explore previous candle. Shortcuts apply when not
              typing or using a control. Horizontal levels and regions can also
              be entered as numeric prices for keyboard access. Show Swings to
              see confirmed local turning points only.
            </p>
          </details>
        </section>
        <aside className="lesson-panel">
          <div className="lesson-panel-tabs">
            <button
              className={panel === "lesson" ? "active" : ""}
              onClick={() => setPanel("lesson")}
            >
              <BookOpen size={15} />
              Learn
            </button>
            <button
              className={panel === "trade" ? "active" : ""}
              onClick={() => setPanel("trade")}
            >
              <Target size={15} />
              Practise
            </button>
            <button
              className={panel === "reflect" ? "active" : ""}
              onClick={() => setPanel("reflect")}
            >
              <NotebookPen size={15} />
              Reflect
            </button>
          </div>
          {panel === "lesson" && live ? (
            <div className="lesson-content live-learning">
              <div className="lesson-step-label">
                <span>01</span> A MARKET THAT KEEPS MOVING
              </div>
              <h2>Plan. Act. Observe. Reflect.</h2>
              <p>
                This continuous market is generated locally as you watch. Quotes
                move, current candles develop and new candles form. It is
                fictional price action, with no connection to a live exchange.
              </p>
              <div className="challenge-box">
                <h3>Your practice plan</h3>
                <p>
                  Mark a level or a trend line. Choose your units, stop and
                  target. Open a buy or sell, add another position if it fits
                  your plan, and use the close action beside each position
                  whenever you choose.
                </p>
              </div>
              <p>
                Selling to close a buy locks in its current gain or loss.
                Opening a new sell is a separate bearish position. ChartStep
                keeps these actions separate and labels them clearly.
              </p>
              <button
                className="button primary live-start"
                onClick={() => setPanel("trade")}
              >
                Open the order ticket
                <ArrowRight size={16} />
              </button>
              <button
                className="text-button"
                onClick={() => changeMode("replay")}
              >
                Prefer a guided exercise?
                <ArrowRight size={14} />
              </button>
            </div>
          ) : panel === "lesson" ? (
            <div className="lesson-content">
              <div className="lesson-step-label">
                <span>01</span> UNDERSTAND THE IDEA
              </div>
              <h2>What you’ll learn</h2>
              <p>{s.learn}</p>
              <div className="challenge-box">
                <div className="lesson-step-label">
                  <span>02</span> OBSERVE & DECIDE
                </div>
                <h3>Your challenge</h3>
                <p>{s.challenge}</p>
                {s.annotation && (
                  <div className="annotation-instruction">
                    <span className="annotation-indicator">
                      {state.annotations.some(
                        (a) => a.kind === s.annotation?.kind,
                      ) ? (
                        <Check size={14} />
                      ) : (
                        <Target size={14} />
                      )}
                    </span>
                    <p>{s.annotation.instruction}</p>
                  </div>
                )}
              </div>
              <fieldset className="decision-options" disabled={state.submitted}>
                <legend>Your decision</legend>
                {s.options.map((o, i) => (
                  <label
                    key={o}
                    className={`decision-option ${state.selected === i ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      value={i}
                      checked={state.selected === i}
                      onChange={() => dispatch({ type: "SELECT", option: i })}
                    />
                    <span className="radio-visual">
                      {state.selected === i && <span />}
                    </span>
                    <span>{o}</span>
                  </label>
                ))}
              </fieldset>
              {!state.submitted ? (
                <>
                  <button
                    className="button primary submit-decision"
                    disabled={
                      state.selected === null ||
                      (!!s.annotation &&
                        !state.annotations.some(
                          (a) => a.kind === s.annotation?.kind,
                        ))
                    }
                    onClick={() => dispatch({ type: "SUBMIT" })}
                  >
                    Submit & reveal
                    <ArrowRight size={16} />
                  </button>
                  <p className="decision-note">
                    {s.annotation &&
                    !state.annotations.some(
                      (a) => a.kind === s.annotation?.kind,
                    )
                      ? "Add your chart marking, then choose an answer."
                      : "There’s more to learn from a decision than a result."}
                  </p>
                </>
              ) : !feedbackReady ? (
                <div className="reveal-wait" role="status">
                  <span className="reveal-pulse" />
                  <div>
                    <strong>Decision recorded. Watch what unfolds.</strong>
                    <p>
                      {state.playing
                        ? "New candles are being revealed."
                        : "Continue replay to see what happened."}
                    </p>
                    {!state.playing && (
                      <button
                        className="text-button"
                        onClick={() => dispatch({ type: "PLAY" })}
                      >
                        Continue reveal
                        <Play size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className={`assessment-feedback ${result.correct ? "success" : "revisit"}`}
                  role="status"
                >
                  <div className="feedback-heading">
                    {result.correct ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <SproutIcon />
                    )}
                    <h3>
                      {result.correct
                        ? "You’re seeing the idea."
                        : "A useful moment to revisit."}
                    </h3>
                  </div>
                  <div className="lesson-step-label">03 · WHAT HAPPENED</div>
                  <p>{s.outcome}</p>
                  <h4>Why it matters</h4>
                  <p>
                    {result.correct
                      ? s.feedback
                      : !result.annotationCorrect
                        ? "Your chart marking missed the target area. " +
                          s.retry
                        : s.retry}
                  </p>
                  {!result.correct && <p>{s.feedback}</p>}
                  {state.exploration && (
                    <p className="exploration-note">
                      Exploration feedback: this run does not count toward
                      assessed completion.
                    </p>
                  )}
                  <div className="feedback-actions">
                    <button className="button secondary" onClick={restart}>
                      <RotateCcw size={14} />
                      Try again
                    </button>
                    <button
                      className="button primary"
                      onClick={() => setPanel("reflect")}
                    >
                      Reflect
                      <NotebookPen size={14} />
                    </button>
                  </div>
                  <button
                    className="text-button next-lesson"
                    onClick={() => onSwitch(next.id)}
                  >
                    Next: {next.title}
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          ) : panel === "trade" ? (
            <TradingPanel
              key={`${state.instrument}-${state.live.sessionSeed}-${state.initialBalance}`}
              scenario={s}
              state={state}
              dispatch={dispatch}
              showRules={showRules}
              setShowRules={setShowRules}
              onSave={saveSession}
              saved={saved}
            />
          ) : (
            <div className="lesson-content">
              <div className="lesson-step-label">
                <span>04</span> REVIEW & IMPROVE
              </div>
              <h2>Keep the lesson.</h2>
              <p>
                What did the chart show? What changed your mind? A few words now
                can make the next practice more useful.
              </p>
              <JournalForm scenarioId={s.id} onSave={onJournal} />
              <button className="text-button" onClick={onProgress}>
                Open your full journal
                <ArrowUpRight size={15} />
              </button>
            </div>
          )}
        </aside>
      </div>
      <nav
        className="mobile-practice-dock"
        aria-label="Practice workspace shortcuts"
      >
        <button
          onClick={() =>
            document
              .querySelector(".replay-chart-panel")
              ?.scrollIntoView({ block: "start", behavior: "auto" })
          }
        >
          <Target size={17} />
          Chart
        </button>
        <button
          onClick={() => {
            setPanel("lesson");
            document
              .querySelector(".lesson-panel")
              ?.scrollIntoView({ block: "start", behavior: "auto" });
          }}
        >
          <BookOpen size={17} />
          Learn
        </button>
        <button
          onClick={() => {
            setPanel("trade");
            document
              .querySelector(".lesson-panel")
              ?.scrollIntoView({ block: "start", behavior: "auto" });
          }}
        >
          <ArrowUpRight size={17} />
          Trade
        </button>
        <button
          onClick={() => {
            setPanel("reflect");
            document
              .querySelector(".lesson-panel")
              ?.scrollIntoView({ block: "start", behavior: "auto" });
          }}
        >
          <NotebookPen size={17} />
          Reflect
        </button>
      </nav>
    </>
  );
}

function SproutIcon() {
  return <BookOpen size={20} />;
}
function PositionActions({
  state,
  scenario: s,
  dispatch,
  compact = false,
}: {
  state: ReplayState;
  scenario: Scenario;
  dispatch: React.Dispatch<ReplayAction>;
  compact?: boolean;
}) {
  const a = state.account,
    candle = currentCandle(s, state);
  if (!a.positions.length)
    return compact ? null : (
      <div className="position-explainer">
        <Info size={14} />
        <span>
          Open a position below. Once you buy, use{" "}
          <strong>Sell to close</strong> beside it to take your gain or loss.
          Opening a sell is a new position.
        </span>
      </div>
    );
  return (
    <section
      className={`active-positions ${compact ? "compact-positions" : ""}`}
      aria-label={compact ? "Quick position controls" : "Open positions"}
    >
      {!compact && (
        <h3>
          Your open positions <span>{a.positions.length}</span>
        </h3>
      )}
      {a.positions.map((p) => (
        <div className="position-row" key={p.id}>
          <div>
            <strong>
              {p.side === "buy" ? "BUY / LONG" : "SELL / SHORT"} ·{" "}
              {p.units.toLocaleString()}{" "}
              {getInstrument(p.instrument ?? state.instrument).unit}
            </strong>
            <small>
              Entry {formatPrice(p.entry, p.instrument ?? state.instrument)}{" "}
              {!compact && (
                <>
                  · Stop {formatPrice(p.stop, p.instrument ?? state.instrument)}
                </>
              )}
            </small>
            {!compact && (
              <small>
                Target {formatPrice(p.target, p.instrument ?? state.instrument)}
              </small>
            )}
          </div>
          <b
            className={
              profit(
                p,
                exitPrice(p.side, candle.close, executionSpread(s, state)),
              ) < 0
                ? "negative"
                : "positive"
            }
          >
            {usd(
              profit(
                p,
                exitPrice(p.side, candle.close, executionSpread(s, state)),
              ),
            )}
          </b>
          <button
            className="close-position"
            onClick={() => dispatch({ type: "CLOSE", id: p.id })}
          >
            {p.side === "buy" ? "Sell to close" : "Buy to close"}
            <X size={12} />
          </button>
        </div>
      ))}
    </section>
  );
}
function TradingPanel({
  scenario: s,
  state,
  dispatch,
  showRules,
  setShowRules,
  onSave,
  saved,
}: {
  scenario: Scenario;
  state: ReplayState;
  dispatch: React.Dispatch<ReplayAction>;
  showRules: boolean;
  setShowRules: (b: boolean) => void;
  onSave: () => void;
  saved: boolean;
}) {
  const candle = currentCandle(s, state),
    a = state.account;
  const spec = getInstrument(state.instrument),
    spread = executionSpread(s, state);
  const [side, setSide] = useState<Side>("buy");
  const [units, setUnits] = useState(String(spec.defaultUnits));
  const [stop, setStop] = useState(
    formatPrice(candle.close - spec.stopDistance, spec.id),
  );
  const [target, setTarget] = useState(
    formatPrice(candle.close + spec.stopDistance * 2, spec.id),
  );
  const current = quote(candle.close, spread),
    entry = entryPrice(side, candle.close, spread);
  const risk =
    Math.abs(entry - Number(stop)) * Number(units) +
    spec.slippage * Number(units);
  const reward = Math.abs(entry - Number(target)) * Number(units);
  const directionValid =
    side === "buy"
      ? Number(stop) < current.bid && Number(target) > entry
      : Number(stop) > current.ask && Number(target) < entry;
  const estimateValid =
    directionValid &&
    Number(units) > 0 &&
    Number.isFinite(risk) &&
    Number.isFinite(reward) &&
    Number(stop) > 0 &&
    Number(target) > 0;
  const floating = unrealised(a, candle.close, spread, spec.id);
  function changeSide(next: Side) {
    setSide(next);
    setStop(
      formatPrice(
        candle.close +
          (next === "buy" ? -spec.stopDistance : spec.stopDistance),
        spec.id,
      ),
    );
    setTarget(
      formatPrice(
        candle.close +
          (next === "buy" ? 2 * spec.stopDistance : -2 * spec.stopDistance),
        spec.id,
      ),
    );
    dispatch({ type: "ERROR", error: null });
  }
  return (
    <div className="lesson-content trading-content">
      <div className="lesson-step-label">
        <span>02</span> PLAN BEFORE YOU PRACTISE
      </div>
      <h2>A place to test your process.</h2>
      <p>
        Fictional USD. Synthetic {spec.name}.{" "}
        {spec.group === "Metals"
          ? "One unit is one troy ounce; these are base units, not broker lots."
          : `One unit is one ${spec.unit}.`}{" "}
        Full notional is reserved, with no leverage.
      </p>
      <div className="account-values">
        <div>
          <span>Balance</span>
          <strong>{usd(a.balance)}</strong>
        </div>
        <div>
          <span>Equity</span>
          <strong>{usd(a.balance + floating)}</strong>
        </div>
        <div>
          <span>Realised P&L</span>
          <strong
            className={a.balance - state.initialBalance < 0 ? "negative" : ""}
          >
            {usd(a.balance - state.initialBalance)}
          </strong>
        </div>
        <div>
          <span>Unrealised P&L</span>
          <strong className={floating < 0 ? "negative" : ""}>
            {usd(floating)}
          </strong>
        </div>
      </div>
      <PositionActions state={state} scenario={s} dispatch={dispatch} />
      <div className="quote-strip">
        <span>
          SELL / BID <strong>{formatPrice(current.bid, spec.id)}</strong>
        </span>
        <small>{spreadDescription(spec.id, spread)}</small>
        <span>
          BUY / ASK <strong>{formatPrice(current.ask, spec.id)}</strong>
        </span>
      </div>
      <div className="side-toggle" role="group" aria-label="Trade direction">
        <button
          className={side === "buy" ? "selected buy" : ""}
          onClick={() => changeSide("buy")}
        >
          Open buy <ArrowUpRight size={16} />
        </button>
        <button
          className={side === "sell" ? "selected sell" : ""}
          onClick={() => changeSide("sell")}
        >
          Open sell <ArrowUpRight size={16} className="sell-arrow" />
        </button>
      </div>
      <form
        className="order-form"
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({
            type: "ORDER",
            order: {
              side,
              units: Number(units),
              stop: Number(stop),
              target: Number(target),
            },
          });
        }}
      >
        <label>
          Position size <span>{spec.quantityLabel}</span>
          <input
            type="number"
            min={spec.minUnits}
            max="1000000"
            step={spec.quantityStep}
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            required
          />
        </label>
        <div className="order-price-fields">
          <label>
            Stop-loss
            <input
              type="number"
              step={spec.priceStep}
              min={spec.priceStep}
              value={stop}
              onChange={(e) => setStop(e.target.value)}
              required
            />
          </label>
          <label>
            Take-profit
            <input
              type="number"
              step={spec.priceStep}
              min={spec.priceStep}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="risk-estimate">
          <div>
            <span>Estimated stop risk</span>
            <strong>
              {estimateValid
                ? `${usd(risk)} · ${((risk / a.balance) * 100).toFixed(2)}%`
                : "Check price directions"}
            </strong>
          </div>
          <div>
            <span>Reward / risk</span>
            <strong>
              {estimateValid && risk > 0
                ? `${(reward / risk).toFixed(2)} : 1`
                : "—"}
            </strong>
          </div>
          <div>
            <span>Available funds</span>
            <strong>
              {usd(availableFunds(a, candle.close, spread, spec.id))}
            </strong>
          </div>
          <div>
            <span>Reserved notional</span>
            <strong>{usd(reserved(a))}</strong>
          </div>
        </div>
        {estimateValid && risk > a.balance * 0.02 && (
          <p className="risk-warning">
            <Info size={16} />
            This plan risks more than 2% of the fictional balance. Consider how
            repeated losses could affect the account.
          </p>
        )}
        {state.error && (
          <p className="order-error" role="alert">
            {state.error}
          </p>
        )}
        <button
          className={`button primary place-order ${side === "sell" ? "sell-button" : ""}`}
          type="submit"
        >
          {a.positions.length
            ? `Add another ${side}`
            : `Place simulated ${side}`}
          <ArrowRight size={16} />
        </button>
      </form>
      <p className="decision-note">
        Market orders fill at the current {side === "buy" ? "ask" : "bid"}. Stop
        estimates include {slippageDescription(spec.id)} adverse slippage. Gaps
        can increase losses.
      </p>
      <button
        className="text-button execution-toggle"
        onClick={() => setShowRules(!showRules)}
      >
        <ShieldCheck size={15} />
        Execution assumptions
        <ChevronDown size={14} />
      </button>
      {showRules && (
        <div className="execution-rules">
          <p>
            Chart candles are mid-prices. Buys open at ask and close at bid;
            sells do the reverse. Spread is fixed at{" "}
            {spreadDescription(spec.id, spread)} here. Stop triggers use
            executable quotes, with {slippageDescription(spec.id)} adverse
            slippage. A gap through a stop fills at the worse opening quote plus
            slippage.
          </p>
          <p>
            If stop and target both occur in one candle and neither is reached
            at its open, the stop is processed first. Candle data cannot
            establish the true intrabar order. Targets receive their target
            price, without favourable gap improvement. No commission, interest,
            leverage, margin calls or real exchange execution is modelled. Both
            directions reserve full USD notional as a simplified cash-backed
            exercise.
          </p>
        </div>
      )}
      <div className="positions-section">
        <h3>
          Closed trades <span>{a.trades.length}</span>
        </h3>
        {a.trades.length ? (
          a.trades
            .slice()
            .reverse()
            .map((t) => (
              <details className="trade-detail" key={t.id}>
                <summary>
                  <span>
                    {t.side.toUpperCase()} · {t.units.toLocaleString()}{" "}
                    {getInstrument(t.instrument ?? state.instrument).unit} ·{" "}
                    {t.instrument ?? state.instrument}
                  </span>
                  <b className={t.pnl < 0 ? "negative" : "positive"}>
                    {usd(t.pnl)}
                  </b>
                  <ChevronDown size={13} />
                </summary>
                <p>
                  Entry {formatPrice(t.entry, t.instrument ?? state.instrument)}{" "}
                  → Exit {formatPrice(t.exit, t.instrument ?? state.instrument)}
                  <br />
                  {t.reason} · Planned risk {usd(t.initialRisk)}
                  <br />
                  Closed at{" "}
                  {new Date(t.closedAt * 1000).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "UTC",
                  })}{" "}
                  UTC
                </p>
              </details>
            ))
        ) : (
          <p className="muted-empty">
            Trade history appears when a position closes. Values are calculated
            from simulated fills.
          </p>
        )}
      </div>
      <button
        className="button secondary save-session"
        onClick={onSave}
        disabled={saved}
      >
        {saved ? <Check size={16} /> : <Save size={16} />}{" "}
        {saved ? "Session saved" : "Close positions & save session"}
      </button>
      <p className="decision-note">
        Saving pauses the market, closes any open positions at the current
        quote, then records the session locally. A restarted replay is a new
        session.
      </p>
    </div>
  );
}
