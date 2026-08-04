import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "accent" | "success";
}) {
  const surface =
    tone === "primary"
      ? "border-primary bg-primary text-primary-foreground"
      : tone === "accent"
      ? "border-accent bg-accent text-accent-foreground"
      : "border-border bg-card text-card-foreground";
  const labelTone = tone === "default" || tone === "success" ? "text-muted-foreground" : "opacity-75";
  const iconTone =
    tone === "default"
      ? "border-border text-muted-foreground"
      : tone === "success"
      ? "border-success/40 text-success"
      : "border-current/30 text-current";

  return (
    <div className={cn("rounded-lg border p-6 transition-colors", surface)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cn("font-mono text-[11px] uppercase tracking-[0.14em]", labelTone)}>
            {label}
          </div>
          <div className="mt-3 font-display text-3xl font-semibold leading-none tabular-nums sm:text-4xl">
            {value}
          </div>
          {hint && <div className={cn("mt-3 text-xs", labelTone)}>{hint}</div>}
        </div>
        {Icon && (
          <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full border", iconTone)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}
