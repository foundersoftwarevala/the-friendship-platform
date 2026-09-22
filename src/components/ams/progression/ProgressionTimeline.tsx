import { useState } from "react";
import { Lock, Check, Sparkles, Volume2 } from "lucide-react";
import type { DeveloperStage } from "@/lib/ams/developer-stages";
import { StageCard } from "@/components/ams/trophy-gallery/StageCard";
import { useCelebration, type CelebrateKind } from "@/components/ams/effects/Celebration";
import { playUnlock } from "@/lib/ams/trophy-sounds";
import { useReducedMotion, setReducedMotionOverride } from "@/hooks/use-reduced-motion";
import { PageHeader } from "@/components/ams/shared/PageHeader";
import { Button } from "@/components/ui/button";


const UNLOCK_KIND: Record<string, CelebrateKind> = {
  starter: "achievement",
  bronze: "achievement",
  silver: "levelUp",
  gold: "rankUp",
  elite: "rankUp",
  diamond: "milestone",
  legend: "trophy",
  master: "trophy",
  founder: "founder",
};

export function ProgressionTimeline({
  stages,
  role,
  kicker,
  title,
  description,
}: {
  stages: DeveloperStage[];
  role: string;
  kicker: string;
  title: string;
  description: string;
}) {
  const [selected, setSelected] = useState(0);
  const [unlocked, setUnlocked] = useState<Set<number>>(new Set([1]));
  const [soundOn, setSoundOn] = useState(true);
  const reducedMotion = useReducedMotion();
  const { celebrate, soundOn: globalSound, setSoundOn: setGlobalSound } = useCelebration();

  const stage = stages[selected];
  const [rFrom, rTo] = stage.ribbon;

  function unlock(n: number) {
    const s = stages.find((x) => x.n === n);
    if (!s) return;
    setUnlocked((prev) => new Set(prev).add(n));
    setSelected(stages.findIndex((x) => x.n === n));
    if (soundOn && globalSound) {
      try { playUnlock(s.unlock); } catch { /* noop */ }
    }
    celebrate({
      kind: UNLOCK_KIND[s.unlock] ?? "achievement",
      title: `${s.title} Unlocked`,
      subtitle: `${role} · ${s.material} · Stage ${String(s.n).padStart(2, "0")}`,
      xp: 100 * s.n,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={kicker}
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-full px-3 text-[11px]"
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                setGlobalSound(next);
              }}
            >
              <Volume2 className="h-3.5 w-3.5" />
              Sound: {soundOn && globalSound ? "On" : "Off"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-full px-3 text-[11px]"
              onClick={() => setReducedMotionOverride(reducedMotion ? false : true)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Motion: {reducedMotion ? "Reduced" : "Full"}
            </Button>
            <span className="ml-1 text-muted-foreground">
              {unlocked.size}/{stages.length} stages unlocked
            </span>
          </div>
        }
      />


      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Timeline rail */}
        <ol className="relative rounded-2xl border border-border/60 bg-card p-3 space-y-1.5 h-fit">
          <span
            className="absolute left-[26px] top-4 bottom-4 w-px"
            style={{ background: `linear-gradient(180deg, ${stages[0].bg.accent}55, ${stages[stages.length - 1].bg.accent}55)` }}
          />
          {stages.map((s, i) => {
            const isSelected = i === selected;
            const isUnlocked = unlocked.has(s.n);
            return (
              <li key={s.n}>
                <button
                  onClick={() => setSelected(i)}
                  className={`relative w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left transition ${
                    isSelected ? "bg-foreground/5" : "hover:bg-white/[0.03]"
                  }`}
                  style={{
                    boxShadow: isSelected ? `inset 0 0 0 1px ${s.bg.accent}88` : undefined,
                  }}
                >
                  <span
                    className="grid h-8 w-8 place-items-center rounded-full text-[10px] font-bold shrink-0 z-10"
                    style={{
                      background: isUnlocked
                        ? `linear-gradient(135deg, ${s.bg.accent}, ${s.ribbon[1]})`
                        : "rgba(255,255,255,0.04)",
                      color: isUnlocked ? "#0b0f1a" : `${s.bg.accent}bb`,
                      border: `1px solid ${s.bg.accent}66`,
                      boxShadow: isSelected ? `0 0 18px -2px ${s.bg.glow}` : undefined,
                    }}
                  >
                    {isUnlocked ? <Check className="h-3.5 w-3.5" /> : String(s.n).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-mono tracking-widest uppercase" style={{ color: `${s.bg.accent}bb` }}>
                      LV {String(s.n).padStart(2, "0")} · {s.material}
                    </span>
                    <span className="block text-sm text-foreground truncate">{s.title}</span>
                  </span>
                  {!isUnlocked && <Lock className="h-3.5 w-3.5 text-foreground/40" />}
                </button>
              </li>
            );
          })}
        </ol>

        {/* Stage detail */}
        <div className="space-y-4">
          <StageCard stage={stage} unlocked={unlocked.has(stage.n)} />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3">
            <div className="text-xs text-foreground/70">
              Ribbon:{" "}
              <span
                className="inline-block h-2 w-16 rounded-full align-middle mx-1"
                style={{ background: `linear-gradient(90deg, ${rFrom}, ${rTo})` }}
              />
              · {stage.nameplate}
            </div>
            <div className="flex items-center gap-2">
              {selected > 0 && (
                <button
                  onClick={() => setSelected(selected - 1)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground/80 hover:bg-foreground/5"
                >
                  ← Previous
                </button>
              )}
              <button
                onClick={() => unlock(stage.n)}
                disabled={unlocked.has(stage.n)}
                className="inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold transition hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${stage.bg.accent}, ${rTo})`,
                  color: "#0b0f1a",
                  boxShadow: `0 0 22px -6px ${stage.bg.glow}`,
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {unlocked.has(stage.n) ? "Unlocked" : "Unlock stage"}
              </button>
              {selected < stages.length - 1 && (
                <button
                  onClick={() => setSelected(selected + 1)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground/80 hover:bg-foreground/5"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
