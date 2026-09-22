import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ams/shared/PageHeader";
import { useMemo, useState } from "react";
import { Award } from "lucide-react";
import { MuseumStage } from "@/components/ams/museum/MuseumStage";
import { ROLE_ENVIRONMENT } from "@/lib/ams/museum";
import { RoleFilter, type RoleFilterValue } from "@/components/ams/collectible/RoleFilter";
import { VaultToolbar } from "@/components/ams/collectible/VaultToolbar";
import { ROLE_AWARD } from "@/lib/ams/role-assets";
import { ROLES } from "@/lib/ams/roles";

export const Route = createFileRoute("/ams/award-vault")({
  head: () => ({
    meta: [
      { title: "Award Vault — Premium 3D Awards" },
      {
        name: "description",
        content:
          "Museum-quality 3D awards, one per role — with premium materials, 3D rotation and PNG export.",
      },
      { property: "og:title", content: "Award Vault — Premium 3D Awards" },
      {
        property: "og:description",
        content:
          "11 handcrafted role awards with distinct silhouettes, premium bases and cinematic lighting.",
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
      visible.map((role) => ({ src: ROLE_AWARD[role.slug], filename: `${role.slug}-award.png` })),
    [visible],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Award Vault"
        title="Premium 3D Award Collection"
        description="Signature luxury awards for every role — sculpted materials, cinematic reflections, custom bases and profession-led identity language. Rotate, inspect and export each PNG."
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Award className="h-4 w-4 text-primary" />
            <span>
              {ROLES.length} awards · {visible.length} shown
            </span>
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <RoleFilter value={filter} onChange={setFilter} />
        <VaultToolbar items={exportItems} accent="#facc15" exportLabel="Export award set" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((role) => {
          const img = ROLE_AWARD[role.slug];
          return (
            <article key={role.slug} className="dashboard-card overflow-hidden">
              <MuseumStage
                src={img}
                filename={`${role.slug}-award.png`}
                accent={role.accent}
                label={`${role.passportPrefix} · Award`}
                environment={ROLE_ENVIRONMENT[role.slug]}
                material="Brushed metal & glass · Award display"
                height={320}
                chrome="compact"
                unlockKind="achievement"
                unlockTitle={`${role.name} Award Unlocked`}
                unlockSubtitle={role.awardStyle}
              />
              <div className="border-t border-border/60 bg-surface/45 p-4">
                <div className="text-lg font-semibold text-foreground">{role.name}</div>
                <div
                  className="text-[11px] uppercase tracking-widest"
                  style={{ color: `${role.accent}bb` }}
                >
                  {role.archetype} · {role.awardStyle}
                </div>
                <p className="mt-2 text-xs text-foreground/70 italic">"{role.vision}"</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
