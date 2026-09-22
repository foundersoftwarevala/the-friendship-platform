import { useEffect, useRef, useState } from "react";
import { Download, RotateCw, Pause, Sparkles } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useCelebration, type CelebrateKind } from "@/components/ams/effects/Celebration";
import { MuseumCase, SVMicroMark, SVSeal, svCollectionNumber } from "@/components/ams/brand/SVMark";
import { Button } from "@/components/ui/button";

/**
 * Ultra-premium 3D collectible viewer with:
 *  - Lazy mount via IntersectionObserver (heavy visuals only when visible)
 *  - Reduced-motion mode (auto from prefers-reduced-motion + local override)
 *  - CSS 3D rotation, animated rim/spot lighting, sparkles, floor reflection
 *  - Download PNG button
 *  - Optional Unlock button that fires the app-wide Celebration overlay
 */
export function Collectible3D({
  src,
  filename,
  accent,
  label,
  height = 320,
  unlockKind = "trophy",
  unlockTitle,
  unlockSubtitle,
  showUnlock = false,
  eager = false,
}: {
  src: string;
  filename: string;
  accent: string;
  label?: string;
  height?: number;
  unlockKind?: CelebrateKind;
  unlockTitle?: string;
  unlockSubtitle?: string;
  showUnlock?: boolean;
  /** Skip the IntersectionObserver gate and mount immediately. */
  eager?: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const { celebrate } = useCelebration();

  const [spin, setSpin] = useState(!reducedMotion);
  const [inView, setInView] = useState(eager);
  const [visible, setVisible] = useState(eager);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setSpin(!reducedMotion), [reducedMotion]);

  // IntersectionObserver lazy mount + pause when off-screen for perf.
  useEffect(() => {
    if (eager) return;
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true); setVisible(true); return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            setVisible(true);
          } else {
            setVisible(false);
          }
        }
      },
      { rootMargin: "200px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eager]);

  async function handleDownload() {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, "_blank");
    }
  }

  function handleUnlock() {
    celebrate({
      kind: unlockKind,
      title: unlockTitle ?? label ?? "Collectible Unlocked",
      subtitle: unlockSubtitle,
    });
  }

  const animate = !reducedMotion && visible;
  const doSpin = spin && animate;

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [engaged, setEngaged] = useState(false);

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reducedMotion) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setEngaged(true);
    setTilt({ x: px * 26, y: py * 18 });
  }
  function handlePointerLeave() {
    setEngaged(false);
    setTilt({ x: 0, y: 0 });
  }

  return (
    <div
      ref={wrapRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      data-engaged={engaged}
      className="object-3d stage-3d relative w-full overflow-hidden rounded-t-xl border-b border-border/70"
      style={{
        height,
        background: `
          radial-gradient(70% 55% at 50% 8%, color-mix(in oklab, white 12%, transparent), transparent 72%),
          radial-gradient(90% 60% at 50% 108%, color-mix(in oklab, var(--color-primary) 22%, transparent), transparent 70%),
          linear-gradient(180deg, color-mix(in oklab, var(--card) 78%, black), color-mix(in oklab, var(--background) 86%, black))
        `,
        boxShadow: "inset 0 1px 0 color-mix(in oklab, white 12%, transparent)",
        contain: "content",
        // @ts-expect-error CSS custom props
        "--rx": tilt.x,
        "--ry": tilt.y,
      }}
    >
      {!inView ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-24 w-24 rounded-full animate-pulse"
            style={{ background: `radial-gradient(closest-side, ${accent}44, transparent)` }} />
        </div>
      ) : (
        <>
          {/* volumetric key light */}
          <div
            className="pointer-events-none absolute inset-x-[14%] top-0 h-3/4 opacity-60"
            style={{
              background: "radial-gradient(ellipse at 50% 0%, color-mix(in oklab, white 22%, transparent), transparent 66%)",
              mixBlendMode: "screen",
            }}
          />
          {/* holographic display glass */}
          <div className="pointer-events-none absolute inset-0 holo-glass" aria-hidden />

          <div className="relative h-full w-full flex items-center justify-center">
            <div
              className="stage-3d-object relative"
              style={{
                animation: doSpin ? "collectible-spin 9s cubic-bezier(0.45,0,0.55,1) infinite" : "none",
                width: height * 0.78,
                height: height * 0.94,
                willChange: doSpin || engaged ? "transform" : undefined,
              }}
            >
              <img
                src={src}
                alt={label ?? filename}
                loading="lazy"
                decoding="async"
                width={1024}
                height={1024}
                className="h-full w-full object-contain"
                style={{
                  filter:
                    "drop-shadow(0 30px 34px color-mix(in oklab, black 78%, transparent)) drop-shadow(0 0 26px color-mix(in oklab, var(--color-primary) 34%, transparent)) contrast(1.08) saturate(1.05)",
                }}
              />
              {/* rim light hugging the silhouette */}
              <div
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{
                  background:
                    "radial-gradient(60% 50% at 22% 18%, color-mix(in oklab, white 26%, transparent), transparent 62%)",
                  mixBlendMode: "screen",
                }}
              />
              {animate && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div
                    className="absolute inset-y-[-20%] left-0 w-1/3 specular-sweep"
                    style={{
                      background:
                        "linear-gradient(100deg, transparent, color-mix(in oklab, white 42%, transparent), transparent)",
                      mixBlendMode: "screen",
                      filter: "blur(2px)",
                    }}
                  />
                </div>
              )}
            </div>

            {/* mirrored pedestal reflection */}
            <div
              className="stage-reflection pointer-events-none absolute left-1/2 -translate-x-1/2"
              aria-hidden
              style={{ bottom: 2, width: height * 0.78, height: height * 0.36, marginLeft: 0, transformOrigin: "center" }}
            >
              <img
                src={src}
                alt=""
                aria-hidden
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain object-top"
              />
            </div>

            {/* caustic light pool */}
            <div
              className="caustic-pool pointer-events-none absolute left-1/2 bottom-5 h-7 rounded-full"
              style={{
                width: height * 0.58,
                background:
                  "radial-gradient(closest-side, color-mix(in oklab, var(--color-primary-glow) 55%, transparent), transparent 74%)",
                filter: "blur(12px)",
              }}
            />
            {/* contact shadow */}
            <div
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-6 h-3 rounded-full"
              style={{
                width: height * 0.34,
                background: "radial-gradient(closest-side, oklch(0 0 0 / 0.75), transparent 76%)",
                filter: "blur(6px)",
              }}
            />
          </div>
        </>
      )}


      {/* Software Vala museum case + brand marks */}
      <MuseumCase accent={accent} />
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <SVSeal accent={accent} />
        <SVMicroMark accent={accent} className="hidden sm:inline" />
      </div>
      <div
        className="absolute bottom-2 right-3 z-10 font-mono uppercase"
        style={{ fontSize: 9, letterSpacing: "0.22em", color: `${accent}aa` }}
      >
        {svCollectionNumber(filename, "sv")}
      </div>

      {/* Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        {!reducedMotion && (
          <Button
            type="button"
            onClick={() => setSpin((s) => !s)}
            title={spin ? "Pause rotation" : "Resume rotation"}
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-card/90"
          >
            {spin ? <Pause className="h-3.5 w-3.5" /> : <RotateCw className="h-3.5 w-3.5" />}
          </Button>
        )}
        <Button
          type="button"
          onClick={handleDownload}
          title="Download PNG"
          variant="outline"
          size="sm"
          className="h-8 bg-card/90 px-2.5 text-[11px]"
        >
          <Download className="h-3.5 w-3.5" />
          PNG
        </Button>
      </div>

      {showUnlock && (
        <Button
          type="button"
          onClick={handleUnlock}
          size="sm"
          className="absolute bottom-3 right-3 z-10 h-8 gap-1.5 px-3 text-[11px]"
        >
          <Sparkles className="h-3.5 w-3.5" /> Unlock
        </Button>
      )}

      {label && (
        <div
          className="absolute bottom-2 left-3 text-[10px] font-mono tracking-[0.3em] uppercase"
          style={{ color: `${accent}cc` }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
