import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Pencil, Settings2, Sparkles, Info, ExternalLink } from "lucide-react";
import { api, type Produto, type MarketQueryResult } from "@/lib/api";
import { brl, num, dateBR } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { LoadingState, ErrorState, EmptyState } from "@/components/States";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function Produtos() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => (await api.get<{ products: Produto[] }>("/api/products")).data.products,
  });

  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Produto | null>(null);
  const [preco, setPreco] = useState("");
  const [minimo, setMinimo] = useState("");
  const [globalOpen, setGlobalOpen] = useState(false);
  const [minimoGlobal, setMinimoGlobal] = useState("");

  const estoqueGlobalQ = useQuery({
    queryKey: ["estoque-global"],
    queryFn: async () => (await api.get<{ global_min_stock: number }>("/api/stock-settings")).data,
  });

  const historicoIAQ = useQuery({
    queryKey: ["market-price-history", editing?.id],
    queryFn: async () =>
      (await api.get<{ history: MarketQueryResult[] }>(`/api/products/${editing!.id}/market-price`)).data.history,
    enabled: !!editing,
  });

  const iaMutation = useMutation({
    mutationFn: async (id: number) =>
      (await api.post<MarketQueryResult>(`/api/products/${id}/market-price`)).data,
    onSuccess: () => {
      toast.success("Preço médio consultado");
      qc.invalidateQueries({ queryKey: ["market-price-history", editing?.id] });
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.error ?? e?.message ?? "Erro ao consultar IA"),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter(
      (p) => p.code.toLowerCase().includes(s) || p.name.toLowerCase().includes(s),
    );
  }, [data, q]);

  const mutation = useMutation({
    mutationFn: async ({ id, preco_venda }: { id: number; preco_venda: number }) =>
      (await api.post(`/api/products/${id}/price`, { sale_price: preco_venda })).data,
    onSuccess: () => {
      toast.success("Preço atualizado");
      qc.invalidateQueries({ queryKey: ["produtos"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar"),
  });

  const estoqueMutation = useMutation({
    mutationFn: async ({ id, min_stock }: { id: number; min_stock: number | null }) =>
      (await api.post(`/api/products/${id}/min-stock`, { min_stock })).data,
    onSuccess: () => {
      toast.success("Estoque mínimo atualizado");
      qc.invalidateQueries({ queryKey: ["produtos"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar"),
  });

  const globalMutation = useMutation({
    mutationFn: async (global_min_stock: number) =>
      (await api.post("/api/stock-settings", { global_min_stock })).data,
    onSuccess: () => {
      toast.success("Estoque mínimo global atualizado");
      qc.invalidateQueries({ queryKey: ["produtos"] });
      qc.invalidateQueries({ queryKey: ["estoque-global"] });
      setGlobalOpen(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar"),
  });

  function openEdit(p: Produto) {
    setEditing(p);
    setPreco(String(p.sale_price ?? ""));
    setMinimo(p.min_stock == null ? "" : String(p.min_stock));
  }

  function openGlobal() {
    setMinimoGlobal(String(estoqueGlobalQ.data?.global_min_stock ?? 0));
    setGlobalOpen(true);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Catálogo"
        title="Produtos em estoque"
        description="Consulte custo, preço praticado e preço sugerido pela regra ativa."
        actions={
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" onClick={openGlobal}>
                <Settings2 className="mr-1 h-4 w-4" /> Estoque global
              </Button>
            )}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar código ou nome..."
                className="w-64 pl-9"
              />
            </div>
          </div>
        }
      />
      <div className="p-6">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} onRetry={() => refetch()} />
          ) : filtered.length === 0 ? (
            <EmptyState title="Nenhum produto encontrado" description="Ajuste a busca ou importe uma NF-e." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="w-[140px]">Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Preço venda</TableHead>
                    <TableHead className="text-right">Preço sugerido</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const abaixo =
                      p.suggested_price != null && p.sale_price < p.suggested_price;
                    return (
                      <TableRow key={p.id} className="border-border">
                        <TableCell className="font-mono text-xs">{p.code}</TableCell>
                        <TableCell className="max-w-[380px] truncate">{p.name}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">{brl(p.current_cost)}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          <div className="flex items-center justify-end gap-2">
                            {brl(p.sale_price)}
                            {abaixo && <Badge variant="destructive" className="text-[10px]">reajustar</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums text-primary">
                          {p.suggested_price == null ? (
                            <span className="text-muted-foreground" title="Sem regra cadastrada">—</span>
                          ) : (
                            brl(p.suggested_price)
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          <div className="flex items-center justify-end gap-2">
                            {num(p.stock)}
                            {p.is_low_stock && <Badge variant="destructive" className="text-[10px]">baixo</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {num(p.effective_min_stock)}
                          {p.min_stock == null && <span className="ml-1 text-[10px] text-muted-foreground">global</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                            <Pencil className="mr-1 h-3.5 w-3.5" /> Preço
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar preço de venda</DialogTitle>
            <DialogDescription>
              {editing && (
                <span className="font-mono text-xs">
                  {editing.code} · {editing.name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[10px] font-mono uppercase text-muted-foreground">Custo atual</div>
                <div className="font-mono">{editing && brl(editing.current_cost)}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-muted-foreground">Preço sugerido</div>
                <div className="font-mono text-primary">{editing && brl(editing.suggested_price)}</div>
              </div>
            </div>
            <div>
              <Label htmlFor="preco">Novo preço de venda (R$)</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                className="font-mono"
              />
            </div>
            <div>
              <Label htmlFor="minimo">Estoque mínimo</Label>
              <Input id="minimo" type="number" min="0" step="1" value={minimo} onChange={(e) => setMinimo(e.target.value)} placeholder={`Global: ${estoqueGlobalQ.data?.global_min_stock ?? 0}`} className="font-mono" />
              <p className="mt-1 text-xs text-muted-foreground">Deixe vazio para usar o padrão global.</p>
            </div>

            <div className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">Preço médio de mercado (IA)</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Usa a IA do Google (Gemini) para pesquisar na web uma faixa de
                      preço praticada no mercado para este produto.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => editing && iaMutation.mutate(editing.id)}
                  disabled={iaMutation.isPending}
                >
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  {iaMutation.isPending ? "Pesquisando..." : "Pesquisar"}
                </Button>
              </div>

              <div className="mt-3 max-h-48 space-y-3 overflow-y-auto">
                {iaMutation.isPending && <LoadingState label="Consultando IA..." />}
                {historicoIAQ.isLoading && !iaMutation.isPending && (
                  <LoadingState label="Carregando histórico..." />
                )}
                {historicoIAQ.error && !iaMutation.isPending && (
                  <ErrorState error={historicoIAQ.error} onRetry={() => historicoIAQ.refetch()} />
                )}
                {historicoIAQ.data?.length === 0 && !iaMutation.isPending && (
                  <p className="text-xs text-muted-foreground">
                    Nenhuma consulta realizada ainda para este produto.
                  </p>
                )}
                {historicoIAQ.data?.map((h) => (
                  <div key={h.id} className="rounded-md bg-muted/50 p-2.5 text-xs">
                    <div className="mb-1 text-[10px] text-muted-foreground">{dateBR(h.date)}</div>
                    <p className="whitespace-pre-wrap text-foreground">{h.response}</p>
                    {h.sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {h.sources.map((s, i) =>
                          s.url ? (
                            <a
                              key={i}
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {s.title || "fonte"}
                            </a>
                          ) : null,
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button
              onClick={() =>
                editing &&
                mutation.mutate({ id: editing.id, preco_venda: Number(preco) })
              }
              disabled={mutation.isPending || !preco || Number.isNaN(Number(preco))}
            >
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
            <Button
              variant="outline"
              onClick={() => editing && estoqueMutation.mutate({ id: editing.id, min_stock: minimo === "" ? null : Number(minimo) })}
              disabled={estoqueMutation.isPending || (minimo !== "" && (!Number.isInteger(Number(minimo)) || Number(minimo) < 0))}
            >
              {estoqueMutation.isPending ? "Salvando..." : "Salvar mínimo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={globalOpen} onOpenChange={setGlobalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estoque mínimo global</DialogTitle>
            <DialogDescription>Usado pelos produtos que não possuem um limite próprio.</DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="minimo-global">Quantidade mínima</Label>
            <Input id="minimo-global" type="number" min="0" step="1" value={minimoGlobal} onChange={(e) => setMinimoGlobal(e.target.value)} className="font-mono" />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setGlobalOpen(false)}>Cancelar</Button>
            <Button onClick={() => globalMutation.mutate(Number(minimoGlobal))} disabled={globalMutation.isPending || !Number.isInteger(Number(minimoGlobal)) || Number(minimoGlobal) < 0}>
              {globalMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}