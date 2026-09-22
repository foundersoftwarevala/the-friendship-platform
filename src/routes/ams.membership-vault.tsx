import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ams/shared/PageHeader";
import { useMemo, useState } from "react";
import { CreditCard } from "lucide-react";
import { ROLES } from "@/lib/ams/roles";
import { ROLE_MEMBERSHIP } from "@/lib/ams/role-assets";
import { MuseumStage } from "@/components/ams/museum/MuseumStage";
import { ROLE_ENVIRONMENT } from "@/lib/ams/museum";
import { RoleFilter, type RoleFilterValue } from "@/components/ams/collectible/RoleFilter";

export const Route = createFileRoute("/ams/membership-vault")({
  head: () => ({
    meta: [
      { title: "Membership Vault — Premium 3D Member Cards" },
      {
        name: "description",
        content:
          "Museum-quality 3D membership cards, one per role — NFC chip, holographic strip, engraved emblem, 3D rotation and PNG export.",
      },
      { property: "og:title", content: "Membership Vault — Premium 3D Member Cards" },
      {
        property: "og:description",
        content: "11 handcrafted role membership cards with luxury materials and unique emblems.",
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

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Membership Vault"
        title="Premium 3D Membership Cards"
        description="Every role earns a handcrafted metal-and-hologram membership card — NFC chip, holographic security strip, engraved role emblem and laser-etched serial. Rotate, inspect and export as PNG."
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CreditCard className="h-4 w-4 text-primary" />
            <span>
              {ROLES.length} cards · {visible.length} shown
            </span>
          </div>
        }
      />

      <RoleFilter value={filter} onChange={setFilter} />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((role) => {
          const img = ROLE_MEMBERSHIP[role.slug];
          return (
            <article key={role.slug} className="dashboard-card overflow-hidden">
              <MuseumStage
                src={img}
                filename={`${role.slug}-membership.png`}
                accent={role.accent}
                label={`${role.passportPrefix} · Member`}
                environment={ROLE_ENVIRONMENT[role.slug]}
                material="Anodised metal · Membership display"
                height={320}
                chrome="compact"
                unlockKind="badge"
                unlockTitle={`${role.name} Membership Activated`}
                unlockSubtitle={role.motto}
              />
              <div className="border-t border-border/60 bg-surface/45 p-4">
                <div className="text-lg font-semibold text-foreground">{role.name}</div>
                <div
                  className="text-[11px] uppercase tracking-widest"
                  style={{ color: `${role.accent}bb` }}
                >
                  {role.archetype} · Premium Member
                </div>
                <p className="mt-2 text-xs text-foreground/70 italic">"{role.motto}"</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
