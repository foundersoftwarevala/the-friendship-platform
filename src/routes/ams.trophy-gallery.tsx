import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trophy, Volume2, Sparkles } from "lucide-react";
import { ROLES } from "@/lib/ams/roles";
import { playUnlock, type UnlockPreset } from "@/lib/ams/trophy-sounds";
import { PageHeader } from "@/components/ams/shared/PageHeader";
import { MuseumStage } from "@/components/ams/museum/MuseumStage";
import { ROLE_ENVIRONMENT } from "@/lib/ams/museum";

import affiliate from "@/assets/trophies/affiliate.png";
import author from "@/assets/trophies/author.png";
import creator from "@/assets/trophies/creator.png";
import developer from "@/assets/trophies/developer.png";
import franchise from "@/assets/trophies/franchise.png";
import influencer from "@/assets/trophies/influencer.png";
import reseller from "@/assets/trophies/reseller.png";
import seo from "@/assets/trophies/seo.png";
import support from "@/assets/trophies/support.png";
import user from "@/assets/trophies/user.png";
import vendor from "@/assets/trophies/vendor.png";

const TROPHY: Record<string, string> = {
  developer,
  reseller,
  franchise,
  author,
  vendor,
  affiliate,
  influencer,
  creator,
  seo,
  support,
  user,
};

// Museum-quality theme per role — no two identities repeat.
const ROLE_THEME: Record<
  string,
  { grad: string; particle: string; unlock: UnlockPreset; material: string; shape: string }
> = {
  developer: {
    grad: "radial-gradient(900px 400px at 20% 0%, rgba(34,211,238,0.14), transparent 60%), linear-gradient(160deg, oklch(0.235 0.036 258) 0%, oklch(0.185 0.034 258) 100%)",
    particle: "#7defff",
    unlock: "diamond",
    material: "Cyan Crystal · Circuit Base",
    shape: "Hexagonal Chip Trophy",
  },
  reseller: {
    grad: "radial-gradient(900px 400px at 80% 0%, rgba(251,191,36,0.14), transparent 60%), linear-gradient(160deg, oklch(0.235 0.036 258) 0%, oklch(0.185 0.034 258) 100%)",
    particle: "#ffe28a",
    unlock: "gold",
    material: "24k Gold · Onyx Plinth",
    shape: "Growth Diamond Cup",
  },
  franchise: {
    grad: "radial-gradient(900px 400px at 40% 0%, rgba(244,114,182,0.14), transparent 60%), linear-gradient(160deg, oklch(0.235 0.036 258) 0%, oklch(0.185 0.034 258) 100%)",
    particle: "#ffb0d4",
    unlock: "elite",
    material: "Rose Gold · Wax Crest",
    shape: "Regal Shield Standard",
  },
  author: {
    grad: "radial-gradient(900px 400px at 60% 0%, rgba(167,139,250,0.14), transparent 60%), linear-gradient(160deg, oklch(0.235 0.036 258) 0%, oklch(0.185 0.034 258) 100%)",
    particle: "#d9c9ff",
    unlock: "silver",
    material: "Amethyst · Ink Marble",
    shape: "Feathered Quill Obelisk",
  },
  vendor: {
    grad: "radial-gradient(900px 400px at 30% 0%, rgba(52,211,153,0.14), transparent 60%), linear-gradient(160deg, oklch(0.235 0.036 258) 0%, oklch(0.185 0.034 258) 100%)",
    particle: "#8affd0",
    unlock: "silver",
    material: "Emerald Glass · Marble",
    shape: "Storefront Arch Cup",
  },
  affiliate: {
    grad: "radial-gradient(900px 400px at 50% 0%, rgba(96,165,250,0.14), transparent 60%), linear-gradient(160deg, oklch(0.235 0.036 258) 0%, oklch(0.185 0.034 258) 100%)",
    particle: "#a5c9ff",
    unlock: "bronze",
    material: "Sapphire · Node Grid",
    shape: "Network Orb & Rings",
  },
  influencer: {
    grad: "radial-gradient(900px 400px at 40% 0%, rgba(236,72,153,0.14), transparent 60%), linear-gradient(160deg, oklch(0.235 0.036 258) 0%, oklch(0.185 0.034 258) 100%)",
    particle: "#ffb2df",
    unlock: "legend",
    material: "Neon Rose Chrome",
    shape: "Broadcast Wave Star",
  },
  creator: {
    grad: "radial-gradient(900px 400px at 60% 0%, rgba(251,146,60,0.14), transparent 60%), linear-gradient(160deg, oklch(0.235 0.036 258) 0%, oklch(0.185 0.034 258) 100%)",
    particle: "#ffcf9a",
    unlock: "gold",
    material: "Copper Fire · Prism Base",
    shape: "Flame Spire Sculpture",
  },
  seo: {
    grad: "radial-gradient(900px 400px at 40% 0%, rgba(74,222,128,0.14), transparent 60%), linear-gradient(160deg, oklch(0.235 0.036 258) 0%, oklch(0.185 0.034 258) 100%)",
    particle: "#b9ffd1",
    unlock: "silver",
    material: "Malachite · Chrome Ring",
    shape: "Ranking Ladder Compass",
  },
  support: {
    grad: "radial-gradient(900px 400px at 50% 0%, rgba(56,189,248,0.14), transparent 60%), linear-gradient(160deg, oklch(0.235 0.036 258) 0%, oklch(0.185 0.034 258) 100%)",
    particle: "#a6e6ff",
    unlock: "bronze",
    material: "Sky Crystal · Steel Halo",
    shape: "Guardian Halo Shield",
  },
  user: {
    grad: "radial-gradient(900px 400px at 50% 0%, rgba(148,163,184,0.14), transparent 60%), linear-gradient(160deg, oklch(0.235 0.036 258) 0%, oklch(0.185 0.034 258) 100%)",
    particle: "#e2e8f0",
    unlock: "starter",
    material: "Silver Frost · Etched Base",
    shape: "First-Step Star Trophy",
  },
};

