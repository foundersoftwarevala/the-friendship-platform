import { ROLES, type RoleSlug } from "@/lib/ams/roles";
import { Button } from "@/components/ui/button";

export type RoleFilterValue = RoleSlug | "all";

export function RoleFilter({
  value,
  onChange,
  accent,
}: {
  value: RoleFilterValue;
  onChange: (v: RoleFilterValue) => void;
  accent?: string;
}) {
  const items: { key: RoleFilterValue; label: string; hue?: string; glyph: string }[] = [
    { key: "all", label: "All Roles", hue: accent, glyph: "★" },
    ...ROLES.map((r) => ({ key: r.slug as RoleFilterValue, label: r.name, hue: r.accent, glyph: r.glyph })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/60 bg-muted/20 p-1.5">
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Button
            key={it.key}
            type="button"
            onClick={() => onChange(it.key)}
            variant={active ? "default" : "outline"}
            size="sm"
            aria-pressed={active}
            className="h-8 gap-1.5 rounded-md px-2.5 text-[11px] tracking-wide"
          >
            <span className="text-sm leading-none" style={active || !it.hue ? undefined : { color: it.hue }}>{it.glyph}</span>
            {it.label}
          </Button>
        );
      })}
    </div>
  );
}
