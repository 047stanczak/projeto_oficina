import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  FileUp,
  SlidersHorizontal,
  Calculator,
  BarChart3,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/importar", label: "Importar NF-e", icon: FileUp },
  { to: "/regras", label: "Regras de Preço", icon: SlidersHorizontal },
  { to: "/simulador", label: "Simulador", icon: Calculator },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path d="M16 2 30 30H20l-4-9-4 9H2z" fill="currentColor" />
      <path d="M16 13l3.5 7h-7z" fill="var(--sidebar)" />
    </svg>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-6">
      <Mark className="h-8 w-8 shrink-0 text-primary" />
      <div className="min-w-0">
        <div className="font-display text-base font-bold lowercase tracking-tight text-sidebar-foreground">
          molas & cia
        </div>
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-sidebar-foreground/50">
          gestão · v1.0
        </div>
      </div>
    </div>
  );
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-px p-3">
      {NAV.map(({ to, label, icon: Icon, end }, i) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "group flex items-center gap-3 px-3 py-3 text-sm font-medium transition-colors",
              "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              isActive && "bg-sidebar-accent text-primary",
            )
          }
        >
          <span className="w-5 shrink-0 font-mono text-[10px] tracking-widest opacity-50">
            {String(i + 1).padStart(2, "0")}
          </span>
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Footer() {
  return (
    <div className="border-t border-sidebar-border">
      <div className="h-0.5 accent-rule" />
      <div className="px-5 py-4 text-[10px] font-mono uppercase tracking-[0.28em] text-sidebar-foreground/40">
        status: ok · backend on-line
      </div>
    </div>
  );
}

export function AppShell() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const active = NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)));

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 shrink-0 flex-col bg-sidebar border-r border-sidebar-border">
        <Brand />
        <NavItems />
        <Footer />
      </aside>

      {/* Mobile sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="flex h-full flex-col">
            <Brand />
            <NavItems onNavigate={() => setOpen(false)} />
            <Footer />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground">
            <span>Molas & Cia</span>
            <span className="text-primary">/</span>
            <span className="text-foreground">{active?.label ?? "—"}</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] text-muted-foreground">
            <span className="hidden sm:inline-flex h-1.5 w-1.5 bg-primary" />
            <span className="hidden sm:inline">operacional</span>
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
