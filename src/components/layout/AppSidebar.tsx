import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, PanelLeftClose, PanelLeftOpen, Search, X, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";
import { primaryNav, navGroups, bottomNav, type NavItem } from "@/lib/nav";

const COLLAPSE_KEY = "ams:sidebar:collapsed";

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () =>
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });

  return { collapsed, toggleCollapsed, mobileOpen, setMobileOpen };
}

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AppSidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: AppSidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return navGroups
      .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [query]);

  const groupOpen = (label: string, items: NavItem[]) =>
    openGroups[label] ?? items.some((i) => isActive(i.to));

  const ItemLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.to);
    return (
      <Link
        to={item.to}
        onClick={onCloseMobile}
        title={item.label}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group/item relative flex min-h-10 items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-[color,background-color,border-color,box-shadow] duration-200",
          collapsed && "justify-center px-0",
          active
            ? "border-primary/35 bg-primary/12 font-semibold text-foreground shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-primary)_18%,transparent)]"
            : "border-transparent text-muted-foreground hover:border-border/80 hover:bg-surface hover:text-foreground",
        )}
      >
        {active && (
          <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-primary shadow-[0_0_12px_var(--color-primary)]" />
        )}
        <span
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-md",
            active && "bg-primary/15 text-primary-glow",
          )}
        >
          <item.icon className="h-4 w-4" />
        </span>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  const content = (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-[72px] shrink-0 items-center gap-2 border-b border-sidebar-border px-3",
          collapsed && "justify-center px-0",
        )}
      >
        <Link
          to="/ams/overview"
          className="flex min-w-0 items-center gap-2"
          onClick={onCloseMobile}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/40 bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-[0_10px_24px_-10px_var(--color-primary)]">
            <Trophy className="h-5 w-5" />
          </span>
          {!collapsed && (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[15px] font-bold tracking-tight text-foreground">
                AMS Manager
              </span>
              <span className="block truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Software Vala
              </span>
            </span>
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={onToggleCollapsed}
            className="ml-auto hidden h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground lg:grid"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={onCloseMobile}
          className="ml-auto grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {collapsed && (
        <button
          onClick={onToggleCollapsed}
          className="mx-auto mt-3 hidden h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground lg:grid"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      {!collapsed && (
        <div className="shrink-0 px-3 pt-3">
          <div className="focus-glow flex h-10 items-center gap-2 rounded-lg border border-sidebar-border bg-surface/80 px-3 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-primary)_8%,transparent)]">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a module…"
              aria-label="Find a module"
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-4 overflow-y-auto px-2.5 py-4 scrollbar-thin">
        <div className="space-y-0.5">
          {primaryNav.map((item) => (
            <ItemLink key={item.to} item={item} />
          ))}
        </div>

        {filtered?.length === 0 && !collapsed && (
          <p className="px-2.5 py-6 text-center text-xs text-muted-foreground">
            No modules match “{query}”.
          </p>
        )}

        {(filtered ?? navGroups).map((group) => {
          const open = filtered ? true : groupOpen(group.label, group.items);
          if (collapsed) {
            return (
              <div key={group.label} className="space-y-0.5 border-t border-border/60 pt-2">
                {group.items.map((item) => (
                  <ItemLink key={item.to} item={item} />
                ))}
              </div>
            );
          }
          return (
            <div key={group.label}>
              <button
                onClick={() => setOpenGroups((s) => ({ ...s, [group.label]: !open }))}
                aria-expanded={open}
                className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {group.label}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    open && "rotate-180",
                  )}
                />
              </button>
              {open && (
                <div className="mt-0.5 space-y-0.5">
                  {group.items.map((item) => (
                    <ItemLink key={item.to} item={item} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-0.5 border-t border-border px-2 py-2">
        {bottomNav.map((item) => (
          <ItemLink key={item.to} item={item} />
        ))}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "ams-sidebar sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
          collapsed ? "w-[72px]" : "w-[264px]",
        )}
      >
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={onCloseMobile}
            aria-label="Close menu overlay"
          />
          <div className="ams-sidebar absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-sidebar-border bg-sidebar shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
