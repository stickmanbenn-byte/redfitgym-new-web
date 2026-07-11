import { useEffect, useRef, useState } from "react";
import SplitType from "split-type";
import { gsap, ScrollTrigger, initGsap } from "@/lib/gsap-init";
import SideRays from "@/components/SideRays";
import { BARBELL_FRAMES } from "@/assets/barbell/frames";

// One source of truth for hero scroll length — Block 1 Bug 2.
const HERO_SCROLL_LENGTH = "+=200%";

function LiveCount() {
  const [n, setN] = useState(47);
  useEffect(() => {
    const id = setInterval(
      () => setN((v) => Math.max(30, Math.min(78, v + (Math.random() > 0.5 ? 1 : -1)))),
      8000,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <>
      <b>{n}</b> Training now · 4.9★ on Google
    </>
  );
}

export function Hero() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raysWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initGsap();
    if (!rootRef.current || !canvasRef.current) return;
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = { frame: 0 };
    const TOTAL = 1;
    const N = BARBELL_FRAMES.length;

    // Preload frames — progressive; broadcast progress for the Preloader.
    const images: (HTMLImageElement | null)[] = new Array(N).fill(null);
    let loadedCount = 0;
    const broadcast = () => {
      try {
        window.dispatchEvent(
          new CustomEvent("redfit:preload", { detail: { loaded: loadedCount, total: N } }),
        );
      } catch {}
    };
    broadcast();
    BARBELL_FRAMES.forEach((src, i) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        images[i] = img;
        loadedCount++;
        broadcast();
        const targetIdx = Math.min(N - 1, Math.round((state.frame / TOTAL) * (N - 1)));
        if (i === targetIdx) render();
      };
      img.onerror = () => {
        loadedCount++;
        broadcast();
      };
      img.src = src;
    });

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const p = Math.max(0, Math.min(1, state.frame / TOTAL));
      const idx = Math.min(N - 1, Math.round(p * (N - 1)));
      let img = images[idx];
      if (!img) {
        for (let d = 1; d < N && !img; d++) {
          img = images[Math.max(0, idx - d)] || images[Math.min(N - 1, idx + d)] || null;
        }
      }
      if (!img) return;

      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const scale = Math.min(w / iw, h / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (w - dw) / 2;
      const dy = (h - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render();
    };
    // Bug 3 — rAF-throttled resize handler.
    let ticking = false;
    const onResize = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        resize();
        ticking = false;
      });
    };
    resize();
    window.addEventListener("resize", onResize);

    // Bug 1 — split ONLY the static hero lines, not the swap-word holder.
    const staticLines = root.querySelectorAll<HTMLElement>(
      ".rf-hero-line.rf-hero-static-line",
    );
    let split: SplitType | null = null;
    if (staticLines.length) {
      split = new SplitType(Array.from(staticLines), { types: "words,chars" });
      gsap.set(split.chars, { yPercent: 110, opacity: 0 });
    }

    // Swap words — the holder itself animates as one block.
    const allWords = root.querySelectorAll<HTMLElement>(".rf-hero-headline .rf-swap-word");
    gsap.set(allWords, { opacity: (i) => (i === 0 ? 1 : 0), y: 0 });
    const holder = root.querySelector<HTMLElement>(".rf-swap-word-holder");
    if (holder) gsap.set(holder, { yPercent: 100, opacity: 0 });

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Cross-fade helper for word swap
    let currentWordIdx = 0;
    const swapTo = (nextIdx: number) => {
      if (nextIdx === currentWordIdx || !allWords[nextIdx]) return;
      const current = allWords[currentWordIdx];
      const next = allWords[nextIdx];
      gsap.to(current, {
        y: -24,
        opacity: 0,
        duration: 0.55,
        ease: "power3.out",
        overwrite: "auto",
      });
      gsap.fromTo(
        next,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, ease: "power3.out", overwrite: "auto" },
      );
      currentWordIdx = nextIdx;
    };

    // Cursor-reactive rays (Block 4) — subtle, quickTo-lerped.
    const raysWrap = raysWrapRef.current;
    let raysX: ((v: number) => void) | null = null;
    let raysY: ((v: number) => void) | null = null;
    let onPointerMove: ((e: PointerEvent) => void) | null = null;
    if (raysWrap && !reduceMotion && !("ontouchstart" in window)) {
      raysX = gsap.quickTo(raysWrap, "x", { duration: 0.7, ease: "power3.out" });
      raysY = gsap.quickTo(raysWrap, "y", { duration: 0.7, ease: "power3.out" });
      onPointerMove = (e: PointerEvent) => {
        const rect = root.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        // max ±8% of viewport
        raysX?.(nx * rect.width * 0.08);
        raysY?.(ny * rect.height * 0.08);
      };
      root.addEventListener("pointermove", onPointerMove);
    }

    let rotateInterval: number | undefined;
    let heroST: ScrollTrigger | null = null;

    const ctxAnim = gsap.context(() => {
      ScrollTrigger.matchMedia({
        // DESKTOP + TABLET (motion allowed)
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)": () => {
          const inTl = gsap.timeline({ delay: 0.15, defaults: { ease: "power3.out" } });
          if (split?.chars?.length) {
            inTl.to(split.chars, {
              yPercent: 0,
              opacity: 1,
              stagger: 0.024,
              duration: 1.1,
              ease: "power4.out",
            });
          }
          // Bug 1 fix — the holder reveals as one block, not char-by-char.
          if (holder) {
            inTl.to(
              holder,
              { yPercent: 0, opacity: 1, duration: 0.9, ease: "power3.out" },
              "-=0.6",
            );
          }
          inTl
            .to(".rf-hero-eyebrow", { opacity: 1, y: 0, duration: 0.6 }, 0.2)
            .to(".rf-hero-counter", { opacity: 1, duration: 0.6 }, 0.4)
            .to(".rf-hero-sub", { opacity: 1, y: 0, duration: 0.8 }, "-=0.5")
            .to(".rf-hero-cta-row", { opacity: 1, y: 0, duration: 0.7 }, "-=0.5")
            .to(".rf-hero-scroll-hint", { opacity: 1, duration: 0.6 }, "-=0.4");

          // Bug 2 + Bug 5 + Block 4 — one pin + scroll-driven word swap.
          gsap.to(state, {
            frame: TOTAL,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: HERO_SCROLL_LENGTH,
              pin: true,
              pinSpacing: true,
              scrub: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                render();
                if (allWords.length > 1) {
                  const idx = Math.min(
                    allWords.length - 1,
                    Math.floor(self.progress * allWords.length),
                  );
                  if (idx !== currentWordIdx) swapTo(idx);
                }
              },
              onRefreshInit: (self) => {
                heroST = self;
              },
            },
          });

          // Bug 5 — consolidated dashboard timeline (entrance + float + drift + exit)
          const dash = root.querySelector<HTMLElement>(".rf-hero-dashboard");
          if (dash) {
            gsap.set(dash, {
              opacity: 0,
              x: 120,
              scale: 0.9,
              rotateY: 10,
              filter: "blur(10px)",
              transformPerspective: 900,
              transformOrigin: "center center",
            });
            const entrance = gsap.timeline({ delay: 0.35 });
            entrance.to(dash, {
              opacity: 1,
              x: 0,
              scale: 1,
              rotateY: 4,
              filter: "blur(0px)",
              duration: 1.4,
              ease: "power3.out",
            });
            // Wrap float in its own tween so it can coexist without compounding
            // drift+exit which live on a single scrub timeline below.
            const floatTween = gsap.to(dash, {
              y: "+=6",
              duration: 3.2,
              ease: "sine.inOut",
              yoyo: true,
              repeat: -1,
              paused: true,
            });
            entrance.eventCallback("onComplete", () => floatTween.play());

            // Single scroll-linked timeline for drift + exit — one shared trigger.
            const scrollTl = gsap.timeline({
              scrollTrigger: {
                trigger: root,
                start: "top top",
                end: HERO_SCROLL_LENGTH,
                scrub: 0.6,
              },
            });
            scrollTl
              .to(dash, { yPercent: -10, ease: "none", duration: 0.7 }, 0)
              .to(
                dash,
                { y: -80, opacity: 0, scale: 0.95, filter: "blur(8px)", ease: "power2.in", duration: 0.3 },
                0.7,
              );
          }
        },

        // MOBILE (motion allowed) — no pin; interval-based word rotation fallback
        "(max-width: 767px) and (prefers-reduced-motion: no-preference)": () => {
          const inTl = gsap.timeline({ delay: 0.1, defaults: { ease: "power3.out" } });
          if (split?.chars?.length) {
            inTl.to(split.chars, { yPercent: 0, opacity: 1, stagger: 0.02, duration: 0.9 });
          }
          if (holder) {
            inTl.to(holder, { yPercent: 0, opacity: 1, duration: 0.8 }, "-=0.5");
          }
          inTl
            .to(".rf-hero-eyebrow", { opacity: 1, y: 0, duration: 0.5 }, 0.1)
            .to(".rf-hero-sub", { opacity: 1, y: 0, duration: 0.6 }, "-=0.3")
            .to(".rf-hero-cta-row", { opacity: 1, y: 0, duration: 0.6 }, "-=0.4")
            .to(".rf-hero-counter", { opacity: 1, duration: 0.5 }, "-=0.3");

          gsap.to(state, { frame: TOTAL, duration: 4, ease: "power2.inOut", onUpdate: render });

          if (allWords.length > 1) {
            rotateInterval = window.setInterval(() => {
              swapTo((currentWordIdx + 1) % allWords.length);
            }, 2500);
          }

          const dashM = root.querySelector<HTMLElement>(".rf-hero-dashboard");
          if (dashM) {
            gsap.fromTo(
              dashM,
              { opacity: 0, y: 24, scale: 0.96 },
              { opacity: 1, y: 0, scale: 1, duration: 1.0, ease: "power3.out", delay: 0.3 },
            );
          }
        },

        // REDUCED MOTION
        "(prefers-reduced-motion: reduce)": () => {
          gsap.set(
            [
              ".rf-hero-eyebrow",
              ".rf-hero-sub",
              ".rf-hero-cta-row",
              ".rf-hero-scroll-hint",
              ".rf-hero-counter",
            ],
            { opacity: 1, y: 0 },
          );
          gsap.set(".rf-hero-dashboard", {
            opacity: 1, x: 0, scale: 1, rotateY: 4, filter: "none",
          });
          if (split?.chars) gsap.set(split.chars, { opacity: 1, yPercent: 0 });
          if (holder) gsap.set(holder, { opacity: 1, yPercent: 0 });
          gsap.set(allWords, { opacity: (i) => (i === 0 ? 1 : 0), y: 0 });
          state.frame = TOTAL;
          render();
        },
      });
    }, root);

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    if (typeof document !== "undefined" && (document as any).fonts?.ready) {
      (document as any).fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
    }

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onLoad);
      if (rotateInterval) window.clearInterval(rotateInterval);
      if (onPointerMove) root.removeEventListener("pointermove", onPointerMove);
      split?.revert();
      ctxAnim.revert();
      heroST?.kill();
    };
  }, []);

  return (
    <section ref={rootRef} className="rf-hero" aria-label="REDFIT hero" data-section="hero">
      <canvas ref={canvasRef} className="rf-hero-canvas" />
      <div ref={raysWrapRef} className="rf-hero-rays">
        <SideRays
          rayColor1="#8B0000"
          rayColor2="#B01030"
          origin="top-right"
          speed={2.5}
          intensity={2}
          spread={1.7}
          tilt={1}
          saturation={1.55}
          blend={1}
          falloff={4}
          opacity={1}
        />
      </div>
      <div className="rf-hero-vignette" />
      <div className="rf-hero-grain" aria-hidden="true" />

      <div className="rf-hero-counter">
        <LiveCount />
      </div>

      <div className="rf-hero-content">
        <div className="rf-hero-eyebrow" style={{ transform: "translateY(10px)" }}>
          Chhatrapati Sambhajinagar · Est. Strength
        </div>

        <h1 className="rf-hero-headline">
          <span className="rf-hero-line rf-hero-static-line">Built</span>
          <span className="rf-hero-line rf-hero-static-line accent">Under</span>
          <span className="rf-hero-line">
            <span className="rf-swap-word-holder">
              <span className="rf-swap-word-ghost" aria-hidden="true">Discipline</span>
              <span className="rf-swap-word">Iron</span>
              <span className="rf-swap-word">Discipline</span>
              <span className="rf-swap-word">Pressure</span>
              <span className="rf-swap-word">Grit</span>
              <span className="rf-swap-word">Power</span>
              <span className="rf-swap-word">Strength</span>
            </span>
          </span>
        </h1>

        <p className="rf-hero-sub" style={{ transform: "translateY(10px)" }}>
          Forged to last. A premium strength gym engineered around real training — Red Strength equipment,
          certified coaches, and a room that respects the work.
        </p>

        <div className="rf-hero-cta-row" style={{ transform: "translateY(10px)" }}>
          <a href="#pricing" className="rf-btn accent">Start Free Trial →</a>
          <a href="#programs" className="rf-btn ghost">See Programs</a>
        </div>
      </div>
      <div className="rf-hero-scroll-hint">Scroll · Load the Bar</div>
    </section>
  );
}
