import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, UserPlus } from "lucide-react";
import { api, type Perfil, type Usuario } from "@/lib/api";
import { dateBR } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingState, ErrorState } from "@/components/States";

const PERFIL_LABEL: Record<Perfil, string> = {
  admin: "Administrador",
  member: "Membro",
};

export function Usuarios() {
  const qc = useQueryClient();
  const { user: eu } = useAuth();
  const usuariosQ = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () =>
      (await api.get<{ users: Usuario[] }>("/api/users")).data.users,
  });

  // create
  const [novoOpen, setNovoOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<Perfil>("member");

  const criar = useMutation({
    mutationFn: async () =>
      (
        await api.post("/api/users", {
          username: nome,
          password: senha,
          role: perfil,
        })
      ).data,
    onSuccess: () => {
      toast.success("Usuário criado");
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      setNovoOpen(false);
      setNome("");
      setSenha("");
      setPerfil("member");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao criar usuário"),
  });

  // edit
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [editPerfil, setEditPerfil] = useState<Perfil>("member");
  const [editAtivo, setEditAtivo] = useState(true);
  const [editSenha, setEditSenha] = useState("");

  function openEdit(u: Usuario) {
    setEditing(u);
    setEditPerfil(u.role);
    setEditAtivo(u.active);
    setEditSenha("");
  }

  const salvar = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const body: Record<string, unknown> = {};
      if (editPerfil !== editing.role) body.role = editPerfil;
      if (editAtivo !== editing.active) body.active = editAtivo;
      if (editSenha) body.password = editSenha;
      return (await api.patch(`/api/users/${editing.id}`, body)).data;
    },
    onSuccess: () => {
      toast.success("Usuário atualizado");
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao atualizar usuário"),
  });

  const mudou =
    editing != null &&
    (editPerfil !== editing.role ||
      editAtivo !== editing.active ||
      editSenha.length > 0);
  const senhaOk =
    editSenha.length === 0 ||
    (editSenha.length >= 10 && editSenha.length <= 128);

  return (
    <div>
      <PageHeader
        eyebrow="Administração"
        title="Usuários"
        description="Somente administradores criam contas. Contas desativadas perdem o acesso imediatamente."
        actions={
          <Button onClick={() => setNovoOpen(true)}>
            <UserPlus className="mr-1 h-4 w-4" /> Novo usuário
          </Button>
        }
      />
      <div className="p-6">
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {usuariosQ.isLoading ? (
            <LoadingState />
          ) : usuariosQ.error ? (
            <ErrorState
              error={usuariosQ.error}
              onRetry={() => usuariosQ.refetch()}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Usuário</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuariosQ.data?.map((u) => (
                  <TableRow key={u.id} className="border-border">
                    <TableCell className="font-mono">
                      {u.username}
                      {u.id === eu?.id && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (você)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.role === "admin" ? (
                        <Badge className="bg-primary/20 text-primary hover:bg-primary/20">
                          {PERFIL_LABEL.admin}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{PERFIL_LABEL.member}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.active ? (
                        <Badge variant="outline">Ativo</Badge>
                      ) : (
                        <Badge variant="destructive">Desativado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.created_at ? dateBR(u.created_at) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {u.id !== eu?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(u)}
                          aria-label={`Editar ${u.username}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
            <DialogDescription>
              Informe uma senha inicial (10 a 128 caracteres) e repasse ao
              usuário, que pode trocá-la depois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="novo-nome">Usuário</Label>
              <Input
                id="novo-nome"
                autoComplete="off"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={50}
                className="font-mono"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                3 a 50 caracteres: letras, números, ponto, hífen ou sublinhado.
              </p>
            </div>
            <div>
              <Label htmlFor="novo-senha">Senha inicial</Label>
              <Input
                id="novo-senha"
                type="password"
                autoComplete="new-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                maxLength={128}
              />
            </div>
            <div>
              <Label>Perfil</Label>
              <Select
                value={perfil}
                onValueChange={(v) => setPerfil(v as Perfil)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">{PERFIL_LABEL.member}</SelectItem>
                  <SelectItem value="admin">{PERFIL_LABEL.admin}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNovoOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => criar.mutate()}
              disabled={
                criar.isPending || nome.trim().length < 3 || senha.length < 10
              }
            >
              {criar.isPending ? "Criando..." : "Criar usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editing != null}
        onOpenChange={(v) => !v && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar {editing?.username}</DialogTitle>
            <DialogDescription>
              Alterar a senha encerra todas as sessões abertas desse usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Perfil</Label>
              <Select
                value={editPerfil}
                onValueChange={(v) => setEditPerfil(v as Perfil)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">{PERFIL_LABEL.member}</SelectItem>
                  <SelectItem value="admin">{PERFIL_LABEL.admin}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-ativo">Conta ativa</Label>
              <Switch
                id="edit-ativo"
                checked={editAtivo}
                onCheckedChange={setEditAtivo}
              />
            </div>
            <div>
              <Label htmlFor="edit-senha">Redefinir senha (opcional)</Label>
              <Input
                id="edit-senha"
                type="password"
                autoComplete="new-password"
                value={editSenha}
                onChange={(e) => setEditSenha(e.target.value)}
                maxLength={128}
              />
              {!senhaOk && (
                <p className="mt-1 text-xs text-destructive">
                  A senha precisa ter entre 10 e 128 caracteres.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => salvar.mutate()}
              disabled={salvar.isPending || !mudou || !senhaOk}
            >
              {salvar.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