export const Route = createFileRoute("/ams/trophy-gallery")({
  head: () => ({
    meta: [
      { title: "Trophy Gallery — Museum of Roles" },
      {
        name: "description",
        content:
          "Every profession, its own luxury trophy — a museum-quality showcase across all AMS roles.",
      },
      { property: "og:title", content: "Trophy Gallery — Museum of Roles" },
      {
        property: "og:description",
        content:
          "Every profession, its own luxury trophy — a museum-quality showcase across all AMS roles.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Museum Wing"
        title="Trophy Gallery"
        description="A world-class collection of luxury trophies — one utterly unique identity per profession. Ultra-realistic materials, engraved nameplates, cinematic lighting and premium unlock sound."
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>
              {ROLES.length} professions · {ROLES.length * 7} named trophies
            </span>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {ROLES.map((role) => (
          <TrophyDisplayCase key={role.slug} role={role} />
        ))}
      </div>
    </div>
  );
}

function TrophyDisplayCase({ role }: { role: (typeof ROLES)[number] }) {
  const theme = ROLE_THEME[role.slug] ?? ROLE_THEME.user;
  const [tierIdx, setTierIdx] = useState(role.trophies.length - 1);
  const tier = role.trophies[tierIdx];

  function play() {
    playUnlock(theme.unlock);
  }

  return (
    <article className="surface-card relative overflow-hidden rounded-2xl">
      {/* museum spotlight */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--color-primary) 45%, transparent), transparent)",
        }}
      />

      {/* sparkles */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 rounded-full trophy-sparkle bg-primary-glow"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 60}%`,
              boxShadow: "0 0 10px var(--color-primary-glow)",
              animationDelay: `${Math.random() * 2}s`,
              // @ts-expect-error CSS var
              "--sx": `${(Math.random() - 0.5) * 30}px`,
              "--sy": `-${20 + Math.random() * 30}px`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex items-start justify-between p-5">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary-glow">
            {role.passportPrefix}
          </div>
          <div className="mt-1 text-xl font-semibold text-foreground">{role.name}</div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {role.archetype} · {role.trophyStyle}
          </div>
        </div>
        <span className="rounded-full border border-primary/45 bg-primary/12 px-2 py-1 font-mono text-[10px] text-primary-glow">
          {tier.label}
        </span>
      </div>

      {/* Museum-grade trophy stage */}
      <div className="relative z-10 px-3 pb-3">
        <MuseumStage
          src={TROPHY[role.slug]}
          filename={`${role.slug}-trophy.png`}
          accent={role.accent}
          label={`${role.passportPrefix} · ${tier.label} Trophy`}
          environment={ROLE_ENVIRONMENT[role.slug]}
          material={theme.material}
          height={280}
          chrome="compact"
          unlockKind={theme.unlock === "gold" || theme.unlock === "elite" ? "rankUp" : "trophy"}
          unlockTitle={`${role.name} ${tier.label} Trophy Unveiled`}
          unlockSubtitle={`${theme.material} · ${theme.shape}`}
          unlockSlug={`${role.slug}-${tier.key}`}
          rewardXp={100 * (tierIdx + 1)}
        />
      </div>

      {/* engraved nameplate */}
      <div className="relative z-10 mx-5 mb-3 overflow-hidden rounded-md border border-primary/35 bg-primary/8">
        <div className="h-1 w-full bg-[var(--gradient-primary)]" />
        <div className="px-4 py-2.5">
          <div className="text-[10px] uppercase tracking-[0.24em] text-primary-glow">Engraved</div>
          <div className="mt-0.5 text-sm font-medium tracking-wide text-foreground">
            {tier.label}
          </div>
          <div className="text-[10px] italic text-foreground/60">"{role.motto}"</div>
        </div>
      </div>

      {/* tier selector */}
      <div className="relative z-10 px-5 pb-3">
        <div className="flex flex-wrap gap-1.5">
          {role.trophies.map((t, i) => (
            <button
              key={t.key}
              onClick={() => setTierIdx(i)}
              aria-pressed={i === tierIdx}
              className={`focus-ring rounded-full border px-2 py-1 font-mono text-[10px] transition ${
                i === tierIdx
                  ? "border-primary bg-primary text-primary-foreground shadow-[0_0_18px_-6px_var(--color-primary)]"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary-glow"
              }`}
            >
              {t.key.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-2 gap-2 px-5 pb-4 text-[10px] text-foreground/70">
        <div>
          <span className="uppercase tracking-widest text-muted-foreground">Material</span>
          <div className="mt-0.5">{theme.material}</div>
        </div>
        <div>
          <span className="uppercase tracking-widest text-muted-foreground">Silhouette</span>
          <div className="mt-0.5">{theme.shape}</div>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between border-t border-border/70 bg-surface/70 px-5 py-3">
        <div className="flex items-center gap-1.5 text-[11px] text-foreground/60">
          <Trophy className="h-3.5 w-3.5" style={{ color: role.accent }} />
          {role.awardStyle}
        </div>
        <button
          onClick={play}
          className="btn-glow focus-ring inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-primary-foreground transition"
        >
          <Volume2 className="h-3.5 w-3.5" /> Ceremony
        </button>
      </div>
    </article>
  );
}
