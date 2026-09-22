import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ams/shared/PageHeader";
import { useMemo, useState } from "react";
import { BookMarked } from "lucide-react";
import { MuseumStage } from "@/components/ams/museum/MuseumStage";
import { ROLE_ENVIRONMENT } from "@/lib/ams/museum";
import { RoleFilter, type RoleFilterValue } from "@/components/ams/collectible/RoleFilter";
import { VaultToolbar } from "@/components/ams/collectible/VaultToolbar";
import { PassportQR } from "@/components/ams/collectible/PassportQR";
import { ROLE_PASSPORT } from "@/lib/ams/role-assets";
import { ROLES } from "@/lib/ams/roles";

export const Route = createFileRoute("/ams/tickets/passport-vault")({
  head: () => ({
    meta: [
      { title: "Passport Vault — Premium 3D Digital Passports" },
      { name: "description", content: "Museum-quality 3D digital passports, one per role — with 3D rotation, animated lighting and PNG export." },
      { property: "og:title", content: "Passport Vault — Premium 3D Digital Passports" },
      { property: "og:description", content: "11 handcrafted role passports with luxury materials and unique cover motifs." },
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
    () => visible.map((role) => ({ src: ROLE_PASSPORT[role.slug], filename: `${role.slug}-passport.png` })),
    [visible],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Passport Vault"
        title="Premium 3D Digital Passports"
        description="Every role earns a handcrafted luxury passport. Rotate, inspect and export each cover as high-resolution PNG. Reduced-motion aware and lazy-loaded for smooth scrolling."
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BookMarked className="h-4 w-4 text-primary" />
          <span>{ROLES.length} passports · {visible.length} shown</span>
        </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <RoleFilter value={filter} onChange={setFilter} />
        <VaultToolbar items={exportItems} accent="#facc15" exportLabel="Export passport set" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((role) => {
          const img = ROLE_PASSPORT[role.slug];
          return (
            <article
              key={role.slug}
              className="dashboard-card overflow-hidden"
            >
              <MuseumStage
                src={img}
                filename={`${role.slug}-passport.png`}
                accent={role.accent}
                label={`${role.passportPrefix} · Passport`}
                environment={ROLE_ENVIRONMENT[role.slug]}
                material="Holographic laminate · Passport display"
                height={320}
                chrome="compact"
                unlockKind="badge"
                unlockTitle={`${role.name} Passport Issued`}
                unlockSubtitle={role.passport.verification}
              />
              <div className="border-t border-border/60 bg-surface/45 p-4 space-y-3">
                <div>
                  <div className="text-lg font-semibold text-foreground">{role.name}</div>
                  <div className="text-[11px] uppercase tracking-widest" style={{ color: `${role.accent}bb` }}>
                    {role.archetype} · {role.passportPrefix}
                  </div>
                  <p className="mt-2 text-xs text-foreground/70 italic">"{role.passport.cover}"</p>
                </div>
                <PassportQR role={role} size={104} />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

