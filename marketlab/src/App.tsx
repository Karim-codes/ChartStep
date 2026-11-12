import { BrandMark } from "./components/Brand";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Layers3,
  Library,
  Play,
  CandlestickChart,
  NotebookPen,
  CircleHelp,
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Menu,
  Settings2,
  ShieldCheck,
  Clock3,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Download,
  GraduationCap,
  Mail,
  Target,
  Compass,
  Sprout,
  Moon,
  Sun,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  scenarios,
  pathways,
  categories,
  findScenario,
  roadmap,
} from "./content/scenarios";
import { visibleCandles } from "./engine/replay";
import { getInstrument, formatPrice } from "./engine/instruments";
import type {
  Category,
  Progress,
  Scenario,
  SavedSession,
  Attempt,
  JournalEntry,
} from "./engine/types";
import { brand, glossary, pricing } from "./lib/config";
import { emptyProgress, readProgress, writeProgress } from "./lib/storage";
import Chart from "./components/Chart";
import MiniChart from "./components/MiniChart";
import { ThemeContext } from "./lib/theme";
import { clearPractice } from "./lib/practice-storage";
const Workspace = lazy(() => import("./components/Workspace"));
const LandingPage = lazy(() => import("@/components/ui/hero-01"));

type Page =
  | "home"
  | "learn"
  | "pathways"
  | "library"
  | "replay"
  | "trading"
  | "progress"
  | "pricing";
type Modal = "glossary" | "settings" | "help" | null;
const navigation: {
  id: Page;
  label: string;
  icon: LucideIcon;
  group: string;
}[] = [
  {
    id: "learn",
    label: "My learning",
    icon: BookOpen,
    group: "LEARN & EXPLORE",
  },
  {
    id: "pathways",
    label: "Learning pathways",
    icon: Layers3,
    group: "LEARN & EXPLORE",
  },
  {
    id: "library",
    label: "Scenario library",
    icon: Library,
    group: "LEARN & EXPLORE",
  },
  {
    id: "replay",
    label: "Market replay",
    icon: Play,
    group: "PUT IT INTO PRACTICE",
  },
  {
    id: "trading",
    label: "Virtual trading",
    icon: CandlestickChart,
    group: "PUT IT INTO PRACTICE",
  },
  {
    id: "progress",
    label: "Progress & journal",
    icon: NotebookPen,
    group: "YOUR SPACE",
  },
  {
    id: "pricing",
    label: "Plans & pricing",
    icon: Sparkles,
    group: "YOUR SPACE",
  },
];
const pageFromHash = (): Page => {
  const p = location.hash.slice(1).split("?")[0];
  return navigation.some((n) => n.id === p) ? (p as Page) : "home";
};
const formatDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );

