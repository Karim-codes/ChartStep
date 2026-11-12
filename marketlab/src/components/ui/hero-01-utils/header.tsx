import { useState } from "react";
import { ArrowUpRight, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { brand } from "@/lib/config";

export interface NavigationSection {
  title: string;
  href: string;
  isActive?: boolean;
}
export { BrandWordmark } from "@/components/Brand";
import { BrandWordmark } from "@/components/Brand";
export function scrollToSection(href: string) {
  const node = document.getElementById(href.replace(/^#/, ""));
  node?.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
    block: "start",
  });
}

export default function Header({
  navigationData,
  onEnter,
  onWorkspace,
  onToggleTheme,
  theme,
}: {
  navigationData: NavigationSection[];
  onEnter: () => void;
  onWorkspace: () => void;
  onToggleTheme: () => void;
  theme: "light" | "dark";
}) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<string | null>(null);
  return (
    <header className="lp-header">
      <div className="lp-header-inner">
        <a
          href="#home"
          className="lp-logo-link"
          aria-label={`${brand.name} home`}
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "instant" });
          }}
        >
          <BrandWordmark />
        </a>
        <NavigationMenu
          className="lp-desktop-nav"
          aria-label="Website navigation"
        >
          <NavigationMenuList>
            {navigationData.map((item) => (
              <NavigationMenuItem key={item.title}>
                <NavigationMenuLink
                  className="lp-nav-link"
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(item.href);
                  }}
                  active={item.isActive}
                >
                  {item.title}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <div className="lp-header-actions">
          <button
            className="lp-theme-button"
            aria-label={
              theme === "light" ? "Switch to dark mode" : "Switch to light mode"
            }
            onClick={onToggleTheme}
          >
            {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
          </button>
          <button className="lp-workspace-link" onClick={onWorkspace}>
            My workspace
            <ArrowUpRight size={14} />
          </button>
          <Button className="lp-header-cta" size="sm" onClick={onEnter}>
            Open the lab
            <ArrowUpRight size={14} />
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="lp-mobile-menu"
                aria-label="Open website navigation"
              >
                <Menu size={23} />
              </button>
            </SheetTrigger>
            <SheetContent
              className="lp-mobile-sheet"
              onCloseAutoFocus={(e) => {
                if (target) {
                  e.preventDefault();
                  requestAnimationFrame(() => {
                    scrollToSection(target);
                    setTarget(null);
                  });
                }
              }}
            >
              <SheetTitle>
                <BrandWordmark />
              </SheetTitle>
              <SheetDescription>
                Learn the thinking behind a trade.
              </SheetDescription>
              <nav aria-label="Mobile website navigation">
                {navigationData.map((item, i) => (
                  <a
                    href={item.href}
                    key={item.title}
                    onClick={(e) => {
                      e.preventDefault();
                      setTarget(item.href);
                      setOpen(false);
                    }}
                  >
                    <span>0{i + 1}</span>
                    {item.title}
                    <ArrowUpRight size={19} />
                  </a>
                ))}
              </nav>
              <Button
                onClick={() => {
                  setOpen(false);
                  onEnter();
                }}
              >
                Open the lab
                <ArrowUpRight size={17} />
              </Button>
              <p>Fictional funds. Real room to learn.</p>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
