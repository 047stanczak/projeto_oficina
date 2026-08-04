import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/Tag";

export function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <Tag className="mx-auto">peça não encontrada</Tag>
        <h1 className="mt-6 font-display text-6xl font-semibold">404</h1>
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
