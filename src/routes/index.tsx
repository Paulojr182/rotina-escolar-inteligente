import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Legend } from "@/components/rotina/Legend";
import { ScheduleTable } from "@/components/rotina/ScheduleTable";
import {
  createEmptyForm,
  createRow,
  STATUS_META,
  type CategoryId,
  type RotinaForm,
} from "@/lib/rotina";
import logo from "@/assets/logo-colegio.png";
import {
  Save,
  Send,
  Eraser,
  FileDown,
  Printer,
  CalendarDays,
  User,
  Users,
  UserCheck,
  LogOut,
} from "lucide-react";
import {
  getCurrentUserFn,
  getRotinaFn,
  saveRotinaFn,
  logoutFn,
  SessionUser,
} from "@/lib/server-functions";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    if (user.perfil === "admin") {
      throw redirect({ to: "/admin" });
    }
    return { user };
  },
  head: () => ({
    meta: [
      { title: "Rotina de Estudos 2026 | Colégio Santa Catarina" },
      {
        name: "description",
        content:
          "Monte sua rotina semanal de estudos 2026: horários, atividades por categoria, metas e observações. Salve, imprima ou gere o PDF.",
      },
      { property: "og:title", content: "Rotina de Estudos 2026" },
      {
        property: "og:description",
        content: "Ficha digital de rotina semanal de estudos do aluno.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { user } = Route.useRouteContext() as { user: SessionUser };
  const navigate = useNavigate();

  const [form, setForm] = useState<RotinaForm>(() => {
    const empty = createEmptyForm();
    empty.studentName = user.nome;
    empty.classGroup = user.serie && user.turma ? `${user.serie} - ${user.turma}` : "";
    empty.week = "10 a 16/03"; // Default week
    return empty;
  });

  const [loading, setLoading] = useState(true);

  // Load routine from SQLite
  const loadDbRoutine = async (week: string) => {
    setLoading(true);
    try {
      const res = await getRotinaFn({ data: { usuarioId: user.id, semana: week } });
      if (res) {
        setForm({
          ...res,
          studentName: user.nome,
          classGroup: user.serie && user.turma ? `${user.serie} - ${user.turma}` : "",
        } as RotinaForm);
      } else {
        // Fallback to empty form for this week
        const empty = createEmptyForm();
        empty.studentName = user.nome;
        empty.classGroup = user.serie && user.turma ? `${user.serie} - ${user.turma}` : "";
        empty.week = week;
        setForm(empty);
      }
    } catch (err: any) {
      toast.error("Erro ao carregar rotina do servidor: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDbRoutine(form.week);
  }, [form.week]);

  const update = (patch: Partial<RotinaForm>) =>
    setForm((f) => ({ ...f, ...patch }));

  const updateFocus = (field: keyof RotinaForm["focus"], value: string) =>
    setForm((f) => ({ ...f, focus: { ...f.focus, [field]: value } }));

  const handleChangeTime = (
    rowId: string,
    field: "start" | "end",
    value: string,
  ) =>
    setForm((f) => ({
      ...f,
      rows: f.rows.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)),
    }));

  const handleChangeCell = (
    rowId: string,
    day: string,
    updates: Record<string, any>,
  ) =>
    setForm((f) => {
      const updatedRows = f.rows.map((r) =>
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
      const updatedForm = { ...f, rows: updatedRows };

      const hasAutoSaveField = "realizado" in updates || "observacao_lida" in updates;
      if (hasAutoSaveField) {
        saveRotinaFn({
          data: {
            usuarioId: user.id,
            semana: f.week,
            form: updatedForm,
          },
        }).catch((err) => {
          console.error("Erro no auto-salvamento da rotina:", err);
        });
      }

      return updatedForm;
    });

  const handleAddRow = () =>
    setForm((f) => ({ ...f, rows: [...f.rows, createRow()] }));

  const handleRemoveRow = (rowId: string) =>
    setForm((f) => ({ ...f, rows: f.rows.filter((r) => r.id !== rowId) }));

  const handleSave = async () => {
    try {
      const updatedForm = {
        ...form,
        status: "sent" as const,
        sentAt: form.sentAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveRotinaFn({
        data: {
          usuarioId: user.id,
          semana: form.week,
          form: updatedForm,
        },
      });
      setForm(updatedForm);
      toast.success("Rotina salva com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar rotina: " + err.message);
    }
  };

  const handleClear = () => {
    if (!window.confirm("Tem certeza que deseja limpar todo o formulário?"))
      return;
    const cleared = createEmptyForm();
    cleared.studentName = user.nome;
    cleared.classGroup = user.serie && user.turma ? `${user.serie} - ${user.turma}` : "";
    cleared.week = form.week;
    setForm(cleared);
    toast.success("Formulário limpo localmente. Lembre-se de salvar.");
  };

  const handlePrint = () => window.print();

  const handleLogout = async () => {
    try {
      await logoutFn();
      toast.success("Logout efetuado.");
      navigate({ to: "/login" });
    } catch {
      toast.error("Erro ao sair.");
    }
  };

  const status = STATUS_META[form.status];

  return (
    <div className="min-h-screen bg-background pb-16">
      <Toaster richColors position="top-center" />

      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-10">
        {/* Top Header Controls (No-print) */}
        <div className="no-print mb-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Logado como: <strong>{user.nome}</strong> ({user.login_office365})
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-destructive border border-destructive/20 hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>

        {/* Header */}
        <header className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] print-shadow-none print-break-inside-avoid">
          <div className="flex flex-col items-center gap-4 bg-brand px-5 py-6 text-brand-foreground sm:flex-row sm:gap-5 sm:px-8">
            <img
              src={logo}
              alt="Logo do Colégio Santa Catarina de Juiz de Fora"
              width={72}
              height={72}
              className="h-16 w-16 rounded-xl bg-white/95 p-1.5 sm:h-[72px] sm:w-[72px]"
            />
            <div className="text-center sm:text-left">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-foreground/80">
                Colégio Santa Catarina de Juiz de Fora
              </p>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">
                Rotina de Estudos 2026
              </h1>
              <p className="mt-1 text-sm text-brand-foreground/80">
                Planejamento semanal do aluno
              </p>
            </div>
            <div className="sm:ml-auto">
              <span
                className={`inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold`}
              >
                Status: {status.label}
              </span>
            </div>
          </div>

          {/* Student fields */}
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
            <Field
              icon={<User className="h-4 w-4" />}
              label="Nome do aluno"
              value={form.studentName}
              onChange={(v) => update({ studentName: v })}
              placeholder="Nome completo"
              readOnly
            />
            <Field
              icon={<Users className="h-4 w-4" />}
              label="Série / Turma"
              value={form.classGroup}
              onChange={(v) => update({ classGroup: v })}
              placeholder="Ex.: 3º ano A"
              readOnly
            />
            <Field
              icon={<CalendarDays className="h-4 w-4" />}
              label="Semana referente"
              value={form.week}
              onChange={(v) => update({ week: v })}
              placeholder="Ex.: 10 a 16/03"
            />
          </div>
        </header>

        {loading ? (
          <div className="mt-12 flex justify-center items-center">
            <p className="text-sm text-muted-foreground animate-pulse">Carregando rotina...</p>
          </div>
        ) : (
          <>
            {/* Legend */}
            <Section title="Legenda das categorias">
              <Legend />
            </Section>

            {/* Weekly schedule */}
            <Section title="Rotina semanal" subtitle="Preencha as atividades de cada dia e escolha uma categoria.">
              <ScheduleTable
                rows={form.rows}
                onChangeTime={handleChangeTime}
                onChangeCell={handleChangeCell}
                onAddRow={handleAddRow}
                onRemoveRow={handleRemoveRow}
                showRealizado={true}
              />
            </Section>

            {/* Focus planning */}
            <Section title="Planejamento de Foco da Semana">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextareaField
                  label="Matérias que precisam de mais atenção"
                  value={form.focus.attention}
                  onChange={(v) => updateFocus("attention", v)}
                  placeholder="Liste as matérias que exigem mais dedicação..."
                />
                <TextareaField
                  label="Avaliações previstas"
                  value={form.focus.evaluations}
                  onChange={(v) => updateFocus("evaluations", v)}
                  placeholder="Provas, testes, simulados ou trabalhos com data..."
                />
                <TextareaField
                  label="Metas da Semana"
                  value={form.focus.goals}
                  onChange={(v) => updateFocus("goals", v)}
                  placeholder="O que você quer alcançar nesta semana..."
                />
                <TextareaField
                  label="Observações / Anotações do aluno"
                  value={form.focus.notes}
                  onChange={(v) => updateFocus("notes", v)}
                  placeholder="Anotações livres..."
                />
              </div>
            </Section>

            {/* Actions */}
            <div className="no-print sticky bottom-3 z-20 mt-6 flex flex-wrap justify-center gap-2 rounded-2xl border border-border bg-card/95 p-3 shadow-[var(--shadow-card)] backdrop-blur">
              <Button variant="brand" onClick={handleSave}>
                <Save className="h-4 w-4" />
                Salvar Rotina
              </Button>
              <Button variant="success" onClick={handlePrint}>
                <FileDown className="h-4 w-4" />
                Gerar PDF
              </Button>
              <Button variant="secondary" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button variant="destructive" onClick={handleClear}>
                <Eraser className="h-4 w-4" />
                Limpar formulário
              </Button>
            </div>
          </>
        )}

        <p className="no-print mt-4 text-center text-xs text-muted-foreground">
          Sua rotina fica salva diretamente no banco de dados do colégio.
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6 print-shadow-none print-break-inside-avoid">
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold text-foreground">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => !readOnly && onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none ${
          readOnly ? "opacity-75 cursor-not-allowed bg-muted/20" : "focus:ring-2 focus:ring-ring/40"
        }`}
      />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-foreground">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring/40"
      />
    </label>
  );
}
