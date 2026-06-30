import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import {
  getCurrentUserFn,
  getAdministradoresFn,
  saveAdministradorFn,
  deleteAdministradorFn,
  SessionUser,
} from "@/lib/server-functions";
import { Edit2, Trash2, UserPlus, Settings, Mail, Key, User } from "lucide-react";

export const Route = createFileRoute("/admin/configuracao")({
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    if (!user || user.perfil !== "admin") {
      throw redirect({ to: "/login" });
    }
    return { user };
  },
  component: GerenciarConfiguracao,
});

function GerenciarConfiguracao() {
  const { user } = Route.useRouteContext() as { user: SessionUser };
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);

  // Form states
  const [nome, setNome] = useState("");
  const [loginOffice, setLoginOffice] = useState("");
  const [senha, setSenha] = useState("");

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const res = await getAdministradoresFn();
      setAdmins(res);
    } catch (err: any) {
      toast.error("Erro ao carregar administradores: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleOpenCreate = () => {
    setEditingAdmin(null);
    setNome("");
    setLoginOffice("");
    setSenha("");
    setModalOpen(true);
  };

  const handleOpenEdit = (admin: any) => {
    setEditingAdmin(admin);
    setNome(admin.nome);
    setLoginOffice(admin.login_office365);
    setSenha(admin.senha);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !loginOffice.trim() || !senha.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      const res = await saveAdministradorFn({
        data: {
          id: editingAdmin ? editingAdmin.id : null,
          nome: nome.trim(),
          loginOffice: loginOffice.trim().toLowerCase(),
          senha: senha.trim(),
        },
      });

      if (res.success) {
        toast.success(
          editingAdmin ? "Administrador atualizado com sucesso!" : "Administrador cadastrado com sucesso!"
        );
        setModalOpen(false);
        loadAdmins();
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar administrador.");
    }
  };

  const handleDelete = async (id: number) => {
    if (id === user.id) {
      toast.error("Você não pode excluir o seu próprio usuário administrador.");
      return;
    }

    if (!confirm("Tem certeza que deseja excluir este administrador?")) {
      return;
    }

    try {
      const res = await deleteAdministradorFn({ data: { id } });
      if (res.success) {
        toast.success("Administrador excluído com sucesso!");
        loadAdmins();
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir administrador.");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <Toaster richColors position="top-center" />
      <AdminHeader currentTab="configuracao" userName={user.nome} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl flex items-center gap-2">
              <Settings className="h-7 w-7 text-primary" />
              Configurações do Sistema
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre, edite e gerencie as credenciais de acesso dos administradores e orientadores
            </p>
          </div>

          <Button onClick={handleOpenCreate} className="flex items-center gap-2 cursor-pointer self-start sm:self-center">
            <UserPlus className="h-4 w-4" />
            Adicionar Administrador
          </Button>
        </div>

        {/* Administrators Table */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">E-mail / Login</th>
                  <th className="px-6 py-4">Senha</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground animate-pulse">
                      Carregando administradores...
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      Nenhum administrador cadastrado.
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {admin.nome}
                        {admin.id === user.id && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                            Você
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        {admin.login_office365}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-xs select-none">
                        ••••••••
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(admin)}
                            className="p-1.5 text-success hover:bg-success/10 rounded-md transition-colors"
                            title="Editar Administrador"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(admin.id)}
                            disabled={admin.id === user.id}
                            className={`p-1.5 rounded-md transition-colors ${
                              admin.id === user.id
                                ? "text-muted-foreground/45 cursor-not-allowed"
                                : "text-destructive hover:bg-destructive/10"
                            }`}
                            title={admin.id === user.id ? "Você não pode se excluir" : "Excluir Administrador"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Modal CRUD */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-display text-lg font-bold text-foreground mb-4">
              {editingAdmin ? "Editar Administrador" : "Adicionar Novo Administrador"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" /> Nome
                </span>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome completo do administrador"
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" /> E-mail / Login Office
                </span>
                <input
                  type="email"
                  required
                  value={loginOffice}
                  onChange={(e) => setLoginOffice(e.target.value)}
                  placeholder="exemplo@redesc-alu.org.br"
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Key className="h-3 w-3" /> Senha
                </span>
                <input
                  type="text"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Defina a senha de acesso"
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="cursor-pointer">
                  Cancelar
                </Button>
                <Button type="submit" className="cursor-pointer">
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
