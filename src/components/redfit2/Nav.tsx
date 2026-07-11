import { useEffect, useRef, useState } from "react";
import GlassSurface, { type GlassSurfaceProps } from "./GlassSurface";
import { gsap } from "@/lib/gsap-init";

const LINKS = [
  { href: "#programs", id: "programs", label: "Programs" },
  { href: "#trainers", id: "trainers", label: "Trainers" },
  { href: "#pricing", id: "pricing", label: "Membership" },
  { href: "#schedule", id: "schedule", label: "Schedule" },
  { href: "#visit", id: "visit", label: "Visit" },
];

const GLASS_DEFAULTS: Partial<GlassSurfaceProps> = {
  borderRadius: 40,
  backgroundOpacity: 0.4,
  saturation: 1.8,
  distortionScale: -140,
  redOffset: 5,
  greenOffset: 10,
  blueOffset: 18,
};

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const mainPillRef = useRef<HTMLDivElement>(null);
  const ctaPillRef = useRef<HTMLDivElement>(null);

  // Body-lock while mobile menu open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  // Scroll-aware condensed state — animate pill heights via GSAP
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const targets = [mainPillRef.current, ctaPillRef.current].filter(Boolean);
    if (!targets.length) return;
    gsap.to(targets, {
      "--rf-pill-h": scrolled ? "52px" : "64px",
      duration: 0.45,
      ease: "power3.out",
    });
  }, [scrolled]);

  // Active-section indicator via IntersectionObserver
  useEffect(() => {
    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => !!el,
    );
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        // Choose the entry closest to the top of the viewport currently intersecting
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Mobile menu: Escape, focus trap, focus restore
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const focusables = dialog?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])',
    );
    const first = focusables?.[0];
    const last = focusables?.[focusables.length - 1];
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === "Tab" && focusables && focusables.length > 0) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      // return focus to the toggle
      menuBtnRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <a href="#top" className="rf-skip-link">Skip to content</a>

      <header
        className={`rf-nav-glass${scrolled ? " is-scrolled" : ""}`}
        data-scrolled={scrolled ? "true" : "false"}
      >
        <div className="rf-nav-glass-inner">
          <div ref={mainPillRef} className="rf-glass-pill-wrap">
            <GlassSurface
              {...GLASS_DEFAULTS}
              height={64}
              width="auto"
              backgroundOpacity={scrolled ? 0.6 : 0.4}
              className="rf-glass-pill rf-glass-pill--main"
            >
              <div className="rf-glass-pill-row">
                <a href="#top" className="rf-brand rf-glass-brand">
                  RED<span>FIT</span>
                </a>
                <nav className="rf-nav-links rf-glass-links" aria-label="Primary">
                  {LINKS.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      className={activeId === l.id ? "is-active" : undefined}
                      aria-current={activeId === l.id ? "true" : undefined}
                    >
                      {l.label}
                    </a>
                  ))}
                </nav>
              </div>
            </GlassSurface>
          </div>

          <div ref={ctaPillRef} className="rf-glass-pill-wrap">
            <GlassSurface
              {...GLASS_DEFAULTS}
              height={64}
              width="auto"
              backgroundOpacity={scrolled ? 0.6 : 0.4}
              className="rf-glass-pill rf-glass-pill--cta"
            >
              <a href="#pricing" className="rf-glass-cta">
                Book Trial
              </a>
            </GlassSurface>
          </div>

          <GlassSurface
            {...GLASS_DEFAULTS}
            height={56}
            width={56}
            className="rf-glass-pill rf-glass-pill--menu"
          >
            <button
              ref={menuBtnRef}
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="rf-mobile-menu"
              className="rf-glass-menu-btn"
            >
              <span /><span /><span />
            </button>
          </GlassSurface>
        </div>
      </header>

      {open && (
        <div
          ref={dialogRef}
          id="rf-mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="rf-mobile-menu"
          onClick={(e) => {
            // backdrop click-to-close (only if clicking the container itself)
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="rf-mobile-menu-top">
            <span className="rf-brand">RED<span>FIT</span></span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="rf-mobile-menu-close"
            >
              CLOSE
            </button>
          </div>
          <nav className="rf-mobile-menu-nav" aria-label="Mobile primary">
            {LINKS.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                style={{ animation: `rfMenuIn 500ms cubic-bezier(0.4,0,0.2,1) ${i * 60}ms both` }}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <style>{`@keyframes rfMenuIn { from { opacity: 0; transform: translateY(20px);} to { opacity:1; transform: translateY(0);} }`}</style>
        </div>
      )}
    </>
  );
}
