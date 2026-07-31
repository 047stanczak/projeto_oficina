import type { ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type HistoricoCompra, type HistoricoPreco, type AumentoCusto } from "@/lib/api";
import { brl, dateBR, num, pct } from "@/lib/format";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { LoadingState, ErrorState, EmptyState } from "@/components/States";

function useRelatorio<T>(key: string, url: string, prop: string) {
  return useQuery({
    queryKey: ["relatorios", key],
    queryFn: async () => {
      const { data } = await api.get<Record<string, T[]>>(url);
      return (data[prop] ?? []) as T[];
    },
  });
}

function Wrap({ q, children, empty }: { q: any; children: (rows: any[]) => ReactElement; empty: string }) {
  if (q.isLoading) return <LoadingState />;
  if (q.error) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (!q.data || q.data.length === 0) return <EmptyState title={empty} />;
  return children(q.data);
}

export function Relatorios() {
  const compras = useRelatorio<HistoricoCompra>("compras", "/api/reports/purchase-history", "history");
  const precos = useRelatorio<HistoricoPreco>("precos", "/api/reports/price-history", "history");
  const aumento = useRelatorio<AumentoCusto>("aumento", "/api/reports/highest-cost-increase", "products");

  return (
    <div>
      <PageHeader
        eyebrow="Análises"
        title="Relatórios"
        description="Movimentações de custo, alterações de preço e ranking de aumentos."
      />
      <div className="p-6">
        <Tabs defaultValue="compras">
          <TabsList>
            <TabsTrigger value="compras">Histórico de compras</TabsTrigger>
            <TabsTrigger value="precos">Alterações de preço</TabsTrigger>
            <TabsTrigger value="aumento">Maior aumento de custo</TabsTrigger>
          </TabsList>

          <TabsContent value="compras" className="mt-4">
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <Wrap q={compras} empty="Sem histórico de compras">
                {(rows: HistoricoCompra[]) => (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead>Data</TableHead>
                          <TableHead>Código</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead className="text-right">Custo antigo</TableHead>
                          <TableHead className="text-right">Custo novo</TableHead>
                          <TableHead className="text-right">Qtd.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((r) => (
                          <TableRow key={r.id} className="border-border">
                            <TableCell className="font-mono text-xs">{dateBR(r.date)}</TableCell>
                            <TableCell className="font-mono text-xs">{r.code}</TableCell>
                            <TableCell className="max-w-[320px] truncate">{r.name}</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{brl(r.old_cost)}</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{brl(r.new_cost)}</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{num(r.quantity)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Wrap>
            </div>
          </TabsContent>

          <TabsContent value="precos" className="mt-4">
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <Wrap q={precos} empty="Sem alterações de preço">
                {(rows: HistoricoPreco[]) => (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead>Data</TableHead>
                          <TableHead>Código</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead className="text-right">Preço antigo</TableHead>
                          <TableHead className="text-right">Preço novo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((r) => (
                          <TableRow key={r.id} className="border-border">
                            <TableCell className="font-mono text-xs">{dateBR(r.date)}</TableCell>
                            <TableCell className="font-mono text-xs">{r.code}</TableCell>
                            <TableCell className="max-w-[320px] truncate">{r.name}</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{brl(r.old_price)}</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{brl(r.new_price)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Wrap>
            </div>
          </TabsContent>

          <TabsContent value="aumento" className="mt-4">
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <Wrap q={aumento} empty="Sem dados de aumento">
                {(rows: AumentoCusto[]) => (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead>Código</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead className="text-right">Custo antigo</TableHead>
                          <TableHead className="text-right">Custo novo</TableHead>
                          <TableHead className="text-right">Aumento</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((r, i) => (
                          <TableRow key={`${r.code}-${i}`} className="border-border">
                            <TableCell className="font-mono text-xs">{r.code}</TableCell>
                            <TableCell className="max-w-[320px] truncate">{r.name}</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{brl(r.old_cost)}</TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{brl(r.new_cost)}</TableCell>
                            <TableCell className="text-right font-mono tabular-nums text-accent">
                              {pct(r.increase)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Wrap>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
