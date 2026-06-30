import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import logo from "@/assets/logo-colegio.png";
import { LayoutDashboard, Users, FileSpreadsheet, LogOut, Settings } from "lucide-react";
import { logoutFn } from "@/lib/server-functions";

interface AdminHeaderProps {
  currentTab: "dashboard" | "alunos" | "importar" | "configuracao";
  userName?: string;
}

export function AdminHeader({ currentTab, userName }: AdminHeaderProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutFn();
      toast.success("Logout realizado com sucesso.");
      navigate({ to: "/login" });
    } catch {
      toast.error("Erro ao sair do sistema.");
    }
  };

  return (
    <header className="no-print border-b border-border bg-card shadow-[var(--shadow-card)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Logo Colégio"
              className="h-10 w-10 rounded-lg bg-white p-1 border border-border"
            />
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Painel Administrativo
              </span>
              <span className="font-display text-base font-bold text-foreground">
                Rotina de Estudos 2026
              </span>
            </div>
          </div>

          <nav className="flex space-x-1 sm:space-x-4">
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${
                currentTab === "dashboard"
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <Link
              to="/admin/alunos"
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${
                currentTab === "alunos"
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Estudantes</span>
            </Link>

            <Link
              to="/admin/importar"
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${
                currentTab === "importar"
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Importar</span>
            </Link>

            <Link
              to="/admin/configuracao"
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${
                currentTab === "configuracao"
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configuração</span>
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-xs text-muted-foreground">
              Logado como: <strong className="text-foreground">{userName || "Admin"}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-destructive border border-destructive/20 hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
