import { useState } from "react";
import type { ProdutoExtraido } from "@/lib/api";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { brl } from "@/lib/format";

export function Step3Confirmacao({
  produtos,
  onBack,
  onConfirm,
  isSubmitting,
}: {
  produtos: ProdutoExtraido[];
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}) {
  const [open, setOpen] = useState(false);
  const total = produtos.reduce((acc, p) => acc + p.new_cost * p.quantity, 0);
  return (
    <div className="p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-border bg-background p-4">
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Itens</div>
          <div className="mt-1 font-display text-2xl font-bold tabular-nums">{produtos.length}</div>
        </div>
        <div className="rounded-md border border-border bg-background p-4">
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Valor total</div>
          <div className="mt-1 font-display text-2xl font-bold tabular-nums">{brl(total)}</div>
        </div>
        <div className="rounded-md border border-accent/50 bg-background p-4">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-accent">
            <AlertTriangle className="h-3.5 w-3.5" /> Ação irreversível
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Custos e estoque dos produtos serão atualizados no banco.
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} disabled={isSubmitting}>Voltar</Button>
        <Button onClick={() => setOpen(true)} disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Atualizando...</>
          ) : (
            <><Check className="mr-2 h-4 w-4" /> Confirmar atualização</>
          )}
        </Button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar atualização de custos?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso atualizará o custo e estoque de {produtos.length} produto(s).
              Movimentações registradas no histórico de compras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setOpen(false);
                onConfirm();
              }}
            >
              Sim, atualizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
