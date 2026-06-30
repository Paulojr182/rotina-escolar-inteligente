import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import {
  getCurrentUserFn,
  getDashboardStatsFn,
  getEstudantesFn,
  SessionUser,
} from "@/lib/server-functions";
import {
  Users as UsersIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
} from "lucide-react";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/admin/")({
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    if (!user || user.perfil !== "admin") {
      throw redirect({ to: "/login" });
    }
    return { user };
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user } = Route.useRouteContext() as { user: SessionUser };
  const [stats, setStats] = useState<{
    totalAlunos: number;
    preencheram: number;
    naoPreencheram: number;
    pendentesRealizacao: number;
    weeks: string[];
  } | null>(null);

  const [semana, setSemana] = useState("");
  const [serie, setSerie] = useState("");
  const [turma, setTurma] = useState("");
  const [alunos, setAlunos] = useState<any[]>([]);
  const [nomeFiltro, setNomeFiltro] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);

  // Load stats and students
  const loadData = async () => {
    try {
      const statsRes = await getDashboardStatsFn({ data: { semana } });
      setStats(statsRes);

      // If no week selected, default to the latest week available
      let targetWeek = semana;
      if (!targetWeek && statsRes.weeks.length > 0) {
        targetWeek = statsRes.weeks[0];
        setSemana(targetWeek);
      }

      const alunosRes = await getEstudantesFn({
        data: { semana: targetWeek },
      });
      setAlunos(alunosRes);
    } catch (err: any) {
      toast.error("Erro ao carregar os dados: " + err.message);
    }
  };

  useEffect(() => {
    loadData();
    setCurrentPage(1);
  }, [semana]);

  const filteredAlunos = alunos.filter((aluno) => {
    const matchesNome = aluno.nome.toLowerCase().includes(nomeFiltro.toLowerCase());
    const matchesSerie = !serie || aluno.serie === serie;
    const matchesTurma = !turma || aluno.turma === turma;
    return matchesNome && matchesSerie && matchesTurma;
  });

  const totalPages = Math.ceil(filteredAlunos.length / itemsPerPage);
  const paginatedAlunos = filteredAlunos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [nomeFiltro, serie, turma]);

  // Extract unique series and classes for filter dropdowns
  const uniqueSeries = Array.from(new Set(alunos.map((a) => a.serie).filter(Boolean)));
  const uniqueTurmas = Array.from(new Set(alunos.map((a) => a.turma).filter(Boolean)));

  const handleExportExcel = () => {
    if (!alunos.length) {
      toast.warning("Nenhum dado para exportar.");
      return;
    }

    const exportRows = alunos.map((a) => ({
      Matricula: a.codigo_matricula || "",
      Nome: a.nome,
      Serie: a.serie || "",
      Turma: a.turma || "",
      Semana: a.rotina?.semana || semana || "N/A",
      Status: a.rotina
        ? a.rotina.status === "sent"
          ? "Enviado"
          : a.rotina.status === "reviewed"
            ? "Revisado"
            : a.rotina.status === "returned"
              ? "Devolvido"
              : "Rascunho"
        : "Não Preenchido",
      Atividades_Preenchidas: a.rotina?.totalItens || 0,
      Atividades_Realizadas: a.rotina?.realizados || 0,
      Atividades_Pendentes: a.rotina?.pendentesDeRealizacao || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dashboard");
    XLSX.writeFile(workbook, `Rotina_Estudos_2026_${semana || "Geral"}.xlsx`);
    toast.success("Planilha exportada com sucesso.");
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <Toaster richColors position="top-center" />
      <AdminHeader currentTab="dashboard" userName={user.nome} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Title */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              Dashboard de Rotinas
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhamento de preenchimento e realização de rotinas semanais
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand text-brand-foreground text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-brand/90 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4" />
              Exportar Excel
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Estudantes"
            value={stats?.totalAlunos ?? 0}
            icon={<UsersIcon className="h-6 w-6 text-primary" />}
            bgColor="bg-primary/10"
          />
          <StatCard
            title="Preencheram Rotina"
            value={stats?.preencheram ?? 0}
            icon={<CheckCircle className="h-6 w-6 text-success" />}
            bgColor="bg-success/10"
          />
          <StatCard
            title="Não Preencheram"
            value={stats?.naoPreencheram ?? 0}
            icon={<XCircle className="h-6 w-6 text-destructive" />}
            bgColor="bg-destructive/10"
          />
          <StatCard
            title="Pendentes de Realização"
            value={stats?.pendentesRealizacao ?? 0}
            icon={<AlertCircle className="h-6 w-6 text-amber-500" />}
            bgColor="bg-amber-500/10"
          />
        </div>

        {/* Filters Card */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-display text-base font-semibold text-foreground mb-4">
            Filtros
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            {/* Nome filter */}
            <label className="block">
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Nome do Estudante
              </span>
              <input
                type="text"
                value={nomeFiltro}
                onChange={(e) => setNomeFiltro(e.target.value)}
                placeholder="Buscar por nome..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </label>

            {/* Semana filter */}
            <label className="block">
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Semana Referente
              </span>
              <select
                value={semana}
                onChange={(e) => setSemana(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="">Selecione uma semana</option>
                {stats?.weeks.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </label>

            {/* Serie filter */}
            <label className="block">
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Série / Ano
              </span>
              <select
                value={serie}
                onChange={(e) => setSerie(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="">Todas as séries</option>
                {uniqueSeries.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            {/* Turma filter */}
            <label className="block">
              <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Turma
              </span>
              <select
                value={turma}
                onChange={(e) => setTurma(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="">Todas as turmas</option>
                {uniqueTurmas.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Student Table */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Matrícula</th>
                  <th className="px-6 py-4">Nome do Estudante</th>
                  <th className="px-6 py-4">Série / Turma</th>
                  <th className="px-6 py-4">Status da Rotina</th>
                  <th className="px-6 py-4">Preenchimento / Realização</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedAlunos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      Nenhum estudante encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  paginatedAlunos.map((aluno) => {
                    const hasRoutine = !!aluno.rotina;
                    const routineStatus = aluno.rotina?.status;

                    return (
                      <tr key={aluno.id} className="hover:bg-muted/10 transition-colors">
                        <td className="whitespace-nowrap px-6 py-4 font-mono text-xs">
                          {aluno.codigo_matricula || "-"}
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground">
                          {aluno.nome}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                          {aluno.serie && aluno.turma
                            ? `${aluno.serie} - ${aluno.turma}`
                            : aluno.serie || aluno.turma || "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {!hasRoutine ? (
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                              Não Preenchido
                            </span>
                          ) : routineStatus === "draft" ? (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                              Rascunho
                            </span>
                          ) : routineStatus === "sent" ? (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                              Enviado
                            </span>
                          ) : routineStatus === "reviewed" ? (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/10">
                              Revisado
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                              Ajuste Necessário
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">
                          {hasRoutine ? (
                            <div className="space-y-1">
                              <div>
                                Atividades: <strong>{aluno.rotina.totalItens}</strong>
                              </div>
                              <div className="flex gap-3">
                                <span className="text-success font-semibold">
                                  Realizados: {aluno.rotina.realizados}
                                </span>
                                <span className="text-amber-500 font-semibold">
                                  Pendentes: {aluno.rotina.pendentesDeRealizacao}
                                </span>
                              </div>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center">
                          <Link
                            to={`/admin/alunos`}
                            search={{ viewRoutineId: String(aluno.id), viewRoutineWeek: semana }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 rounded-md transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Visualizar Rotina
                          </Link>
                        </td>
                      </tr>
                    );
                  })
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
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  bgColor,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${bgColor}`}>{icon}</div>
      </div>
    </div>
  );
}
