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
import { Tag } from "@/components/Tag";

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
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M11 20 16 10l5 10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-6">
      <Mark className="h-7 w-7 shrink-0 text-sidebar-primary" />
      <div className="min-w-0">
        <div className="font-display text-lg font-semibold text-sidebar-foreground">
          Molas & Cia
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/50">
          gestão de custos
        </div>
      </div>
    </div>
  );
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-px p-3">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              isActive && "bg-sidebar-accent text-sidebar-primary",
            )
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function Footer() {
  return (
    <div className="border-t border-sidebar-border px-5 py-4">
      <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/40">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sidebar-primary" />
        sistema on-line
      </span>
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
          <Tag>{active?.label ?? "—"}</Tag>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
