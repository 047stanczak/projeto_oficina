import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { api, type Produto, type Regra } from "@/lib/api";
import { pct } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { LoadingState, ErrorState, EmptyState } from "@/components/States";

export function RegrasPrecificacao() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const regrasQ = useQuery({
    queryKey: ["regras"],
    queryFn: async () => (await api.get<{ rules: Regra[] }>("/api/pricing-rules")).data.rules,
  });
  const produtosQ = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => (await api.get<{ products: Produto[] }>("/api/products")).data.products,
  });

  const [open, setOpen] = useState(false);
  const [produtoId, setProdutoId] = useState<string>("global");
  const [margem, setMargem] = useState("");
  const [imposto, setImposto] = useState("");

  const criar = useMutation({
    mutationFn: async () =>
      (
        await api.post("/api/pricing-rules", {
          product_id: produtoId === "global" ? null : Number(produtoId),
          margin_percentage: Number(margem),
          tax_percentage: Number(imposto),
        })
      ).data,
    onSuccess: () => {
      toast.success("Regra salva");
      qc.invalidateQueries({ queryKey: ["regras"] });
      qc.invalidateQueries({ queryKey: ["produtos"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
      setProdutoId("global");
      setMargem("");
      setImposto("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar"),
  });

  return (
    <div>
      <PageHeader
        eyebrow="Precificação"
        title="Regras de Precificação"
        description="Regra global (padrão) e overrides por produto. Fórmula: custo × (1 + margem%) ÷ (1 − Simples%)."
        actions={
          isAdmin ? (
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Nova regra
            </Button>
          ) : undefined
        }
      />
      <div className="p-6">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {regrasQ.isLoading ? (
            <LoadingState />
          ) : regrasQ.error ? (
            <ErrorState error={regrasQ.error} onRetry={() => regrasQ.refetch()} />
          ) : !regrasQ.data || regrasQ.data.length === 0 ? (
            <EmptyState title="Nenhuma regra cadastrada" description="Crie uma regra global para começar." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Escopo</TableHead>
                  <TableHead className="text-right">Margem</TableHead>
                  <TableHead className="text-right">Simples Nacional</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regrasQ.data.map((r) => (
                  <TableRow key={r.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {r.product_id == null ? (
                          <Badge className="bg-primary/20 text-primary hover:bg-primary/20">Global</Badge>
                        ) : (
                          <Badge variant="outline">Produto</Badge>
                        )}
                        <span className="truncate">{r.product_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{pct(r.margin_percentage)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{pct(r.tax_percentage)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova regra de precificação</DialogTitle>
            <DialogDescription>
              Deixe o produto vazio para criar/atualizar a regra global.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Produto</Label>
              <Select value={produtoId} onValueChange={setProdutoId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Regra global (padrão)</SelectItem>
                  {produtosQ.data?.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.code} · {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="margem">Margem (%)</Label>
                <Input id="margem" type="number" step="0.01" value={margem} onChange={(e) => setMargem(e.target.value)} className="font-mono" />
              </div>
              <div>
                <Label htmlFor="imposto">Simples Nacional (%)</Label>
                <Input id="imposto" type="number" step="0.01" value={imposto} onChange={(e) => setImposto(e.target.value)} className="font-mono" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => criar.mutate()}
              disabled={criar.isPending || !margem || !imposto}
            >
              {criar.isPending ? "Salvando..." : "Salvar regra"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
