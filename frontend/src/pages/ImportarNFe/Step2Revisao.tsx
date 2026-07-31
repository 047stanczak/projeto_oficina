import type { ProdutoExtraido } from "@/lib/api";
import { brl, num } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/States";

export function Step2Revisao({
  produtos,
  onBack,
  onContinue,
}: {
  produtos: ProdutoExtraido[];
  onBack: () => void;
  onContinue: () => void;
}) {
  const total = produtos.reduce((acc, p) => acc + p.new_cost * p.quantity, 0);
  return (
    <div>
      <div className="border-b border-border p-4 text-sm">
        <span className="font-mono uppercase tracking-widest text-[10px] text-muted-foreground">
          Itens extraídos ·
        </span>{" "}
        <span className="font-display font-semibold">{produtos.length}</span>
        <span className="ml-4 font-mono uppercase tracking-widest text-[10px] text-muted-foreground">
          Total ·
        </span>{" "}
        <span className="font-mono">{brl(total)}</span>
      </div>
      {produtos.length === 0 ? (
        <EmptyState title="Nenhum produto na NF-e" />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Custo novo</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.map((p, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell className="font-mono text-xs">{p.code}</TableCell>
                  <TableCell className="max-w-[380px] truncate">{p.name}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{brl(p.new_cost)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{num(p.quantity)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {brl(p.new_cost * p.quantity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <div className="flex items-center justify-between border-t border-border p-4">
        <Button variant="ghost" onClick={onBack}>Voltar</Button>
        <Button onClick={onContinue} disabled={produtos.length === 0}>Continuar</Button>
      </div>
    </div>
  );
}
