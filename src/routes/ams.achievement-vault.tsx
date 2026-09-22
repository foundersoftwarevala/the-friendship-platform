import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ams/shared/PageHeader";
import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { MuseumStage } from "@/components/ams/museum/MuseumStage";
import { ROLE_ENVIRONMENT } from "@/lib/ams/museum";
import { RoleFilter, type RoleFilterValue } from "@/components/ams/collectible/RoleFilter";
import { VaultToolbar } from "@/components/ams/collectible/VaultToolbar";
import { ROLE_ACHIEVEMENT } from "@/lib/ams/role-assets";
import { ROLES } from "@/lib/ams/roles";

export const Route = createFileRoute("/ams/achievement-vault")({
  head: () => ({
    meta: [
      { title: "Achievement Vault — Premium 3D Achievements" },
      {
        name: "description",
        content:
          "Museum-quality 3D achievement collectibles, one per role — with premium rotation, animated lighting and PNG export.",
      },
      { property: "og:title", content: "Achievement Vault — Premium 3D Achievements" },
      {
        property: "og:description",
        content:
          "11 handcrafted role achievements with unique silhouettes, engraved motifs and collectible-grade finish.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const [filter, setFilter] = useState<RoleFilterValue>("all");
  const visible = useMemo(
    () => (filter === "all" ? ROLES : ROLES.filter((r) => r.slug === filter)),
    [filter],
  );
  const exportItems = useMemo(
    () =>
      visible.map((role) => ({
        src: ROLE_ACHIEVEMENT[role.slug],
        filename: `${role.slug}-achievement.png`,
      })),
    [visible],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Achievement Vault"
        title="Premium 3D Achievement Collection"
        description="Each achievement collectible is built as a role-specific medallion — distinct silhouette, engraved profession cues, luxury finish and cinematic lighting. Rotate and export each one."
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Trophy className="h-4 w-4 text-primary" />
            <span>
              {ROLES.length} achievements · {visible.length} shown
            </span>
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <RoleFilter value={filter} onChange={setFilter} />
        <VaultToolbar items={exportItems} accent="#facc15" exportLabel="Export achievement set" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((role) => {
          const img = ROLE_ACHIEVEMENT[role.slug];
          return (
            <article key={role.slug} className="dashboard-card overflow-hidden">
              <MuseumStage
                src={img}
                filename={`${role.slug}-achievement.png`}
                accent={role.accent}
                label={`${role.passportPrefix} · Achievement`}
                environment={ROLE_ENVIRONMENT[role.slug]}
                material="Crystal & chrome · Achievement display"
                height={320}
                chrome="compact"
                unlockKind="trophy"
                unlockTitle={`${role.name} Achievement Unlocked`}
                unlockSubtitle={role.congratulations}
              />
              <div className="border-t border-border/60 bg-surface/45 p-4">
                <div className="text-lg font-semibold text-foreground">{role.name}</div>
                <div
                  className="text-[11px] uppercase tracking-widest"
                  style={{ color: `${role.accent}bb` }}
                >
                  {role.archetype} · Achievement Core
                </div>
                <p className="mt-2 text-xs text-foreground/70 italic">"{role.motivation}"</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
