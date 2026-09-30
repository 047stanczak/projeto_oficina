import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { LoadingState } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <LoadingState />;

  const from =
    typeof (location.state as { from?: unknown } | null)?.from === "string"
      ? (location.state as { from: string }).from
      : "/";
  if (user)
    return (
      <Navigate
        to={from.startsWith("/") && !from.startsWith("//") ? from : "/"}
        replace
      />
    );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(username.trim(), password);
      navigate(from.startsWith("/") && !from.startsWith("//") ? from : "/", {
        replace: true,
      });
    } catch (err: any) {
      toast.error(err?.message ?? "Não foi possível entrar");
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-5 rounded-lg border border-border bg-card p-8"
      >
        <div>
          <div className="font-display text-2xl font-semibold">Molas & Cia</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            gestão de custos
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <Label htmlFor="username">Usuário</Label>
            <Input
              id="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={50}
            />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={128}
            />
          </div>
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={busy || !username.trim() || !password}
        >
          {busy ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
