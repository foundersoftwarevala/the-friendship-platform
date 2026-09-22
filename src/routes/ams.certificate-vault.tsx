import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ams/shared/PageHeader";
import { useMemo, useState } from "react";
import { ScrollText } from "lucide-react";
import { MuseumStage } from "@/components/ams/museum/MuseumStage";
import { ROLE_ENVIRONMENT } from "@/lib/ams/museum";
import { RoleFilter, type RoleFilterValue } from "@/components/ams/collectible/RoleFilter";
import { VaultToolbar } from "@/components/ams/collectible/VaultToolbar";
import { CertificateQR } from "@/components/ams/collectible/CertificateQR";
import { ROLE_CERTIFICATE } from "@/lib/ams/role-assets";
import { certificateIdentity } from "@/lib/ams/certificate-id";
import { ROLES } from "@/lib/ams/roles";

export const Route = createFileRoute("/ams/tickets/certificate-vault")({
  head: () => ({
    meta: [
      { title: "Certificate Vault — Premium 3D Certificates" },
      { name: "description", content: "Foil-embossed 3D role certificates with certificate numbers, scannable QR verification, rotation and PNG export." },
      { property: "og:title", content: "Certificate Vault — Premium 3D Certificates" },
      { property: "og:description", content: "Role certificates with gold foil borders, wax seals, guilloché detail and registry-verified QR codes." },
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
    () => visible.map((role) => ({ src: ROLE_CERTIFICATE[role.slug], filename: `${role.slug}-certificate.png` })),
    [visible],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Certificate Vault"
        title="Premium 3D Certificate Collection"
        description="Foil-embossed certificates with guilloché borders, wax seals and role-specific crests. Every certificate carries its own registry number and scannable QR verification."
        actions={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ScrollText className="h-4 w-4 text-primary" />
          <span>{ROLES.length} certificates · {visible.length} shown</span>
        </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <RoleFilter value={filter} onChange={setFilter} />
        <VaultToolbar items={exportItems} accent="#facc15" exportLabel="Export certificate set" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((role) => {
          const identity = certificateIdentity(role);
          return (
            <article key={role.slug} className="dashboard-card overflow-hidden">
              <MuseumStage
                src={ROLE_CERTIFICATE[role.slug]}
                filename={`${role.slug}-certificate.png`}
                accent={role.accent}
                label={`${identity.number} · Certificate`}
                environment={ROLE_ENVIRONMENT[role.slug]}
                material="Cotton paper & gold foil · Certificate display"
                height={320}
                chrome="compact"
                unlockKind="achievement"
                unlockTitle={`${role.name} Certificate Issued`}
                unlockSubtitle={identity.title}
              />
              <div className="border-t border-border/60 bg-surface/45 p-4 space-y-3">
                <div>
                  <div className="text-lg font-semibold text-foreground">{role.name}</div>
                  <div className="text-[11px] uppercase tracking-widest" style={{ color: `${role.accent}bb` }}>
                    {identity.title}
                  </div>
                  <p className="mt-2 text-xs text-foreground/60 font-mono">
                    No. {identity.number} · Issued {identity.issued}
                  </p>
                </div>
                <CertificateQR role={role} size={104} />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
