import type { ReactNode } from "react";
import { Tag } from "@/components/Tag";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="border-b border-border bg-card">
      <div className="stitch-line h-px w-full" />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 px-6 py-8">
        <div className="min-w-0">
          {eyebrow && <Tag className="mb-3">{eyebrow}</Tag>}
          <h1 className="truncate font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
