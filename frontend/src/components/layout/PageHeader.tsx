import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  index,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  index?: string;
}) {
  return (
    <div className="relative overflow-hidden border-b border-border">
      <div className="h-0.5 accent-rule" />
      <div className="relative grid-lines">
        <span
          aria-hidden
          className="ghost-title pointer-events-none absolute -right-2 top-1/2 hidden -translate-y-1/2 select-none text-[5rem] leading-none lg:block"
        >
          {title.split(" ")[0]}
        </span>
        <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 px-6 py-10">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.28em]">
              <span className="text-primary">{index ?? "01"}</span>
              {eyebrow && <span className="text-muted-foreground">{eyebrow}</span>}
            </div>
            <h1 className="truncate font-display text-3xl font-bold leading-[1.05] sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            {description && (
              <p className="mt-3 max-w-xl text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
