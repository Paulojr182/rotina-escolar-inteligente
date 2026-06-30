import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-colegio.png";
import { Lock, User } from "lucide-react";
import { loginFn, getCurrentUserFn } from "@/lib/server-functions";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    if (user) {
      if (user.perfil === "admin") {
        throw redirect({ to: "/admin" });
      } else {
        throw redirect({ to: "/" });
      }
    }
  },
  component: LoginComponent,
});

function LoginComponent() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !senha.trim()) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginFn({ data: { login: login.trim(), senha: senha.trim() } });
      if (res.success) {
        toast.success(`Bem-vindo, ${res.user.nome}!`);
        // Navigate based on profile
        if (res.user.perfil === "admin") {
          navigate({ to: "/admin" });
        } else {
          navigate({ to: "/" });
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <Toaster richColors position="top-center" />
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <img
            src={logo}
            alt="Logo do Colégio Santa Catarina de Juiz de Fora"
            className="h-24 w-24 rounded-2xl bg-white p-2 shadow-md border border-border"
          />
          <h2 className="mt-6 font-display text-3xl font-extrabold tracking-tight text-foreground">
            Rotina de Estudos 2026
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Faça login para acessar o sistema
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="login" className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                E-mail institucional
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="login"
                  name="login"
                  type="text"
                  required
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className="block w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/40"
                  placeholder="seu.email@educscsc-alu.org.br"
                />
              </div>
            </div>

            <div>
              <label htmlFor="senha" className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Senha
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="senha"
                  name="senha"
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="block w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 text-sm placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/40"
                  placeholder="Digite sua senha"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center py-2.5 bg-brand text-brand-foreground hover:bg-brand/90 font-semibold"
              >
                {loading ? "Entrando..." : "Acessar Sistema"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
