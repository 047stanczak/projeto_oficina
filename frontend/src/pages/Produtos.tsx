import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Pencil } from "lucide-react";
import { api, type Produto } from "@/lib/api";
import { brl, num } from "@/lib/format";
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

export function Produtos() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => (await api.get<{ products: Produto[] }>("/api/products")).data.products,
  });

  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Produto | null>(null);
  const [preco, setPreco] = useState("");

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

  function openEdit(p: Produto) {
    setEditing(p);
    setPreco(String(p.sale_price ?? ""));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Catálogo"
        title="Produtos em estoque"
        description="Consulte custo, preço praticado e preço sugerido pela regra ativa."
        actions={
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar código ou nome..."
              className="w-64 pl-9"
            />
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
                        <TableCell className="text-right font-mono tabular-nums">{num(p.stock)}</TableCell>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
