import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BadgeDollarSign, Coins, Percent, TrendingUp, Wallet, Calculator,
} from "lucide-react";
import { api, type SimuladorData } from "@/lib/api";
import { brl, pct } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Kpi } from "@/components/Kpi";
import { Badge } from "@/components/ui/badge";

export function Simulador() {
  const [margem, setMargem] = useState("");
  const [imposto, setImposto] = useState("");
  const sim = useMutation({
    mutationFn: async () =>
      (
        await api.post<SimuladorData>("/api/simulator", {
          margin_percentage: Number(margem),
          tax_percentage: Number(imposto),
        })
      ).data,
    onError: (e: any) => toast.error(e?.message ?? "Falha na simulação"),
  });

  return (
    <div>
      <PageHeader
        eyebrow="What-if"
        title="Simulador financeiro"
        description="Projete indicadores com margem e Simples Nacional hipotéticos, sem alterar dados reais."
      />
      <div className="space-y-6 p-6">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <Label htmlFor="s-margem">Margem (%)</Label>
              <Input id="s-margem" type="number" step="0.01" value={margem} onChange={(e) => setMargem(e.target.value)} className="font-mono" placeholder="ex.: 100" />
            </div>
            <div>
              <Label htmlFor="s-imposto">Simples Nacional (%)</Label>
              <Input id="s-imposto" type="number" step="0.01" value={imposto} onChange={(e) => setImposto(e.target.value)} className="font-mono" placeholder="ex.: 6" />
            </div>
            <Button
              onClick={() => sim.mutate()}
              disabled={sim.isPending || !margem || !imposto}
              className="sm:w-auto"
            >
              <Calculator className="mr-1 h-4 w-4" />
              {sim.isPending ? "Simulando..." : "Simular"}
            </Button>
          </div>
        </div>

        {sim.data && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary hover:bg-primary/20">Simulação</Badge>
              <span className="text-xs text-muted-foreground">
                Margem {pct(Number(margem))} · Simples {pct(Number(imposto))}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <Kpi label="Valor investido" value={brl(sim.data.invested_value)} icon={Wallet} />
              <Kpi label="Valor potencial de venda" value={brl(sim.data.potential_sale_value)} icon={TrendingUp} />
              <Kpi label="Lucro bruto estimado" value={brl(sim.data.gross_profit_estimate)} icon={Coins} />
              <Kpi label="Lucro líquido estimado" value={brl(sim.data.net_profit_estimate)} icon={BadgeDollarSign} tone="success" />
              <Kpi label="Rentabilidade estimada" value={pct(sim.data.estimated_profitability_percentage)} icon={Percent} tone="primary" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
