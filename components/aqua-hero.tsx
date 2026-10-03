"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "motion/mini";
import { ArrowDownRight, ArrowUpRight, Camera, Pause, Play, ScanLine, Waves } from "lucide-react";
import type { createAquaScene } from "@/lib/aqua-scene";

export function AquaHero({ online, onStart, onInsights }: { online: boolean; onStart: () => void; onInsights: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const controller = useRef<ReturnType<typeof createAquaScene> | null>(null);
  const [scene, setScene] = useState<"static" | "ready" | "unavailable">("static");
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const motionAllowed = useRef(false);
  const visible = useRef(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    update(); preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    motionAllowed.current = !paused && !reduced;
    controller.current?.setRunning(motionAllowed.current && visible.current && !document.hidden);
  }, [paused, reduced]);
  useEffect(() => {
    if (!copy.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Text starts visible in HTML. Motion is progressive enhancement, never a loading gate.
    const controls = animate(copy.current, { opacity: [0.4, 1], transform: ["translateY(14px)", "translateY(0px)"] }, { duration: 0.7, ease: [0.2, 0.65, 0.2, 1] });
    return () => controls.stop();
  }, []);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false, loading = false;
    const sync = () => controller.current?.setRunning(motionAllowed.current && visible.current && !document.hidden);
    const load = async () => {
      if (loading || disposed) return;
      loading = true;
      try {
        const { createAquaScene } = await import("@/lib/aqua-scene");
        if (disposed) return;
        let failed = false;
        controller.current = createAquaScene(element, () => { failed = true; if (!disposed) setScene("unavailable"); });
        if (!failed) setScene("ready");
        sync();
      } catch {
        if (!disposed) { controller.current?.dispose(); controller.current = null; setScene("unavailable"); }
      }
    };
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
      if (entry.isIntersecting) void load();
      sync();
    }, { threshold: 0.05 });
    if (observer) observer.observe(element);
    // Leave the static composition in place on older browsers without visibility observers.
    document.addEventListener("visibilitychange", sync);
    return () => { disposed = true; observer?.disconnect(); document.removeEventListener("visibilitychange", sync); controller.current?.dispose(); controller.current = null; };
  }, []);

  return <header className="aqua-hero" data-motion={paused || reduced ? "still" : "flowing"}>
    <div className="aqua-hero-copy" ref={copy}>
      <div className="aqua-hero-eyebrow"><span><Waves size={15} /> AQUA / FIELD INTELLIGENCE</span><span className="aqua-edition">01 — OBSERVE</span></div>
      <h1>A closer look.<br />A clearer <em>current.</em></h1>
      <p>Follow the evidence, from the water’s edge to human insight. Every observation has a story. Keep it in focus.</p>
      <div className="aqua-hero-actions">
        <button type="button" className="aqua-primary" onClick={onStart}><Camera size={17} /> New observation <ArrowUpRight size={18} /></button>
        <button type="button" className="aqua-secondary" onClick={onInsights}>Explore river insights <ArrowUpRight size={16} /></button>
      </div>
      <div className="aqua-hero-foot"><span className="aqua-network"><i />{online ? "LOCAL WORKSPACE" : "OFFLINE WORKSPACE"}</span><span>Evidence first. Human judgment always.</span></div>
    </div>
    <div className={`aqua-hero-object${scene === "ready" ? " has-3d" : ""}`}>
      <div className="aqua-object-grid" aria-hidden="true" />
      <div className="aqua-static" aria-hidden="true"><span className="aqua-static-river" /><span className="aqua-static-ring" /><span className="aqua-static-orbit" /></div>
      <div className="aqua-scene" ref={host} aria-hidden="true" />
      <span className="aqua-object-index" aria-hidden="true">A / L<br /><span>OPTICAL STUDY</span></span>
      <span className="aqua-object-cross" aria-hidden="true">+</span>
      <div className="aqua-object-caption"><span><ScanLine size={14} /> Abstract water study · {scene === "ready" ? "3D" : "static"}</span>{scene === "ready" && !reduced && <button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label={paused ? "Play decorative motion" : "Pause decorative motion"}>{paused ? <Play size={13} /> : <Pause size={13} />}{paused ? "Play motion" : "Pause motion"}</button>}{reduced && <span className="aqua-still-label">Still view</span>}</div>
    </div>
    <div className="aqua-hero-rail" aria-hidden="true"><span>OBSERVE</span><i /><span>QUESTION</span><i /><span>REVIEW</span><ArrowDownRight size={17} /></div>
  </header>;
}
