import { ArrowRight, ArrowDown, CornerDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import LivePreview from "./live-preview";
import { scrollToSection } from "./header";

export interface AvatarList {
  image: string;
}
export default function HeroSection({
  onEnter,
  onLesson,
}: {
  onEnter: () => void;
  onLesson: () => void;
  avatarList?: AvatarList[];
}) {
  return (
    <section className="lp-hero">
      <div className="lp-hero-copy">
        <div className="lp-hero-eyebrow">
          <span className="lp-blue-dot" /> A PRACTICE SPACE FOR THE MARKETS
        </div>
        <h1>
          Your first trade
          <br />
          should be a <span>practice run.</span>
        </h1>
        <p>
          Learn the thinking behind a trade. Read a chart, make a decision,
          <br className="lp-desktop-break" /> and see what happens—with money
          that only exists here.
        </p>
        <div className="lp-hero-actions">
          <Button size="lg" onClick={onEnter}>
            Start practising
            <ArrowUpRightIcon />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => scrollToSection("#the-lab")}
          >
            Take a look inside
            <ArrowDown size={16} />
          </Button>
        </div>
        <span className="lp-hero-fineprint">
          Free to explore.
          <span />
          No signup required.
          <span />
          Your curiosity is enough.
        </span>
      </div>
      <div className="lp-preview-intro">
        <span>
          <CornerDownRight size={15} /> GO ON. TRY A DIFFERENT WAY TO LEARN.
        </span>
        <span>THE LAB, IN MINIATURE</span>
      </div>
      <LivePreview onEnter={onEnter} onLesson={onLesson} />
    </section>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={17} className="lp-cta-arrow" />;
}
