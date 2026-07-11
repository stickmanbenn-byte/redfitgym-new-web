import { useEffect, useState } from "react";

/**
 * Branded preloader gated on real barbell frame load progress.
 * Hero dispatches `redfit:preload` CustomEvent<{ loaded, total }>.
 * We also wait for document.fonts.ready before fading out.
 */
export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(1);
  const [fontsReady, setFontsReady] = useState(false);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const onProg = (e: Event) => {
      const detail = (e as CustomEvent<{ loaded: number; total: number }>).detail;
      if (!detail) return;
      setProgress(detail.loaded);
      setTotal(detail.total || 1);
    };
    window.addEventListener("redfit:preload", onProg);

    const ready = (document as any).fonts?.ready;
    if (ready && typeof ready.then === "function") {
      ready.then(() => setFontsReady(true)).catch(() => setFontsReady(true));
    } else {
      setFontsReady(true);
    }

    // Safety timeout — never hang the site
    const safety = window.setTimeout(() => setDone(true), 6000);

    return () => {
      window.removeEventListener("redfit:preload", onProg);
      window.clearTimeout(safety);
    };
  }, []);

  useEffect(() => {
    if (progress >= total && fontsReady) {
      // small delay so 100% is visible
      const t = window.setTimeout(() => setDone(true), 220);
      return () => window.clearTimeout(t);
    }
  }, [progress, total, fontsReady]);

  useEffect(() => {
    if (!done) return;
    document.documentElement.classList.add("rf-preloaded");
    const t = window.setTimeout(() => setGone(true), 700);
    return () => window.clearTimeout(t);
  }, [done]);

  if (gone) return null;

  const pct = Math.min(100, Math.round((progress / Math.max(1, total)) * 100));

  return (
    <div className={`rf-preloader${done ? " is-done" : ""}`} aria-hidden={done}>
      <div className="rf-preloader-inner">
        <div className="rf-preloader-brand">
          RED<span>FIT</span>
        </div>
        <div className="rf-preloader-bar">
          <div className="rf-preloader-bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="rf-preloader-pct">{pct.toString().padStart(3, "0")}</div>
      </div>
    </div>
  );
}

export default Preloader;
