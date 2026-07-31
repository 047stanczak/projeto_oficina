import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto h-2 w-32 hazard-tape rounded" />
        <h1 className="mt-6 font-display text-6xl font-bold">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Rota não encontrada. Verifique o endereço ou volte ao dashboard.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Voltar ao dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
