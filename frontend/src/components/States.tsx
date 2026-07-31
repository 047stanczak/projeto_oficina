import type { ReactNode } from "react";
import { Loader2, AlertTriangle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 p-12 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-md border border-dashed border-border text-muted-foreground">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <div className="mt-4 font-display font-semibold">{title}</div>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const msg = error instanceof Error ? error.message : "Erro inesperado";
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-md bg-destructive/15 text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="font-display font-semibold">Falha ao carregar</div>
      <div className="max-w-md text-sm text-muted-foreground">{msg}</div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
