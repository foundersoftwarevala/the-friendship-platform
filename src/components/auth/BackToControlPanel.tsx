import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

/**
 * One "Back to Control Panel" affordance for every gated module.
 *
 * Modules with the shared sidebar render the button inside the sidebar, above
 * the module search box. Every other gated module gets a fixed chip in the
 * same top-left spot instead. The registry context keeps both from showing at
 * once: the sidebar registers itself on mount, and the floating chip stays
 * hidden while a sidebar is present.
 */
const SidebarBackContext = createContext<{ register: () => void; unregister: () => void } | null>(
  null,
);

export function SidebarBackProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  return (
    <SidebarBackContext.Provider
      value={{
        register: () => setCount((c) => c + 1),
        unregister: () => setCount((c) => Math.max(0, c - 1)),
      }}
    >
      {children}
      {count === 0 && <FloatingBackChip />}
    </SidebarBackContext.Provider>
  );
}

/** Call once in the shared sidebar; the floating chip hides while mounted. */
export function useRegisterSidebarBack() {
  const ctx = useContext(SidebarBackContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.register();
    return () => ctx.unregister();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function FloatingBackChip() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/control-panel" || pathname.startsWith("/control-panel/")) return null;
  return (
    <Link
      to="/control-panel"
      aria-label="Back to Control Panel"
      className="fixed left-3 top-[4.75rem] z-[60] inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-background/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-md backdrop-blur-md transition-all hover:-translate-x-0.5 hover:bg-primary/15 hover:shadow-lg"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to Control Panel
    </Link>
  );
}
