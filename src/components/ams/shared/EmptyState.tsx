import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Trophy, Loader2, AlertTriangle } from "lucide-react";

/** Shared empty state — matches the reference bento surface + density. */
export function EmptyState({
  title = "No data yet",
  description = "Once the backend is connected, results will appear here.",
  icon,
  action,
  className,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bento-card flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20",
        className,
      )}
    >
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
        {icon ?? <Trophy className="h-6 w-6" />}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Shared loading state used across every screen. */
export function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bento-card flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20",
        className,
      )}
    >
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/** Shared error state used across every screen. */
export function ErrorState({
  title = "Something went wrong",
  description = "Please retry — if it keeps failing, the module may be temporarily unavailable.",
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bento-card flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20",
        className,
      )}
    >
      <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-destructive/15 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
