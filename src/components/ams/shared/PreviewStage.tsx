import { useState } from "react";
import { Volume2, Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCelebration } from "@/components/ams/effects/Celebration";
import { ProceduralEmblem } from "./ProceduralEmblem";
import { RARITY_META, type Award } from "@/lib/ams/types";

type PreviewAward = Pick<Award, "name" | "type" | "rarity" | "media"> &
  Partial<Pick<Award, "id" | "department">>;

export function PreviewStage({ award }: { award: PreviewAward }) {
  const { celebrate } = useCelebration();
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const playSound = () => {
    if (!award.media.soundUrl) return;
    if (audio) audio.pause();
    const a = new Audio(award.media.soundUrl);
    setAudio(a); a.play().catch(() => undefined);
  };

  const meta = RARITY_META[award.rarity];
  const emblemAward = {
    id: award.id ?? `preview:${award.name}:${award.type}:${award.rarity}`,
    type: award.type, rarity: award.rarity, department: award.department, media: award.media,
  };

  return (
    <div className="surface-card relative overflow-hidden p-8">
      <div
        className="absolute inset-0 opacity-50"
        style={{ background: `radial-gradient(ellipse at center, ${meta.hue}33, transparent 65%)` }}
      />
      <div className="relative flex flex-col items-center gap-6">
        <div className="stage-3d relative grid h-52 w-52 place-items-center overflow-hidden rounded-full"
             style={{ background: `radial-gradient(circle, ${meta.glow}, transparent 70%)` }}>
          <div className="pointer-events-none absolute inset-0 holo-glass" aria-hidden />
          <div
            className="caustic-pool pointer-events-none absolute bottom-4 left-1/2 h-6 w-36 -translate-x-1/2 rounded-full blur-[10px]"
            aria-hidden
            style={{ background: "radial-gradient(closest-side, color-mix(in oklab, var(--color-primary-glow) 60%, transparent), transparent 74%)" }}
          />
          <div className="stage-3d-object relative">
            {award.media.model3dUrl ? (
              <img src={award.media.model3dUrl} alt={award.name} className="h-44 w-44 drop-shadow-[0_20px_50px_color-mix(in_oklab,black_70%,transparent)]" />
            ) : (
              <ProceduralEmblem award={emblemAward} size={200} />
            )}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div
                className="specular-sweep absolute inset-y-[-20%] left-0 w-1/3"
                style={{
                  background: "linear-gradient(100deg, transparent, color-mix(in oklab, white 40%, transparent), transparent)",
                  mixBlendMode: "screen",
                  filter: "blur(2px)",
                }}
              />
            </div>
          </div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: meta.hue }}>{meta.label} · {award.type}</div>
          <div className="mt-1 font-display text-2xl font-bold text-gradient-trophy">{award.name}</div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            size="sm" variant="outline" className="gap-1.5"
            onClick={() => celebrate({ kind: award.type === "trophy" ? "trophy" : award.type === "badge" ? "badge" : "achievement", title: award.name, subtitle: "Preview unlock" })}
          >
            <Sparkles className="h-3.5 w-3.5" /> Simulate unlock
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={playSound} disabled={!award.media.soundUrl}>
            <Volume2 className="h-3.5 w-3.5" /> Play sound
          </Button>
          {award.media.gifUrl && (
            <Button size="sm" variant="outline" className="gap-1.5" asChild>
              <a href={award.media.gifUrl} target="_blank" rel="noreferrer"><Play className="h-3.5 w-3.5" /> Open GIF</a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
