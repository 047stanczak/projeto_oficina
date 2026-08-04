import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("tag-label", className)}>
      <span className="tag-hole" aria-hidden />
      {children}
    </span>
  );
}
