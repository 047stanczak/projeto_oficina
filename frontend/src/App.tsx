import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/lib/auth";
import { RequireAdmin, RequireAuth } from "@/components/RequireAuth";
import { Login } from "@/pages/Login";
import { Usuarios } from "@/pages/Usuarios";
import { Dashboard } from "@/pages/Dashboard";
import { Produtos } from "@/pages/Produtos";
import { ImportarNFe } from "@/pages/ImportarNFe";
import { RegrasPrecificacao } from "@/pages/RegrasPrecificacao";
import { Simulador } from "@/pages/Simulador";
import { Relatorios } from "@/pages/Relatorios";
import { NotFound } from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<RequireAuth />}>
                <Route element={<AppShell />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/produtos" element={<Produtos />} />
                  <Route path="/importar" element={<ImportarNFe />} />
                  <Route path="/regras" element={<RegrasPrecificacao />} />
                  <Route path="/simulador" element={<Simulador />} />
                  <Route path="/relatorios" element={<Relatorios />} />
                  <Route element={<RequireAdmin />}>
                    <Route path="/usuarios" element={<Usuarios />} />
                  </Route>
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
