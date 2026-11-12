import { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowUp,
  Check,
  Plus,
  NotebookPen,
  CornerDownRight,
} from "lucide-react";
import HeroSection from "@/components/ui/hero-01-utils/hero";
import type { NavigationSection } from "@/components/ui/hero-01-utils/header";
import Header, { BrandWordmark } from "@/components/ui/hero-01-utils/header";
import BrandSlider, {
  type BrandList,
} from "@/components/ui/hero-01-utils/brand-slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brand, pricing } from "@/lib/config";
import { scenarios, pathways } from "@/content/scenarios";
import type { JournalEntry } from "@/engine/types";
import { readProgress, writeProgress } from "@/lib/storage";
import "./hero-01-utils/landing.css";

interface Props {
  onEnter?: () => void;
  onWorkspace?: () => void;
  onLesson?: () => void;
  onPathway?: (id: string) => void;
  onOpenJournal?: () => void;
  onSaveReflection?: (entry: JournalEntry) => boolean;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}
const route = (page: string) => {
  location.hash = page;
};
const navigationData: NavigationSection[] = [
  { title: "The lab", href: "#the-lab" },
  { title: "How it works", href: "#the-method" },
  { title: "For educators", href: "#for-educators" },
  { title: "Plans", href: "#plans" },
];
const brandList: BrandList[] = [
  { name: "EUR/USD", description: "EURO / US DOLLAR", symbol: "€" },
  { name: "XAU/USD", description: "GOLD", symbol: "Au" },
  { name: "GBP/USD", description: "POUND / US DOLLAR", symbol: "£" },
  { name: "XAG/USD", description: "SILVER", symbol: "Ag" },
  { name: "AUD/USD", description: "AUSTRALIAN DOLLAR", symbol: "A$" },
];
const steps = [
  {
    n: "01",
    title: "Get the idea.",
    body: "A short, plain-language lesson gives you something specific to look for. Start with the shape of a candle. Work up to the thinking behind a trade.",
    tag: "LEARN",
  },
  {
    n: "02",
    title: "See it for yourself.",
    body: "Mark a level. Reveal another candle. Make a decision with fictional funds. You can pause the market while you put the pieces together.",
    tag: "PRACTISE",
  },
  {
    n: "03",
    title: "Keep the lesson.",
    body: "Get an explanation of what happened, revisit the idea and record your thinking. The useful part is understanding why you made the call.",
    tag: "REFLECT",
  },
];
const faqs = [
  [
    "Do I need to know how to trade?",
    "No. The foundations pathway begins with how to read a candlestick. Each exercise introduces its terminology and gives you one clear task to try.",
  ],
  [
    "Is this a live market or real money?",
    "All prices are synthetic and all funds are fictional. ChartStep is an educational simulator with no deposits, brokerage connection or real orders. Continuous practice generates fresh price movement locally.",
  ],
  [
    "What can I try in the demo?",
    "All 27 authored scenarios, five practice instruments, replay controls, chart drawings, virtual accounts and the local journal are open. You do not need to sign up or pay.",
  ],
  [
    "Where does my progress go?",
    "Your progress, practice account and reflections are saved in this browser. There is no cloud account. Clearing browser data can remove them, and you can export your records from Progress & journal.",
  ],
];

