import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Legend } from "@/components/rotina/Legend";
import { ScheduleTable } from "@/components/rotina/ScheduleTable";
import {
  createEmptyForm,
  createRow,
  loadForm,
  saveForm,
  clearForm,
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
} from "lucide-react";

export const Route = createFileRoute("/")({
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
  const [form, setForm] = useState<RotinaForm>(() => createEmptyForm());
  const loaded = useRef(false);

  useEffect(() => {
    const saved = loadForm();
    if (saved) setForm(saved);
    loaded.current = true;
  }, []);

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
    field: "text" | "category",
    value: string | CategoryId | null,
  ) =>
    setForm((f) => ({
      ...f,
      rows: f.rows.map((r) =>
        r.id === rowId
          ? {
              ...r,
              days: {
                ...r.days,
                [day]: { ...r.days[day as keyof typeof r.days], [field]: value },
              },
            }
          : r,
      ),
    }));

  const handleAddRow = () =>
    setForm((f) => ({ ...f, rows: [...f.rows, createRow()] }));

  const handleRemoveRow = (rowId: string) =>
    setForm((f) => ({ ...f, rows: f.rows.filter((r) => r.id !== rowId) }));

  const persist = (next: RotinaForm) => {
    const withTime = { ...next, updatedAt: new Date().toISOString() };
    saveForm(withTime);
    setForm(withTime);
    return withTime;
  };

  const handleSaveDraft = () => {
    persist({ ...form, status: form.status === "sent" ? "sent" : "draft" });
    toast.success("Rascunho salvo neste navegador.");
  };

  const validate = () => {
    const missing: string[] = [];
    if (!form.studentName.trim()) missing.push("Nome do aluno");
    if (!form.classGroup.trim()) missing.push("Série / Turma");
    if (!form.week.trim()) missing.push("Semana referente");
    return missing;
  };

  const handleSend = () => {
    const missing = validate();
    if (missing.length) {
      toast.error(`Preencha antes de enviar: ${missing.join(", ")}.`);
      return;
    }
    persist({ ...form, status: "sent", sentAt: new Date().toISOString() });
    toast.success(
      "Ficha marcada como enviada. Gere o PDF e envie para a orientadora.",
    );
    setTimeout(() => window.print(), 400);
  };

  const handleClear = () => {
    if (!window.confirm("Tem certeza que deseja limpar todo o formulário?"))
      return;
    clearForm();
    setForm(createEmptyForm());
    toast.success("Formulário limpo.");
  };

  const handlePrint = () => window.print();

  const status = STATUS_META[form.status];

  return (
    <div className="min-h-screen bg-background pb-16">
      <Toaster richColors position="top-center" />

      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-10">
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
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
            <Field
              icon={<User className="h-4 w-4" />}
              label="Nome do aluno"
              value={form.studentName}
              onChange={(v) => update({ studentName: v })}
              placeholder="Nome completo"
            />
            <Field
              icon={<Users className="h-4 w-4" />}
              label="Série / Turma"
              value={form.classGroup}
              onChange={(v) => update({ classGroup: v })}
              placeholder="Ex.: 3º ano A"
            />
            <Field
              icon={<CalendarDays className="h-4 w-4" />}
              label="Semana referente"
              value={form.week}
              onChange={(v) => update({ week: v })}
              placeholder="Ex.: 10 a 16/03"
            />
            <Field
              icon={<UserCheck className="h-4 w-4" />}
              label="Orientadora responsável"
              value={form.advisor}
              onChange={(v) => update({ advisor: v })}
              placeholder="Nome da orientadora"
            />
          </div>
        </header>

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
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="h-4 w-4" />
            Salvar rascunho
          </Button>
          <Button variant="brand" onClick={handleSend}>
            <Send className="h-4 w-4" />
            Enviar para orientadora
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

        <p className="no-print mt-4 text-center text-xs text-muted-foreground">
          As informações ficam salvas neste navegador. Use “Gerar PDF” para
          enviar a ficha à orientadora.
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
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