export default function App() {
  const [page, setPage] = useState<Page>(pageFromHash);
  const [progress, setProgress] = useState<Progress>(readProgress);
  const [scenarioId, setScenarioId] = useState(
    () => readProgress().lastScenarioId,
  );
  const [query, setQuery] = useState("");
  const [pathFilter, setPathFilter] = useState<string>("all");
  const [modal, setModal] = useState<Modal>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  const [toast, setToast] = useState("");
  useEffect(() => {
    const h = () => {
      setPage(pageFromHash());
      setMobileOpen(false);
      window.scrollTo(0, 0);
    };
    addEventListener("hashchange", h);
    return () => removeEventListener("hashchange", h);
  }, []);
  useEffect(() => {
    setStorageOk(writeProgress(progress));
  }, [progress]);
  useEffect(() => {
    document.documentElement.dataset.theme = progress.theme;
    document.documentElement.style.colorScheme = progress.theme;
  }, [progress.theme]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!modal && !mobileOpen) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModal(null);
        setMobileOpen(false);
      }
    };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, [modal, mobileOpen]);
  function navigate(p: Page) {
    setPage(p);
    location.hash = p;
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }
  function start(s: Scenario, trade = false) {
    setScenarioId(s.id);
    setProgress((p) => ({ ...p, lastScenarioId: s.id }));
    navigate(trade ? "trading" : "replay");
  }
  function onAttempt(attempt: Attempt) {
    setProgress((p) => ({
      ...p,
      attempts: [...p.attempts, attempt],
      completed:
        attempt.correct && !attempt.exploration
          ? [...new Set([...p.completed, attempt.scenarioId])]
          : p.completed,
    }));
  }
  function onSession(session: SavedSession) {
    setProgress((p) => ({
      ...p,
      sessions: [...p.sessions.filter((s) => s.id !== session.id), session],
    }));
    setToast("Practice session saved to your journal.");
  }
  function saveEntry(entry: JournalEntry) {
    setProgress((p) => ({ ...p, journal: [entry, ...p.journal] }));
    setToast("Reflection saved on this device.");
  }
  const recommended =
    scenarios.find((s) => !progress.completed.includes(s.id)) ?? scenarios[0];
  const current = findScenario(scenarioId);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        e.target instanceof HTMLElement &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)
      ) {
        e.preventDefault();
        navigate("library");
        setTimeout(
          () => document.getElementById("scenario-search")?.focus(),
          80,
        );
      }
    };
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, []);
  const goLibrary = (filter = "all") => {
    setPathFilter(filter);
    setQuery("");
    navigate("library");
  };
  if (page === "home")
    return (
      <ThemeContext.Provider value={progress.theme}>
        <Suspense
          fallback={
            <div className="landing-loading" aria-label="Opening ChartStep" />
          }
        >
          <LandingPage
            onEnter={() => navigate("trading")}
            onWorkspace={() => navigate("learn")}
            onLesson={() => start(scenarios[0])}
            onPathway={goLibrary}
            onOpenJournal={() => navigate("progress")}
            theme={progress.theme}
            onToggleTheme={() =>
              setProgress((p) => ({
                ...p,
                theme: p.theme === "light" ? "dark" : "light",
              }))
            }
            onSaveReflection={(entry) => {
              const next = {
                ...progress,
                journal: [entry, ...progress.journal],
              };
              if (!writeProgress(next)) return false;
              setProgress(next);
              return true;
            }}
          />
        </Suspense>
      </ThemeContext.Provider>
    );
  return (
    <ThemeContext.Provider value={progress.theme}>
      <div
        className={`app-shell workspace-design ${progress.academyTheme ? "academy-theme" : ""}`}
      >
        <a
          className="skip-link"
          href="#main-content"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("main-content")?.focus();
          }}
        >
          Skip to content
        </a>
        {mobileOpen && (
          <button
            className="mobile-backdrop"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
          <button
            className="brand"
            onClick={() => navigate("home")}
            aria-label={`${brand.name} home`}
          >
            <span className="brand-symbol">
              <BrandMark />
            </span>
            <span>
              {progress.academyTheme ? brand.academy.name : brand.name}
              <small>
                {progress.academyTheme ? "Powered by ChartStep" : brand.tagline}
              </small>
            </span>
          </button>
          <div className="workspace-select">
            <span className="workspace-icon">
              <GraduationCap size={19} />
            </span>
            <div>
              Your learning space<small>Personal workspace</small>
            </div>
            <span className="tiny-badge">DEMO</span>
          </div>
          <nav aria-label="Main navigation">
            {navigation.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.id}>
                  {(i === 0 || navigation[i - 1].group !== item.group) && (
                    <p className="nav-group">{item.group}</p>
                  )}
                  <button
                    className={`nav-item ${page === item.id ? "active" : ""}`}
                    onClick={() => navigate(item.id)}
                    aria-current={page === item.id ? "page" : undefined}
                  >
                    <Icon size={19} strokeWidth={1.7} />
                    <span>{item.label}</span>
                    {item.id === "library" && (
                      <span className="nav-count">27</span>
                    )}
                    {page === item.id && <span className="active-dot" />}
                  </button>
                </div>
              );
            })}
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-note">
              <Sprout size={21} />
              <strong>Progress over predictions.</strong>
              <p>Build understanding, one thoughtful decision at a time.</p>
            </div>
            <button className="support-link" onClick={() => setModal("help")}>
              <CircleHelp size={18} /> A little help <ArrowUpRight size={15} />
            </button>
            <div className="user-row">
              <span className="avatar">Y</span>
              <div>
                Your workspace<small>Saved on this device</small>
              </div>
              <button
                className="icon-button"
                aria-label="Workspace settings"
                onClick={() => setModal("settings")}
              >
                <Settings2 size={17} />
              </button>
            </div>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <div className="breadcrumb">
              <button
                className="icon-button mobile-menu"
                aria-label="Open navigation"
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={21} />
              </button>
              <span className="desktop-breadcrumb">Workspace</span>
              <ChevronRight size={14} className="desktop-breadcrumb" />
              <strong>{navigation.find((n) => n.id === page)?.label}</strong>
            </div>
            <div className="topbar-actions">
              <button
                className="global-search"
                onClick={() => {
                  navigate("library");
                  setTimeout(
                    () => document.getElementById("scenario-search")?.focus(),
                    50,
                  );
                }}
              >
                <Search size={16} />
                <span>Find your next lesson</span>
                <kbd>/</kbd>
              </button>
              <button
                className="glossary-button"
                onClick={() => setModal("glossary")}
              >
                <BookOpen size={16} />
                <span>Trading glossary</span>
              </button>
              <button
                className="icon-button theme-toggle"
                aria-label={
                  progress.theme === "light"
                    ? "Switch to dark mode"
                    : "Switch to light mode"
                }
                onClick={() =>
                  setProgress((p) => ({
                    ...p,
                    theme: p.theme === "light" ? "dark" : "light",
                  }))
                }
              >
                {progress.theme === "light" ? (
                  <Moon size={17} />
                ) : (
                  <Sun size={17} />
                )}
              </button>
              <span className="topbar-divider" />
              <span className="demo-status">
                <i /> Demo mode
              </span>
            </div>
          </header>
          {!storageOk && (
            <div className="storage-warning" role="status">
              Browser storage is unavailable. You can practise, but progress
              will not survive a reload. Export your progress before leaving.
            </div>
          )}
          <main
            id="main-content"
            tabIndex={-1}
            className={`page-content ${page === "replay" || page === "trading" ? "workspace-page" : ""}`}
          >
            {page === "learn" && (
              <>
                <div className="page-heading home-heading">
                  <div>
                    <div className="eyebrow">
                      <span /> YOUR LEARNING SPACE
                    </div>
                    <h1>Make sense of the market.</h1>
                    <p>
                      Less watching. More understanding. Your next step starts
                      here.
                    </p>
                  </div>
                  <div className="learning-pace">
                    <Compass size={17} />
                    <span>Your pace. Your progress.</span>
                  </div>
                </div>
                <div className="home-top-grid">
                  <section className="lesson-hero">
                    <div className="hero-copy">
                      <div className="chapter-pill">
                        <span />{" "}
                        {progress.completed.length
                          ? "KEEP THE MOMENTUM"
                          : "A GOOD PLACE TO BEGIN"}
                      </div>
                      <p className="lesson-kicker">
                        {recommended.category.toUpperCase()}
                      </p>
                      <h2>
                        {progress.completed.length ? (
                          recommended.title
                        ) : (
                          <>
                            Every candle
                            <br />
                            tells a story.
                          </>
                        )}
                      </h2>
                      <p>
                        {progress.completed.length
                          ? recommended.description
                          : "Learn to read what price is doing, before deciding what to do next."}
                      </p>
                      <div className="hero-meta">
                        <Clock3 size={14} />
                        {recommended.duration} min<span>·</span>
                        <span>{recommended.difficulty}</span>
                      </div>
                      <button
                        className="button primary"
                        onClick={() => start(recommended)}
                      >
                        {progress.completed.length
                          ? "Continue learning"
                          : "Start your first lesson"}
                        <ArrowRight size={17} />
                      </button>
                    </div>
                    <div className="hero-chart">
                      <div className="hero-chart-label">
                        <span>LEARN TO SEE THE STORY</span>
                        <span className="live-dot" />
                      </div>
                      <Chart
                        compact
                        candles={visibleCandles(
                          findScenario("candle-body"),
                          37,
                        )}
                      />
                      <div className="chart-learning-note">
                        <span className="small-spark">
                          <Sparkles size={15} />
                        </span>
                        Real interaction. Room to make mistakes.
                      </div>
                    </div>
                  </section>
                  <section className="journey-panel">
                    <div className="section-eyebrow">THE CHARTSTEP METHOD</div>
                    <h3>
                      One idea.
                      <br />A little more clarity.
                    </h3>
                    <div className="journey-steps">
                      {[
                        ["Learn", "Get to know a concept"],
                        ["Observe", "See it on a real chart"],
                        ["Practise", "Make your own decision"],
                        ["Reflect", "Understand what happened"],
                      ].map(([label, text], i) => (
                        <div
                          className={`journey-step ${i === 0 ? "current" : ""}`}
                          key={label}
                        >
                          <span>
                            {i === 0 ? (
                              <BookOpen size={14} />
                            ) : (
                              String(i + 1).padStart(2, "0")
                            )}
                          </span>
                          <div>
                            <strong>{label}</strong>
                            <small>{text}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p>
                      Understanding is the goal.
                      <br />
                      Fictional profit is not the score.
                    </p>
                  </section>
                </div>
                <section className="pathways-section">
                  <div className="section-heading">
                    <div>
                      <h2>Build your understanding</h2>
                      <p>
                        A clear path from “what am I looking at?” to “I know
                        why.”
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => navigate("pathways")}
                    >
                      View all pathways
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                  <div className="pathway-grid">
                    {pathways.map((path, i) => {
                      const lessons = scenarios.filter((s) =>
                        path.categories.includes(s.category),
                      );
                      const done = lessons.filter((s) =>
                        progress.completed.includes(s.id),
                      ).length;
                      return (
                        <button
                          className={`pathway-card ${path.color}`}
                          key={path.id}
                          onClick={() => goLibrary(path.id)}
                        >
                          <div className="pathway-visual">
                            <span className="pathway-number">0{i + 1}</span>
                            <MiniChart
                              variant={
                                path.icon as "candles" | "structure" | "risk"
                              }
                            />
                            <span className="pathway-badge">
                              {i === 0
                                ? "Start here"
                                : i === 1
                                  ? "Explore price"
                                  : "Build good habits"}
                            </span>
                          </div>
                          <div className="pathway-copy">
                            <div className="section-eyebrow">{path.label}</div>
                            <h3>{path.title}</h3>
                            <p>{path.description}</p>
                            <div className="pathway-meta">
                              <span>{lessons.length} lessons</span>
                              <span>
                                {i === 0
                                  ? "Beginner"
                                  : "Beginner → intermediate"}
                              </span>
                            </div>
                            <div className="progress-track">
                              <span
                                style={{
                                  width: `${(done / lessons.length) * 100}%`,
                                }}
                              />
                            </div>
                            <div className="pathway-footer">
                              <span>
                                {done} of {lessons.length} completed
                              </span>
                              <span className="circle-arrow">
                                <ArrowUpRight size={17} />
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
                <div className="home-bottom-grid">
                  <section className="practice-banner">
                    <div className="feature-icon">
                      <Play size={23} />
                    </div>
                    <div>
                      <span className="section-eyebrow">
                        LEARNING MEETS DOING
                      </span>
                      <h3>Take the chart one candle at a time.</h3>
                      <p>Pause, mark a level, test an idea. There’s no rush.</p>
                    </div>
                    <button
                      className="button secondary"
                      onClick={() => start(findScenario("higher-highs"))}
                    >
                      Open market replay
                      <ArrowUpRight size={16} />
                    </button>
                  </section>
                  <button
                    className="journal-prompt"
                    onClick={() => navigate("progress")}
                  >
                    <NotebookPen size={22} />
                    <div>
                      <strong>Make a note. Make it stick.</strong>
                      <p>Your reflections belong in your journal.</p>
                    </div>
                    <ArrowUpRight size={19} />
                  </button>
                </div>
                <div className="home-progress">
                  <span>
                    <span className="progress-circle">
                      <Check size={14} />
                    </span>
                    <b>{progress.completed.length}</b> of {scenarios.length}{" "}
                    lessons completed
                  </span>
                  <span>Your progress is saved on this device.</span>
                  <button
                    className="text-button"
                    onClick={() => navigate("progress")}
                  >
                    View your progress
                    <ChevronRight size={15} />
                  </button>
                </div>
              </>
            )}
            {page === "pathways" && (
              <>
                <PageHeading
                  eyebrow="A LITTLE STRUCTURE GOES A LONG WAY"
                  title="Find your learning path."
                  description="Start at the beginning or focus on a concept you want to understand better."
                />
                <div className="pathway-detail-list">
                  {pathways.map((path, i) => {
                    const list = scenarios.filter((s) =>
                      path.categories.includes(s.category),
                    );
                    return (
                      <section
                        className={`pathway-detail ${path.color}`}
                        key={path.id}
                      >
                        <div className="pathway-detail-intro">
                          <span className="outline-index">0{i + 1}</span>
                          <MiniChart
                            variant={
                              path.icon as "candles" | "structure" | "risk"
                            }
                          />
                          <span className="section-eyebrow">{path.label}</span>
                          <h2>{path.title}</h2>
                          <p>{path.description}</p>
                          <button
                            className="button primary"
                            onClick={() =>
                              start(
                                list.find(
                                  (s) => !progress.completed.includes(s.id),
                                ) ?? list[0],
                              )
                            }
                          >
                            Start pathway
                            <ArrowRight size={16} />
                          </button>
                        </div>
                        <div className="pathway-lessons">
                          {list.map((s, j) => (
                            <button key={s.id} onClick={() => start(s)}>
                              <span
                                className={`lesson-index ${progress.completed.includes(s.id) ? "done" : ""}`}
                              >
                                {progress.completed.includes(s.id) ? (
                                  <Check size={16} />
                                ) : (
                                  String(j + 1).padStart(2, "0")
                                )}
                              </span>
                              <div>
                                <strong>{s.title}</strong>
                                <small>
                                  {s.type} · {s.duration} min
                                </small>
                              </div>
                              <ChevronRight size={16} />
                            </button>
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </>
            )}
            {page === "library" && (
              <LibraryPage
                query={query}
                setQuery={setQuery}
                pathFilter={pathFilter}
                setPathFilter={setPathFilter}
                completed={progress.completed}
                start={start}
              />
            )}
            {(page === "replay" || page === "trading") && (
              <Suspense
                fallback={
                  <p className="loading">Opening your practice space…</p>
                }
              >
                <Workspace
                  key={`${current.id}-${page}`}
                  scenario={current}
                  trading={page === "trading"}
                  initialBalance={progress.practiceBalance}
                  onBalanceChange={(balance) =>
                    setProgress((p) => ({ ...p, practiceBalance: balance }))
                  }
                  onSwitch={(id) => start(findScenario(id))}
                  onAttempt={onAttempt}
                  onSession={onSession}
                  onJournal={saveEntry}
                  completed={progress.completed}
                  onGlossary={() => setModal("glossary")}
                  onLibrary={() => goLibrary()}
                  onProgress={() => navigate("progress")}
                />
              </Suspense>
            )}
            {page === "progress" && (
              <ProgressPage
                progress={progress}
                start={start}
                saveEntry={saveEntry}
                onExport={() => {
                  const blob = new Blob([JSON.stringify(progress, null, 2)], {
                    type: "application/json",
                  });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = "chartstep-learning-export.json";
                  a.click();
                  URL.revokeObjectURL(a.href);
                  setToast("Progress exported.");
                }}
              />
            )}
            {page === "pricing" && (
              <>
                <PageHeading
                  eyebrow="A SMALL BEGINNING. ROOM TO GROW."
                  title="A plan for every learning journey."
                  description="Explore everything in this prototype for free. These are possible future plans, not an offer to purchase."
                />
                <div className="pricing-note">
                  <ShieldCheck size={18} />
                  <span>
                    No account. No card. No payments. All 27 scenarios and
                    simulator features are open in this demo.
                  </span>
                </div>
                <div className="pricing-grid">
                  {pricing.map((plan, i) => (
                    <section
                      className={`pricing-card ${i === 1 ? "featured" : ""}`}
                      key={plan.name}
                    >
                      <div className="pricing-top">
                        <h2>{plan.name}</h2>
                        <span
                          className={`pill ${plan.planned ? "neutral" : "green"}`}
                        >
                          {plan.label}
                        </span>
                      </div>
                      <p>{plan.description}</p>
                      <div className="plan-price">
                        {plan.price}
                        <small>{plan.period}</small>
                      </div>
                      <ul>
                        {plan.features.map((f) => (
                          <li key={f}>
                            <Check size={17} />
                            {f}
                          </li>
                        ))}
                      </ul>
                      {plan.planned ? (
                        <a
                          className={`button ${i === 1 ? "primary" : "secondary"}`}
                          href={`mailto:${brand.contactEmail}?subject=${encodeURIComponent("ChartStep: " + plan.name + " enquiry")}`}
                        >
                          {plan.action}
                          <Mail size={16} />
                        </a>
                      ) : (
                        <button
                          className="button secondary"
                          onClick={() => navigate("learn")}
                        >
                          {plan.action}
                          <ArrowRight size={16} />
                        </button>
                      )}
                    </section>
                  ))}
                </div>
                <div className="pricing-fineprint">
                  <h3>Built with educators in mind.</h3>
                  <p>
                    Academy branding, assignments, student management and mentor
                    feedback are future features. Prices are exploratory and may
                    change. Enquiry links open your email application; ChartStep
                    does not collect or store an email address.
                  </p>
                  <button
                    className="text-button"
                    onClick={() => setModal("settings")}
                  >
                    Preview an academy theme
                    <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
            <footer className="app-footer">
              <span>
                <span className="footer-mark">
                  <BrandMark />
                </span>{" "}
                A {brand.owner} learning project
              </span>
              <p>
                Educational simulation only. Fictional funds, synthetic prices.
                Results do not predict future performance.
              </p>
              <button onClick={() => setModal("help")}>
                About this demo
                <ArrowUpRight size={13} />
              </button>
            </footer>
          </main>
        </div>
        {modal && (
          <ModalDialog
            title={
              modal === "glossary"
                ? "A little less jargon."
                : modal === "settings"
                  ? "Your learning space."
                  : "Welcome to ChartStep."
            }
            close={() => setModal(null)}
          >
            {modal === "glossary" ? (
              <>
                <p className="modal-intro">
                  Plain-language explanations, whenever you need them.
                </p>
                <div className="glossary-list">
                  {Object.entries(glossary).map(([term, definition]) => (
                    <details key={term}>
                      <summary>
                        {term}
                        <ChevronDown size={16} />
                      </summary>
                      <p>{definition}</p>
                    </details>
                  ))}
                </div>
              </>
            ) : modal === "settings" ? (
              <>
                <p className="modal-intro">
                  Your progress and reflections live in this browser. Clearing
                  browser data removes them. No account or cloud backup is
                  connected.
                </p>
                <div className="setting-row appearance-setting">
                  <div>
                    <strong>Appearance</strong>
                    <p>Choose a comfortable view for your whole workspace.</p>
                  </div>
                  <div className="appearance-choices">
                    <button
                      className={progress.theme === "light" ? "selected" : ""}
                      onClick={() =>
                        setProgress((p) => ({ ...p, theme: "light" }))
                      }
                    >
                      <Sun size={15} />
                      Light
                    </button>
                    <button
                      className={progress.theme === "dark" ? "selected" : ""}
                      onClick={() =>
                        setProgress((p) => ({ ...p, theme: "dark" }))
                      }
                    >
                      <Moon size={15} />
                      Dark
                    </button>
                  </div>
                </div>
                <div className="setting-row">
                  <div>
                    <strong>Academy theme preview</strong>
                    <p>
                      See a fictional partner identity. No real academy branding
                      is used.
                    </p>
                  </div>
                  <button
                    className={`switch ${progress.academyTheme ? "on" : ""}`}
                    role="switch"
                    aria-checked={progress.academyTheme}
                    aria-label="Academy theme preview"
                    onClick={() =>
                      setProgress((p) => ({
                        ...p,
                        academyTheme: !p.academyTheme,
                      }))
                    }
                  >
                    <span />
                  </button>
                </div>
                <div className="reset-area">
                  <strong>A fresh start</strong>
                  <p>
                    Reset lessons, attempts, saved sessions and journal entries
                    on this device.
                  </p>
                  <ResetButton
                    reset={() => {
                      clearPractice();
                      setProgress(emptyProgress());
                      setScenarioId("candle-body");
                      setModal(null);
                      navigate("learn");
                      setToast(
                        "Demo progress reset. Your next chapter is ready.",
                      );
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="modal-intro">
                  Understand the market through short lessons, interactive
                  charts and thoughtful decisions. Start with Learn, observe the
                  chart, submit your decision, then reveal and review.
                </p>
                <div className="help-flow">
                  {[
                    [
                      "01",
                      "Choose a concept",
                      "Open a beginner lesson or browse 27 synthetic scenarios.",
                    ],
                    [
                      "02",
                      "Make a decision",
                      "Read the explanation, inspect the chart and mark or answer.",
                    ],
                    [
                      "03",
                      "See what happens",
                      "Reveal candles. Feedback explains the evidence and uncertainty.",
                    ],
                    [
                      "04",
                      "Keep what you learn",
                      "Practise with fictional funds and save a reflection.",
                    ],
                  ].map(([n, title, text]) => (
                    <div key={n}>
                      <span>{n}</span>
                      <div>
                        <h3>{title}</h3>
                        <p>{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="notice-box">
                  <ShieldCheck size={20} />
                  <p>
                    ChartStep is an educational prototype, not a broker or
                    financial adviser. All trades and funds are fictional.
                    Synthetic data is not a live market feed. Trading and
                    leveraged products involve significant risk. This demo uses
                    no leverage.
                  </p>
                </div>
                <button
                  className="button primary"
                  onClick={() => {
                    setModal(null);
                    start(scenarios[0]);
                  }}
                >
                  Try the first lesson
                  <ArrowRight size={16} />
                </button>
              </>
            )}
          </ModalDialog>
        )}
        {toast && (
          <div className="toast" role="status">
            <CheckCircle2 size={18} />
            {toast}
            <button
              className="icon-button"
              aria-label="Dismiss notification"
              onClick={() => setToast("")}
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>
    </ThemeContext.Provider>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <div className="eyebrow">
        <span />
        {eyebrow}
      </div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

function LibraryPage({
  query,
  setQuery,
  pathFilter,
  setPathFilter,
  completed,
  start,
}: {
  query: string;
  setQuery: (s: string) => void;
  pathFilter: string;
  setPathFilter: (s: string) => void;
  completed: string[];
  start: (s: Scenario) => void;
}) {
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [type, setType] = useState("all");
  const [duration, setDuration] = useState("all");
  const [objective, setObjective] = useState("all");
  const [view, setView] = useState<"playable" | "roadmap">("playable");
  const path = pathways.find((p) => p.id === pathFilter);
  const filtered = scenarios.filter(
    (s) =>
      (!path || path.categories.includes(s.category)) &&
      (category === "all" || s.category === category) &&
      (difficulty === "all" || s.difficulty === difficulty) &&
      (type === "all" || s.type === type) &&
      (duration === "all" ||
        (duration === "short" ? s.duration <= 6 : s.duration > 6)) &&
      (objective === "all" || s.objective === objective) &&
      `${s.title} ${s.description} ${s.category} ${s.objective}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  function clear() {
    setQuery("");
    setPathFilter("all");
    setCategory("all");
    setDifficulty("all");
    setType("all");
    setDuration("all");
    setObjective("all");
  }
  return (
    <>
      <PageHeading
        eyebrow="A LAB FOR YOUR CURIOSITY"
        title="Small scenarios. Real understanding."
        description="Choose something to explore. Every scenario is synthetic, replayable and designed around one clear idea."
      />
      <div className="library-tabs">
        <button
          className={view === "playable" ? "active" : ""}
          onClick={() => setView("playable")}
        >
          Ready to explore <span>27</span>
        </button>
        <button
          className={view === "roadmap" ? "active" : ""}
          onClick={() => setView("roadmap")}
        >
          Curriculum roadmap
          <ArrowUpRight size={14} />
        </button>
      </div>
      {view === "roadmap" ? (
        <>
          <div className="roadmap-intro">
            <Compass size={22} />
            <div>
              <h3>A curriculum that can grow with you.</h3>
              <p>
                These are planned topics, not playable lessons. They extend the
                27 authored scenarios available today.
              </p>
            </div>
          </div>
          <div className="roadmap-grid">
            {roadmap.map(([cat, desc]) => (
              <article key={cat}>
                <span className="pill neutral">Planned</span>
                <h3>{cat}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="library-controls">
            <div className="library-search">
              <Search size={18} />
              <input
                id="scenario-search"
                type="search"
                placeholder="A concept, a question, a new perspective…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search scenarios"
              />
            </div>
            <div className="filter-row">
              <Filter
                label="Pathway"
                value={pathFilter}
                set={setPathFilter}
                options={pathways.map((p) => ({ value: p.id, label: p.title }))}
              />
              <Filter
                label="Concept"
                value={category}
                set={setCategory}
                options={categories}
              />
              <Filter
                label="Difficulty"
                value={difficulty}
                set={setDifficulty}
                options={["Beginner", "Intermediate"]}
              />
              <Filter
                label="Exercise type"
                value={type}
                set={setType}
                options={[
                  "Guided lesson",
                  "Decision challenge",
                  "Chart exercise",
                ]}
              />
              <Filter
                label="Duration"
                value={duration}
                set={setDuration}
                options={[
                  { value: "short", label: "Up to 6 minutes" },
                  { value: "long", label: "7–9 minutes" },
                ]}
              />
              <Filter
                label="Objective"
                value={objective}
                set={setObjective}
                options={[...new Set(scenarios.map((s) => s.objective))]}
              />
              <label className="filter-select">
                <span>Instrument</span>
                <select aria-label="Instrument">
                  <option>EUR/USD</option>
                </select>
              </label>
            </div>
          </div>
          <div className="result-count">
            <span>
              {filtered.length} scenario{filtered.length !== 1 ? "s" : ""} to
              explore{" "}
              {path && (
                <>
                  in <strong>{path.title}</strong>
                </>
              )}
            </span>
            <button className="text-button" onClick={clear}>
              Reset filters
              <RotateCcw size={13} />
            </button>
          </div>
          {filtered.length ? (
            <div className="scenario-grid">
              {filtered.map((s) => (
                <button
                  className="scenario-card"
                  key={s.id}
                  onClick={() => start(s)}
                >
                  <div className="scenario-card-top">
                    <span
                      className={`concept-icon ${pathways.find((p) => p.categories.includes(s.category))?.color}`}
                    >
                      <ConceptIcon category={s.category} />
                    </span>
                    <span
                      className={`pill ${completed.includes(s.id) ? "green" : "neutral"}`}
                    >
                      {completed.includes(s.id) ? (
                        <>
                          <Check size={12} />
                          Completed
                        </>
                      ) : (
                        s.difficulty
                      )}
                    </span>
                  </div>
                  <span className="section-eyebrow">
                    {s.category.toUpperCase()}
                  </span>
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                  <div className="scenario-tags">
                    <span>{s.type}</span>
                    <span>
                      <Clock3 size={12} />
                      {s.duration} min
                    </span>
                  </div>
                  <div className="scenario-card-footer">
                    <span>Explore scenario</span>
                    <ArrowUpRight size={17} />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={30} />
              <h3>No scenarios match just yet.</h3>
              <p>
                Try another concept or clear the filters to explore the full
                library.
              </p>
              <button className="button secondary" onClick={clear}>
                Clear filters
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

function Filter({
  label,
  value,
  set,
  options,
}: {
  label: string;
  value: string;
  set: (s: string) => void;
  options: (string | { value: string; label: string })[];
}) {
  return (
    <label className="filter-select">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => set(e.target.value)}
        aria-label={label}
      >
        <option value="all">All {label.toLowerCase()}s</option>
        {options.map((o) => (
          <option
            key={typeof o === "string" ? o : o.value}
            value={typeof o === "string" ? o : o.value}
          >
            {typeof o === "string" ? o : o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
function ConceptIcon({ category }: { category: Category }) {
  const Icon =
    category === "Candlestick fundamentals"
      ? CandlestickChart
      : category === "Market structure"
        ? Layers3
        : category === "Risk management"
          ? ShieldCheck
          : category === "Trading psychology"
            ? Sprout
            : category === "Market conditions"
              ? Compass
              : Target;
  return <Icon size={22} strokeWidth={1.6} />;
}

export function JournalForm({
  scenarioId,
  onSave,
  onCancel,
}: {
  scenarioId: string;
  onSave: (e: JournalEntry) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState({
    analysis: "",
    hypothesis: "",
    risk: "",
    happened: "",
    learned: "",
  });
  const labels = {
    analysis: "What did you observe?",
    hypothesis: "What was your hypothesis?",
    risk: "What was your risk plan?",
    happened: "What happened?",
    learned: "What will you take into your next practice?",
  };
  return (
    <form
      className="journal-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.learned.trim()) return;
        onSave({
          ...form,
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
          scenarioId,
        });
        setForm({
          analysis: "",
          hypothesis: "",
          risk: "",
          happened: "",
          learned: "",
        });
        onCancel?.();
      }}
    >
      {(Object.keys(labels) as (keyof typeof labels)[]).map((k) => (
        <label key={k}>
          {labels[k]}
          {k === "learned" && <span className="required-label">Required</span>}
          <textarea
            rows={k === "learned" ? 3 : 2}
            maxLength={5000}
            required={k === "learned"}
            value={form[k]}
            onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
            placeholder={
              k === "risk"
                ? "Position size, invalidation, stop and potential loss…"
                : k === "learned"
                  ? "One thing you understand a little better…"
                  : "A few thoughtful words are enough…"
            }
          />
        </label>
      ))}
      <div className="form-actions">
        {onCancel && (
          <button type="button" className="button secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button className="button primary" type="submit">
          Save reflection
          <Check size={16} />
        </button>
      </div>
    </form>
  );
}

function ProgressPage({
  progress,
  start,
  saveEntry,
  onExport,
}: {
  progress: Progress;
  start: (s: Scenario) => void;
  saveEntry: (e: JournalEntry) => void;
  onExport: () => void;
}) {
  const [tab, setTab] = useState<"overview" | "journal" | "sessions">(
    "overview",
  );
  const [writing, setWriting] = useState(false);
  const [journalScenario, setJournalScenario] = useState(
    progress.lastScenarioId,
  );
  const scored = progress.attempts.filter((a) => !a.exploration);
  const correct = scored.filter((a) => a.correct).length;
  const revise = [
    ...new Set(
      scored
        .filter((a) => !a.correct && !progress.completed.includes(a.scenarioId))
        .map((a) => a.scenarioId),
    ),
  ];
  return (
    <>
      <div className="heading-with-action">
        <PageHeading
          eyebrow="REFLECT. CONNECT. KEEP GOING."
          title="Your learning, taking shape."
          description="Good progress is understanding why. Keep the observations, decisions and lessons that matter."
        />
        <button className="button secondary" onClick={onExport}>
          <Download size={16} />
          Export progress
        </button>
      </div>
      <div className="progress-stats">
        <div>
          <span>Lessons completed</span>
          <strong>
            {progress.completed.length}
            <small>/ 27</small>
          </strong>
          <div className="progress-track">
            <span
              style={{ width: `${(progress.completed.length / 27) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <span>Assessed attempts</span>
          <strong>{scored.length}</strong>
          <p>
            {correct} correct · {progress.attempts.length - scored.length}{" "}
            exploration attempts
          </p>
        </div>
        <div>
          <span>Saved reflections</span>
          <strong>{progress.journal.length}</strong>
          <p>A record of what you are learning</p>
        </div>
        <div>
          <span>Practice sessions</span>
          <strong>{progress.sessions.length}</strong>
          <p>Saved fictional trading sessions</p>
        </div>
      </div>
      <div className="library-tabs">
        <button
          className={tab === "overview" ? "active" : ""}
          onClick={() => setTab("overview")}
        >
          Learning overview
        </button>
        <button
          className={tab === "journal" ? "active" : ""}
          onClick={() => setTab("journal")}
        >
          Your journal<span>{progress.journal.length}</span>
        </button>
        <button
          className={tab === "sessions" ? "active" : ""}
          onClick={() => setTab("sessions")}
        >
          Practice history
        </button>
      </div>
      {tab === "overview" ? (
        <div className="overview-columns">
          <section className="panel">
            <h2>Your pathways</h2>
            {pathways.map((path) => {
              const list = scenarios.filter((s) =>
                path.categories.includes(s.category),
              );
              const count = list.filter((s) =>
                progress.completed.includes(s.id),
              ).length;
              return (
                <button
                  className="progress-path"
                  key={path.id}
                  onClick={() =>
                    start(
                      list.find((s) => !progress.completed.includes(s.id)) ??
                        list[0],
                    )
                  }
                >
                  <span className={`concept-icon ${path.color}`}>
                    <Layers3 size={20} />
                  </span>
                  <div>
                    <strong>{path.title}</strong>
                    <small>
                      {count} of {list.length} completed
                    </small>
                    <div className="progress-track">
                      <span
                        style={{ width: `${(count / list.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight size={17} />
                </button>
              );
            })}
            {progress.completed.length > 0 && (
              <p className="last-completed">
                Last completed:{" "}
                <strong>
                  {findScenario(progress.completed.at(-1)!).title}
                </strong>
              </p>
            )}
          </section>
          <section className="panel revision-panel">
            <div className="feature-icon">
              <Sprout size={24} />
            </div>
            <h2>
              {revise.length
                ? "A little more practice."
                : "Understanding grows with practice."}
            </h2>
            <p>
              {revise.length
                ? "These ideas deserve another look. Revisit the explanation and try a different approach."
                : "Your revision suggestions will appear here after assessed attempts. There is no penalty for getting something wrong."}
            </p>
            {revise.length ? (
              revise.map((id) => (
                <button
                  className="revision-link"
                  key={id}
                  onClick={() => start(findScenario(id))}
                >
                  {findScenario(id).title}
                  <ArrowRight size={16} />
                </button>
              ))
            ) : (
              <button
                className="text-button"
                onClick={() =>
                  start(
                    scenarios.find((s) => !progress.completed.includes(s.id)) ??
                      scenarios[0],
                  )
                }
              >
                Find your next lesson
                <ArrowRight size={16} />
              </button>
            )}
          </section>
          <section className="panel attempts-panel">
            <h2>Recent decisions</h2>
            {progress.attempts.length ? (
              <div className="attempt-list">
                {progress.attempts
                  .slice(-8)
                  .reverse()
                  .map((a, i) => (
                    <div key={`${a.at}-${i}`}>
                      <span
                        className={`attempt-dot ${a.correct ? "correct" : ""}`}
                      />
                      <div>
                        <strong>{findScenario(a.scenarioId).title}</strong>
                        <p>{a.answer}</p>
                        <small>
                          {formatDate(a.at)} ·{" "}
                          {a.exploration
                            ? "Exploration"
                            : a.correct
                              ? "Concept understood"
                              : "Ready to revisit"}
                        </small>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="muted-empty">
                Your first decision starts your learning record. Open a lesson,
                make a choice and reveal the outcome.
              </p>
            )}
          </section>
        </div>
      ) : tab === "journal" ? (
        <>
          <div className="section-heading">
            <div>
              <h2>A place to make the learning stick.</h2>
              <p>Saved locally in this browser. Export a copy to keep.</p>
            </div>
            <button
              className="button primary"
              onClick={() => setWriting(!writing)}
            >
              <NotebookPen size={16} />
              {writing ? "Close form" : "New reflection"}
            </button>
          </div>
          {writing && (
            <section className="panel write-panel">
              <label className="field-label">
                Scenario
                <select
                  value={journalScenario}
                  onChange={(e) => setJournalScenario(e.target.value)}
                >
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </label>
              <JournalForm
                scenarioId={journalScenario}
                onSave={saveEntry}
                onCancel={() => setWriting(false)}
              />
            </section>
          )}
          {progress.journal.length ? (
            <div className="journal-entries">
              {progress.journal.map((e) => (
                <article className="panel journal-entry" key={e.id}>
                  <span className="section-eyebrow">{formatDate(e.at)}</span>
                  <h3>{findScenario(e.scenarioId).title}</h3>
                  {(
                    [
                      ["analysis", "Observation"],
                      ["hypothesis", "Hypothesis"],
                      ["risk", "Risk plan"],
                      ["happened", "What happened"],
                      ["learned", "What I learned"],
                    ] as const
                  ).map(
                    ([key, label]) =>
                      e[key] && (
                        <div key={key}>
                          <h4>{label}</h4>
                          <p>{e[key]}</p>
                        </div>
                      ),
                  )}
                </article>
              ))}
            </div>
          ) : (
            !writing && (
              <div className="empty-state">
                <NotebookPen size={32} />
                <h3>A blank page is a good beginning.</h3>
                <p>
                  Record what you saw, what you expected and what changed your
                  understanding.
                </p>
                <button
                  className="button secondary"
                  onClick={() => setWriting(true)}
                >
                  Write your first reflection
                  <ArrowRight size={16} />
                </button>
              </div>
            )
          )}
        </>
      ) : progress.sessions.length ? (
        <div className="session-list">
          {progress.sessions
            .slice()
            .reverse()
            .map((s) => (
              <section className="panel" key={s.id}>
                <div className="section-heading">
                  <div>
                    <span className="section-eyebrow">
                      {formatDate(s.at)} · FICTIONAL FUNDS
                    </span>
                    <h3>
                      {s.mode === "live"
                        ? `${getInstrument(s.instrument ?? "EUR/USD").name} practice`
                        : findScenario(s.scenarioId).title}
                    </h3>
                  </div>
                  <span>
                    Balance <strong>{usd(s.balance)}</strong>
                  </span>
                </div>
                <p>
                  {s.mode === "live"
                    ? "Continuous practice"
                    : "Scenario replay"}{" "}
                  · Starting balance {usd(s.initialBalance ?? 10000)} ·{" "}
                  {s.trades.length} closed trade
                  {s.trades.length !== 1 ? "s" : ""} · Realised{" "}
                  {usd(s.balance - (s.initialBalance ?? 10000))}
                </p>
                {s.trades.map((t) => (
                  <div className="session-trade" key={t.id}>
                    <strong>
                      {t.side.toUpperCase()} · {t.units.toLocaleString()}{" "}
                      {
                        getInstrument(t.instrument ?? s.instrument ?? "EUR/USD")
                          .unit
                      }{" "}
                      · {t.instrument ?? s.instrument ?? "EUR/USD"}
                    </strong>
                    <span>
                      {formatPrice(
                        t.entry,
                        t.instrument ?? s.instrument ?? "EUR/USD",
                      )}{" "}
                      →{" "}
                      {formatPrice(
                        t.exit,
                        t.instrument ?? s.instrument ?? "EUR/USD",
                      )}
                    </span>
                    <span>{t.reason}</span>
                    <b>{usd(t.pnl)}</b>
                  </div>
                ))}
              </section>
            ))}
        </div>
      ) : (
        <div className="empty-state">
          <CandlestickChart size={32} />
          <h3>Your practice belongs here.</h3>
          <p>
            Save a virtual trading session to review its closed trades and
            fictional balance.
          </p>
          <button
            className="button secondary"
            onClick={() => start(findScenario("stop-plan"))}
          >
            Open a risk lesson
            <ArrowRight size={16} />
          </button>
        </div>
      )}
      <p className="local-storage-note">
        <ShieldCheck size={15} />
        Saved only on this device. Clearing browser data removes progress.
        Export it before resetting.
      </p>
    </>
  );
}

function ModalDialog({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!element) return;
    const previous = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      Array.from(
        element.querySelectorAll<HTMLElement>(
          'button,a[href],input,select,textarea,summary,[tabindex="0"]',
        ),
      ).filter((el) => el.getClientRects().length);
    focusable()[0]?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const els = focusable();
      const first = els[0],
        last = els.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    element.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = old;
      element.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [element]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="modal"
        ref={setElement}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={close}
          >
            <X size={21} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function ResetButton({ reset }: { reset: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return confirm ? (
    <div className="reset-confirm">
      <p>Delete all local learning records? This cannot be undone.</p>
      <button className="button danger" onClick={reset}>
        Delete demo progress
      </button>
      <button className="button secondary" onClick={() => setConfirm(false)}>
        Keep my progress
      </button>
    </div>
  ) : (
    <button className="button secondary" onClick={() => setConfirm(true)}>
      <RotateCcw size={16} />
      Reset demo data
    </button>
  );
}
