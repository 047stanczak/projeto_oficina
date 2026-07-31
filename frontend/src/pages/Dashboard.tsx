import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  Coins,
  BadgeDollarSign,
  Percent,
  AlertTriangle,
} from "lucide-react";
import { api, type DashboardData } from "@/lib/api";
import { brl, num, pct } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Kpi } from "@/components/Kpi";
import { LoadingState, ErrorState } from "@/components/States";
import { Button } from "@/components/ui/button";

export function Dashboard() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get<DashboardData>("/api/dashboard")).data,
  });

  return (
    <div>
      <PageHeader
        eyebrow="Visão geral"
        title="Dashboard operacional"
        description="Indicadores financeiros consolidados do estoque atual."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            Atualizar
          </Button>
        }
      />
      <div className="p-6">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : data ? (
          <div className="grid gap-px border border-border bg-border sm:grid-cols-2 xl:grid-cols-3">
            <Kpi label="Valor investido" value={brl(data.invested_value)} icon={Wallet} hint="Custo total em estoque" />
            <Kpi label="Valor potencial de venda" value={brl(data.potential_sale_value)} icon={TrendingUp} />
            <Kpi label="Lucro bruto estimado" value={brl(data.gross_profit_estimate)} icon={Coins} />
            <Kpi label="Lucro líquido estimado" value={brl(data.net_profit_estimate)} icon={BadgeDollarSign} tone="success" hint="Após Simples Nacional" />
            <Kpi label="Rentabilidade estimada" value={pct(data.estimated_profitability_percentage)} icon={Percent} tone="primary" />
            <div className="relative overflow-hidden border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground">
                    Produtos para reajuste
                  </div>
                  <div className="mt-4 font-display text-3xl font-bold leading-none tabular-nums sm:text-4xl">
                    {num(data.products_for_adjustment)}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Itens com preço de venda abaixo do sugerido.
                  </p>
                </div>
                <div className="grid h-9 w-9 shrink-0 place-items-center border border-primary/50 text-primary">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              <Button asChild size="sm" className="mt-5 rounded-none">
                <Link to="/produtos">Revisar produtos</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
