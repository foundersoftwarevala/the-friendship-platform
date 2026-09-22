import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";
import { navMetaForPath } from "@/lib/nav";

/**
 * Per-screen banner using the AMS reference composition with Software Vala's
 * semantic palette.
 */
export function PageBanner() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const meta = navMetaForPath(pathname);
  if (!meta || pathname === "/") return null;

  const Icon = meta.icon;
  const subtitle = `${meta.group} module — configure, review and operate ${meta.label.toLowerCase()} across the recognition system.`;

  return (
    <section className="page-banner motion-rise">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      <div className="relative grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-[11px]"
          >
            <Link
              to="/ams/overview"
              className="flex items-center gap-1 transition-opacity hover:opacity-100 opacity-80"
            >
              <Home className="h-3 w-3" /> AMS
            </Link>
            <ChevronRight className="h-3 w-3 opacity-50" />
            <span className="truncate">{meta.group}</span>
          </nav>

          <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary-glow">
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{meta.label}</span>
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-[34px]">
            {meta.label}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {subtitle}
          </p>
        </div>

        <div className="hidden lg:grid lg:justify-self-end">
          <span className="grid h-20 w-20 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-primary)_24%,transparent)]">
            <Icon className="h-9 w-9 drop-shadow-[0_8px_18px_color-mix(in_oklab,var(--color-primary)_55%,transparent)]" />
          </span>
        </div>
      </div>
    </section>
  );
}