/** ChartStep adaptation of the supplied hero-01 composition. All supporting helpers are implemented locally. */
export default function AgencyHeroSection({
  onEnter = () => route("trading"),
  onWorkspace = () => route("learn"),
  onLesson = () => route("replay"),
  onPathway = () => route("pathways"),
  onOpenJournal = () => route("progress"),
  onSaveReflection,
  theme = "light",
  onToggleTheme = () => {},
}: Props = {}) {
  useEffect(() => {
    const id = location.hash.slice(1);
    if (["the-lab", "the-method", "for-educators", "plans"].includes(id))
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView({ behavior: "instant" }),
      );
  }, []);
  const [noteTitle, setNoteTitle] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  function saveReflection(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      scenarioId: "candle-body",
      at: new Date().toISOString(),
      analysis: noteTitle.trim(),
      hypothesis: "",
      risk: "",
      happened: "Reflection from the introductory chart preview.",
      learned: note.trim(),
    };
    let success: boolean;
    if (onSaveReflection) success = onSaveReflection(entry);
    else {
      const p = readProgress();
      success = writeProgress({ ...p, journal: [entry, ...p.journal] });
    }
    setSaved(success);
    setSaveError(!success);
  }
  return (
    <div className="landing-page" id="home">
      <a className="lp-skip" href="#landing-main">
        Skip to content
      </a>
      <Header
        navigationData={navigationData}
        onEnter={onEnter}
        onWorkspace={onWorkspace}
        onToggleTheme={onToggleTheme}
        theme={theme}
      />
      <main id="landing-main">
        <div className="lp-opening">
          <HeroSection onEnter={onEnter} onLesson={onLesson} />
          <BrandSlider brandList={brandList} />
        </div>
        <section className="lp-section lp-method" id="the-method" tabIndex={-1}>
          <div className="lp-section-top">
            <span className="lp-section-index">01 / THE METHOD</span>
            <span className="lp-section-note">
              LEARNING IS SOMETHING YOU DO.
            </span>
          </div>
          <div className="lp-method-heading">
            <h2>
              A little theory.
              <br />A lot of <span>“I get it now.”</span>
            </h2>
            <p>
              A market chart makes more sense when you can work with it.
              ChartStep turns an explanation into something you can observe, try
              and think through.
            </p>
          </div>
          <div className="lp-steps">
            {steps.map((step) => (
              <article key={step.n}>
                <div className="lp-step-line">
                  <span>{step.n}</span>
                  <span>{step.tag}</span>
                  <CornerDownRight size={17} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="lp-curriculum">
          <div className="lp-section lp-curriculum-inner">
            <div className="lp-curriculum-heading">
              <span className="lp-section-index">
                02 / FIND YOUR STARTING POINT
              </span>
              <h2>
                From your first candle
                <br />
                to a plan you
                <br />
                <span>can explain.</span>
              </h2>
              <p>
                27 authored scenarios. Three thoughtful pathways. Start at the
                beginning, or follow a question.
              </p>
              <Button variant="outline" onClick={onLesson}>
                Start with the basics
                <ArrowUpRight size={16} />
              </Button>
            </div>
            <div className="lp-pathway-list">
              {pathways.map((path, i) => {
                const lessons = scenarios.filter((s) =>
                  path.categories.includes(s.category),
                );
                return (
                  <button
                    className="lp-pathway-row"
                    onClick={() => onPathway(path.id)}
                    key={path.id}
                  >
                    <span className="lp-pathway-index">0{i + 1}</span>
                    <div>
                      <span className="lp-pathway-label">
                        {i === 0
                          ? "LOOK CLOSER"
                          : i === 1
                            ? "CONNECT THE DOTS"
                            : "THINK IT THROUGH"}
                      </span>
                      <h3>
                        {i === 0
                          ? "Candles & structure"
                          : i === 1
                            ? "Price action & context"
                            : "Risk & decision-making"}
                      </h3>
                      <p>{path.description}</p>
                      <span className="lp-lesson-count">
                        {lessons.length} INTERACTIVE LESSONS
                      </span>
                    </div>
                    <ArrowUpRight size={21} />
                  </button>
                );
              })}
            </div>
          </div>
        </section>
        <section className="lp-section lp-reflection">
          <div className="lp-reflection-image">
            <img
              src="/images/learning-notes.jpg"
              alt="A fountain pen on a handwritten notebook page"
              loading="lazy"
              width="1000"
              height="751"
            />
            <span>THINK IT THROUGH. WRITE IT DOWN.</span>
            <span className="lp-photo-index">03 / THE JOURNAL</span>
          </div>
          <div className="lp-reflection-content">
            <span className="lp-section-index">
              THE PART THAT STAYS WITH YOU
            </span>
            <h2>
              The chart moves on.
              <br />
              <span>Your thinking matters.</span>
            </h2>
            <p>
              What caught your eye? What would change your mind? A short
              reflection helps turn one practice session into something useful
              for the next.
            </p>
            <form onSubmit={saveReflection} className="lp-note-form">
              <div className="lp-note-form-heading">
                <NotebookPen size={17} />
                <strong>Your first field note</strong>
                <span>SAVED ON THIS DEVICE</span>
              </div>
              <Label htmlFor="reflection-title">
                A name for your observation <span>(optional)</span>
              </Label>
              <Input
                id="reflection-title"
                value={noteTitle}
                maxLength={150}
                onChange={(e) => {
                  setNoteTitle(e.target.value);
                  setSaved(false);
                }}
                placeholder="Something you noticed on the chart…"
              />
              <Label htmlFor="reflection-note">What are you taking away?</Label>
              <textarea
                id="reflection-note"
                required
                maxLength={5000}
                rows={3}
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setSaved(false);
                }}
                placeholder="It does not need to be a perfect answer. Just your own."
              />
              <div className="lp-note-form-bottom">
                <span>No account. Just a place to think.</span>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!note.trim() || saved}
                >
                  {saved ? (
                    <>
                      <Check size={15} />
                      Saved to journal
                    </>
                  ) : (
                    <>
                      Save reflection
                      <ArrowUpRight size={14} />
                    </>
                  )}
                </Button>
              </div>
              {saved && (
                <div className="lp-note-status" role="status">
                  Your reflection is saved in this browser.{" "}
                  <button type="button" onClick={onOpenJournal}>
                    Open your journal
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}
              {saveError && (
                <p className="lp-note-error" role="alert">
                  Browser storage is unavailable. Copy your note to keep it.
                </p>
              )}
            </form>
          </div>
        </section>
        <section className="lp-educators" id="for-educators" tabIndex={-1}>
          <div className="lp-section lp-educators-inner">
            <div>
              <span className="lp-section-index">
                04 / FOR INDEPENDENT EDUCATORS
              </span>
              <h2>
                Give your students
                <br />
                something to
                <br />
                <span>work through.</span>
              </h2>
              <p>
                Bring the idea off the lesson slide and onto a chart. Explore
                the student experience today and help shape what comes next for
                academies.
              </p>
              <a
                className="lp-educator-link"
                href={`mailto:${brand.contactEmail}?subject=ChartStep%20academy%20enquiry`}
              >
                Let’s talk about your academy
                <ArrowUpRight size={18} />
              </a>
            </div>
            <div className="lp-academy-notebook">
              <div className="lp-academy-notebook-top">
                <span>THE ACADEMY EDITION</span>
                <span className="lp-planned-tag">ON THE DRAWING BOARD</span>
              </div>
              <h3>
                Your approach.
                <br />A shared place to practise.
              </h3>
              <ul>
                {[
                  "A workspace with your academy’s identity",
                  "Exercises you can assign and discuss",
                  "Student progress and mentor feedback",
                  "Your own authored market scenarios",
                ].map((t, i) => (
                  <li key={t}>
                    <span>0{i + 1}</span>
                    {t}
                  </li>
                ))}
              </ul>
              <p>
                Academy tools are planned. The working student demo is open now.
              </p>
              <Button variant="outline" onClick={onWorkspace}>
                Explore the student experience
                <ArrowRight size={15} />
              </Button>
            </div>
          </div>
        </section>
        <section className="lp-section lp-plans" id="plans" tabIndex={-1}>
          <div className="lp-plans-heading">
            <div>
              <span className="lp-section-index">05 / ROOM TO GROW</span>
              <h2>
                Start with curiosity.
                <br />
                <span>The demo is on us.</span>
              </h2>
            </div>
            <p>
              Every working feature is free to explore today. These are possible
              future plans, with provisional pricing.
            </p>
          </div>
          <div className="lp-pricing-grid">
            {pricing.map((plan, i) => (
              <article className="lp-price" key={plan.name}>
                <div className="lp-price-title">
                  <h3>{plan.name}</h3>
                  <span>{plan.planned ? "PLANNED" : "AVAILABLE NOW"}</span>
                </div>
                <div className="lp-price-amount">
                  {i === 2 && <span className="lp-price-from">From</span>}
                  {plan.price}
                  <small>
                    {i === 0 ? "to get started" : "/ month, provisional"}
                  </small>
                </div>
                <p>{plan.description}</p>
                <ul>
                  {plan.features.map((f) => (
                    <li key={f}>
                      <Check size={14} />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.planned ? (
                  <Button variant="outline" asChild>
                    <a
                      href={`mailto:${brand.contactEmail}?subject=${encodeURIComponent(`ChartStep ${plan.name} enquiry`)}`}
                    >
                      {i === 2 ? "Talk to us" : "Enquire about Pro"}
                      <ArrowUpRight size={15} />
                    </a>
                  </Button>
                ) : (
                  <Button onClick={onEnter}>
                    Step inside the lab
                    <ArrowUpRight size={15} />
                  </Button>
                )}
              </article>
            ))}
          </div>
          <span className="lp-pricing-note">
            No checkout. No payment details. All demo features remain
            accessible.
          </span>
        </section>
        <section className="lp-section lp-questions">
          <span className="lp-section-index">
            A FEW THINGS YOU MIGHT BE WONDERING
          </span>
          <div className="lp-faqs">
            {faqs.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <Plus size={18} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="lp-final-invite">
          <div className="lp-section">
            <span className="lp-small-label">
              YOU DON’T NEED TO KNOW IT ALL TO BEGIN.
            </span>
            <h2>
              Let’s make your
              <br />
              first move <span>a thoughtful one.</span>
            </h2>
            <Button size="lg" onClick={onEnter}>
              Open ChartStep
              <ArrowUpRight size={18} />
            </Button>
            <p>Fictional funds. Real room to learn.</p>
          </div>
        </section>
      </main>
      <footer className="lp-footer">
        <div className="lp-section">
          <div className="lp-footer-top">
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({
                  top: 0,
                  behavior: matchMedia("(prefers-reduced-motion: reduce)")
                    .matches
                    ? "instant"
                    : "smooth",
                });
              }}
              aria-label="Back to ChartStep home"
            >
              <BrandWordmark footer />
            </a>
            <span>
              An independent {brand.owner} project.
              <br />
              Built for learning by doing.
            </span>
            <button
              className="lp-back-top"
              aria-label="Back to top"
              onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
            >
              <ArrowUp size={20} />
            </button>
          </div>
          <div className="lp-footer-bottom">
            <p>
              Educational simulation only. Synthetic prices. Fictional funds.
              Simulated results do not predict future performance. Trading
              involves significant risk.
            </p>
            <a href={`mailto:${brand.contactEmail}`}>
              Get in touch
              <ArrowUpRight size={13} />
            </a>
            <span>
              © {new Date().getFullYear()} {brand.name}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
