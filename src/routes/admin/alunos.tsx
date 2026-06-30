import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { ScheduleTable } from "@/components/rotina/ScheduleTable";
import { Legend } from "@/components/rotina/Legend";
import {
  getCurrentUserFn,
  getEstudantesFn,
  editEstudanteFn,
  deleteEstudanteFn,
  resetSenhaEstudanteFn,
  getRotinaFn,
  saveRotinaFn,
  SessionUser,
} from "@/lib/server-functions";
import {
  createEmptyForm,
  createRow,
  STATUS_META,
  CategoryId,
  RotinaForm,
} from "@/lib/rotina";
import {
  Edit2,
  Trash2,
  Key,
  Calendar,
  ChevronLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";

export const Route = createFileRoute("/admin/alunos")({
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    if (!user || user.perfil !== "admin") {
      throw redirect({ to: "/login" });
    }
    return { user };
  },
  validateSearch: (search: Record<string, unknown>) => {
    return {
      viewRoutineId: search.viewRoutineId ? String(search.viewRoutineId) : undefined,
      viewRoutineWeek: search.viewRoutineWeek ? String(search.viewRoutineWeek) : undefined,
    };
  },
  component: GerenciarAlunos,
});

function GerenciarAlunos() {
  const { user } = Route.useRouteContext() as { user: SessionUser };
  const { viewRoutineId, viewRoutineWeek } = Route.useSearch();
  const navigate = useNavigate();

  const [alunos, setAlunos] = useState<any[]>([]);
  const [editingAluno, setEditingAluno] = useState<any | null>(null);
  const [semanaFiltro, setSemanaFiltro] = useState(viewRoutineWeek || "10 a 16/03");
  const [nomeFiltro, setNomeFiltro] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);

  // Routine editing state (for admin view/edit mode)
  const [activeRotina, setActiveRotina] = useState<RotinaForm | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Load students list
  const loadAlunos = async () => {
    try {
      const res = await getEstudantesFn({ data: { semana: semanaFiltro } });
      setAlunos(res);

      if (viewRoutineId) {
        const student = res.find((a) => String(a.id) === viewRoutineId);
        if (student) {
          setSelectedStudent(student);
          loadStudentRoutine(student.id, semanaFiltro);
        }
      } else {
        setActiveRotina(null);
        setSelectedStudent(null);
      }
    } catch (err: any) {
      toast.error("Erro ao carregar alunos: " + err.message);
    }
  };

  const loadStudentRoutine = async (studentId: number, week: string) => {
    try {
      const res = await getRotinaFn({ data: { usuarioId: studentId, semana: week } });
      if (res) {
        // Adjust the student name and class group loaded to represent current student profile info
        const student = alunos.find((a) => a.id === studentId) || selectedStudent;
        setActiveRotina({
          ...res,
          studentName: student?.nome || "",
          classGroup: student ? `${student.serie} - ${student.turma}` : "",
        } as RotinaForm);
      } else {
        // Prepare empty routine
        const student = alunos.find((a) => a.id === studentId) || selectedStudent;
        const empty = createEmptyForm();
        empty.studentName = student?.nome || "";
        empty.classGroup = student ? `${student.serie} - ${student.turma}` : "";
        empty.week = week;
        setActiveRotina(empty);
      }
    } catch (err: any) {
      toast.error("Erro ao carregar rotina do aluno: " + err.message);
    }
  };

  useEffect(() => {
    loadAlunos();
    setCurrentPage(1);
  }, [semanaFiltro]);

  const filteredAlunos = alunos.filter((aluno) =>
    aluno.nome.toLowerCase().includes(nomeFiltro.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAlunos.length / itemsPerPage);
  const paginatedAlunos = filteredAlunos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [nomeFiltro]);

  // CRUD handlers
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAluno) return;

    try {
      await editEstudanteFn({ data: editingAluno });
      toast.success("Estudante atualizado com sucesso!");
      setEditingAluno(null);
      loadAlunos();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar estudante.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deseja realmente excluir este estudante?")) return;
    try {
      await deleteEstudanteFn({ data: { id } });
      toast.success("Estudante excluído com sucesso.");
      loadAlunos();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir estudante.");
    }
  };

  const handleResetPassword = async (id: number) => {
    const customPassword = window.prompt("Digite a nova senha (ou deixe em branco para resetar para '123456'):");
    if (customPassword === null) return; // User cancelled
    
    try {
      const res = await resetSenhaEstudanteFn({ data: { id, novaSenha: customPassword || undefined } });
      toast.success(`Senha resetada com sucesso para: ${res.senha}`);
      loadAlunos();
    } catch (err: any) {
      toast.error(err.message || "Erro ao resetar senha.");
    }
  };

  // Routine changes handlers
  const updateRotina = (patch: Partial<RotinaForm>) => {
    if (!activeRotina) return;
    setActiveRotina({ ...activeRotina, ...patch });
  };

  const updateFocus = (field: keyof RotinaForm["focus"], value: string) => {
    if (!activeRotina) return;
    setActiveRotina({
      ...activeRotina,
      focus: { ...activeRotina.focus, [field]: value },
    });
  };

  const handleChangeTime = (rowId: string, field: "start" | "end", value: string) => {
    if (!activeRotina) return;
    setActiveRotina({
      ...activeRotina,
      rows: activeRotina.rows.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)),
    });
  };

  const handleChangeCell = (
    rowId: string,
    day: string,
    updates: Record<string, any>
  ) => {
    if (!activeRotina) return;
    const updatedRows = activeRotina.rows.map((r) =>
      r.id === rowId
        ? {
            ...r,
            days: {
              ...r.days,
              [day]: {
                ...r.days[day as keyof typeof r.days],
                ...updates,
              },
            },
          }
        : r
    );
    const updatedForm = { ...activeRotina, rows: updatedRows };
    setActiveRotina(updatedForm);

    const hasObservationUpdate = "text" in updates || "observacao_lida" in updates;
    if (hasObservationUpdate && selectedStudent) {
      saveRotinaFn({
        data: {
          usuarioId: selectedStudent.id,
          semana: semanaFiltro,
          form: updatedForm,
        },
      }).catch((err) => {
        console.error("Erro ao auto-salvar alteração de observação:", err);
      });
    }
  };

  const handleAddRow = () => {
    if (!activeRotina) return;
    setActiveRotina({ ...activeRotina, rows: [...activeRotina.rows, createRow()] });
  };

  const handleRemoveRow = (rowId: string) => {
    if (!activeRotina) return;
    setActiveRotina({ ...activeRotina, rows: activeRotina.rows.filter((r) => r.id !== rowId) });
  };

  const handleSaveRoutineAdmin = async (newStatus: "draft" | "sent" | "reviewed" | "returned") => {
    if (!activeRotina || !selectedStudent) return;
    try {
      const updated = {
        ...activeRotina,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
      await saveRotinaFn({
        data: {
          usuarioId: selectedStudent.id,
          semana: semanaFiltro,
          form: updated,
        },
      });
      setActiveRotina(updated);
      toast.success("Rotina salva com sucesso!");
      loadAlunos();
    } catch (err: any) {
      toast.error("Erro ao salvar rotina: " + err.message);
    }
  };

  // Back to students list
  const handleBackToList = () => {
    navigate({ to: "/admin/alunos", search: {} });
  };

  if (viewRoutineId && (!activeRotina || !selectedStudent)) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <Toaster richColors position="top-center" />
        <AdminHeader currentTab="alunos" userName={user.nome} />
        <main className="mx-auto max-w-7xl px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground animate-pulse">Carregando rotina do estudante...</p>
        </main>
      </div>
    );
  }

  if (activeRotina && selectedStudent) {
    // Admin Edit/View student routine view
    return (
      <div className="min-h-screen bg-background pb-16">
        <Toaster richColors position="top-center" />
        <AdminHeader currentTab="alunos" userName={user.nome} />

        <main className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-10">
          {/* Header Actions */}
          <div className="no-print flex items-center justify-between mb-6">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar para Estudantes
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                Semana:
              </span>
              <input
                type="text"
                value={semanaFiltro}
                onChange={(e) => setSemanaFiltro(e.target.value)}
                placeholder="Ex: 10 a 16/03"
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold focus:outline-none max-w-[120px]"
              />
            </div>
          </div>

          <header className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] print-shadow-none print-break-inside-avoid">
            <div className="flex flex-col items-center gap-4 bg-brand px-5 py-6 text-brand-foreground sm:flex-row sm:gap-5 sm:px-8">
              <div className="text-center sm:text-left">
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-brand-foreground/80">
                  Visualizando Rotina do Estudante
                </span>
                <h1 className="font-display text-2xl font-bold sm:text-3xl">
                  {selectedStudent.nome}
                </h1>
                <p className="mt-1 text-sm text-brand-foreground/80">
                  Série: {selectedStudent.serie} | Turma: {selectedStudent.turma}
                </p>
              </div>
              <div className="sm:ml-auto flex flex-col items-end gap-1">
                <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  Status: {STATUS_META[activeRotina.status].label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
              <label className="block max-w-[240px]">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Semana referente
                </span>
                <input
                  value={activeRotina.week}
                  onChange={(e) => updateRotina({ week: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                />
              </label>
            </div>
          </header>

          <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6 print-shadow-none">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">
              Categorias
            </h2>
            <Legend />
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6 print-shadow-none">
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">
              Rotina Semanal do Aluno
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Marque o campo Realizado na parte inferior de cada atividade se concluída.
            </p>
            <ScheduleTable
              rows={activeRotina.rows}
              onChangeTime={handleChangeTime}
              onChangeCell={handleChangeCell}
              onAddRow={handleAddRow}
              onRemoveRow={handleRemoveRow}
              isAdmin={true}
            />
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6 print-shadow-none">
            <h2 className="font-display text-lg font-semibold text-foreground mb-4">
              Foco e Planejamento
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-foreground">
                  Matérias com mais atenção
                </span>
                <textarea
                  value={activeRotina.focus.attention}
                  onChange={(e) => updateFocus("attention", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-foreground">
                  Avaliações previstas
                </span>
                <textarea
                  value={activeRotina.focus.evaluations}
                  onChange={(e) => updateFocus("evaluations", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-foreground">
                  Metas da Semana
                </span>
                <textarea
                  value={activeRotina.focus.goals}
                  onChange={(e) => updateFocus("goals", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-foreground">
                  Observações do aluno
                </span>
                <textarea
                  value={activeRotina.focus.notes}
                  onChange={(e) => updateFocus("notes", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>
          </section>

          {/* Admin Controls */}
          <div className="no-print mt-6 flex flex-wrap justify-end gap-2 rounded-2xl border border-border bg-card/95 p-4 shadow-[var(--shadow-card)]">
            <Button variant="outline" onClick={() => handleSaveRoutineAdmin("draft")}>
              <Save className="h-4 w-4" />
              Salvar como Rascunho
            </Button>
            <Button variant="destructive" onClick={() => handleSaveRoutineAdmin("returned")}>
              <AlertCircle className="h-4 w-4" />
              Devolver p/ Ajuste
            </Button>
            <Button variant="success" onClick={() => handleSaveRoutineAdmin("reviewed")}>
              <CheckCircle2 className="h-4 w-4" />
              Marcar como Revisado
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <Toaster richColors position="top-center" />
      <AdminHeader currentTab="alunos" userName={user.nome} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Gerenciamento de Alunos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Edite dados, resetar senhas, gerencie e ajuste rotinas dos alunos
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={nomeFiltro}
              onChange={(e) => setNomeFiltro(e.target.value)}
              placeholder="Buscar aluno por nome..."
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus:outline-none min-w-[200px]"
            />
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Semana:</span>
              <input
                type="text"
                value={semanaFiltro}
                onChange={(e) => setSemanaFiltro(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-semibold focus:outline-none max-w-[120px]"
              />
            </div>
          </div>
        </div>

        {/* Student listing table */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Matrícula</th>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Série / Turma</th>
                  <th className="px-6 py-4">E-mail / Login Office</th>
                  <th className="px-6 py-4">Senha</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedAlunos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      Nenhum estudante cadastrado no momento.
                    </td>
                  </tr>
                ) : (
                  paginatedAlunos.map((aluno) => (
                    <tr key={aluno.id} className="hover:bg-muted/10 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-xs">
                        {aluno.codigo_matricula || "-"}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {aluno.nome}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                        {aluno.serie && aluno.turma ? `${aluno.serie} - ${aluno.turma}` : aluno.serie || "-"}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        {aluno.login_office365}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-xs select-none">
                        ••••••••
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            onClick={() =>
                              navigate({
                                to: "/admin/alunos",
                                search: { viewRoutineId: String(aluno.id), viewRoutineWeek: semanaFiltro },
                              })
                            }
                            className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
                            title="Ver/Editar Rotina"
                          >
                            <Calendar className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingAluno(aluno)}
                            className="p-1.5 text-success hover:bg-success/10 rounded-md transition-colors"
                            title="Editar Dados"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(aluno.id)}
                            className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded-md transition-colors"
                            title="Resetar Senha"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(aluno.id)}
                            className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                            title="Excluir Estudante"
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
          {/* Pagination Controls */}
          {alunos.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border bg-muted/20 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Itens por pág:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-input bg-background px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 cursor-pointer"
                >
                  Anterior
                </Button>
                <span className="font-semibold text-foreground">
                  {currentPage} / {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3 cursor-pointer"
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Edit Student Modal */}
      {editingAluno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-display text-lg font-bold text-foreground mb-4">
              Editar Dados do Estudante
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nome
                </span>
                <input
                  type="text"
                  required
                  value={editingAluno.nome}
                  onChange={(e) => setEditingAluno({ ...editingAluno, nome: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Login Office 365
                </span>
                <input
                  type="text"
                  required
                  value={editingAluno.login_office365}
                  onChange={(e) => setEditingAluno({ ...editingAluno, login_office365: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Senha
                </span>
                <input
                  type="text"
                  required
                  value={editingAluno.senha}
                  onChange={(e) => setEditingAluno({ ...editingAluno, senha: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Série
                  </span>
                  <input
                    type="text"
                    value={editingAluno.serie || ""}
                    onChange={(e) => setEditingAluno({ ...editingAluno, serie: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Turma
                  </span>
                  <input
                    type="text"
                    value={editingAluno.turma || ""}
                    onChange={(e) => setEditingAluno({ ...editingAluno, turma: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="secondary" onClick={() => setEditingAluno(null)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="brand">
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
