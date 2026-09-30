import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [confirma, setConfirma] = useState("");

  const trocar = useMutation({
    mutationFn: async () =>
      (
        await api.post("/api/me/password", {
          current_password: atual,
          new_password: nova,
        })
      ).data,
    onSuccess: () => {
      toast.success("Senha alterada. Suas outras sessões foram encerradas.");
      setAtual("");
      setNova("");
      setConfirma("");
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao alterar a senha"),
  });

  const valido =
    nova.length >= 10 &&
    nova.length <= 128 &&
    nova === confirma &&
    atual.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar senha</DialogTitle>
          <DialogDescription>
            A nova senha precisa ter entre 10 e 128 caracteres.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="senha-atual">Senha atual</Label>
            <Input
              id="senha-atual"
              type="password"
              autoComplete="current-password"
              value={atual}
              onChange={(e) => setAtual(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="senha-nova">Nova senha</Label>
            <Input
              id="senha-nova"
              type="password"
              autoComplete="new-password"
              value={nova}
              onChange={(e) => setNova(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="senha-confirma">Repita a nova senha</Label>
            <Input
              id="senha-confirma"
              type="password"
              autoComplete="new-password"
              value={confirma}
              onChange={(e) => setConfirma(e.target.value)}
            />
            {confirma && nova !== confirma && (
              <p className="mt-1 text-xs text-destructive">
                As senhas não coincidem.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => trocar.mutate()}
            disabled={!valido || trocar.isPending}
          >
            {trocar.isPending ? "Salvando..." : "Alterar senha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
