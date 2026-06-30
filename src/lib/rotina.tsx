import React from "react";
import {
  BookOpen,
  ClipboardList,
  RefreshCw,
  GraduationCap,
  Coffee,
  Target,
  School,
} from "lucide-react";

import emAulaRegularImg from "@/assets/em-aula-regular.png";

export const CatarinaIcon: any = (props: any) => (
  <img
    src={emAulaRegularImg}
    alt="Em Aula Regular"
    className={props.className}
    style={{ ...props.style, objectFit: "contain" }}
  />
);

export type CategoryId =
  | "priority"
  | "task"
  | "review"
  | "exam"
  | "rest"
  | "college"
  | "class";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  description: string;
  icon: any;
  /** Tailwind color token name (matches --color-cat-*) */
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "priority",
    label: "Matérias prioritárias",
    description: "Conteúdos que exigem mais foco",
    icon: BookOpen,
    color: "cat-priority",
  },
  {
    id: "task",
    label: "Trabalhos / Tarefas",
    description: "Atividades e entregas",
    icon: ClipboardList,
    color: "cat-task",
  },
  {
    id: "review",
    label: "Revisão leve",
    description: "Revisão e reforço tranquilo",
    icon: RefreshCw,
    color: "cat-review",
  },
  {
    id: "exam",
    label: "Simulados / Revisão ENEM",
    description: "Simulados e treino de prova",
    icon: GraduationCap,
    color: "cat-exam",
  },
  {
    id: "rest",
    label: "Pausa / Descanso",
    description: "Intervalo e descanso",
    icon: Coffee,
    color: "cat-rest",
  },
  {
    id: "college",
    label: "Vestibulares",
    description: "Preparação para vestibulares",
    icon: Target,
    color: "cat-college",
  },
  {
    id: "class",
    label: "Em Aula Regular",
    description: "Aulas da grade curricular regular",
    icon: School,
    color: "cat-class",
  },
];

export const CATEGORY_MAP: Record<CategoryId, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<CategoryId, CategoryMeta>,
);

export const WEEK_DAYS = [
  { key: "mon", label: "Segunda" },
  { key: "tue", label: "Terça" },
  { key: "wed", label: "Quarta" },
  { key: "thu", label: "Quinta" },
  { key: "fri", label: "Sexta" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
] as const;

export type DayKey = (typeof WEEK_DAYS)[number]["key"];

export interface DayCell {
  text: string;
  category: CategoryId | null;
  realizado?: boolean;
  data_realizacao?: string | null;
  observacao_lida?: boolean;
}

export interface ScheduleRow {
  id: string;
  start: string;
  end: string;
  days: Record<DayKey, DayCell>;
}

export type FormStatus = "draft" | "sent" | "reviewed" | "returned";

export const STATUS_META: Record<
  FormStatus,
  { label: string; color: string }
> = {
  draft: { label: "Rascunho", color: "muted-foreground" },
  sent: { label: "Enviado", color: "primary" },
  reviewed: { label: "Revisado pela orientadora", color: "success" },
  returned: { label: "Devolvido para ajuste", color: "destructive" },
};

export interface RotinaForm {
  studentName: string;
  classGroup: string;
  week: string;
  advisor: string;
  rows: ScheduleRow[];
  focus: {
    attention: string;
    evaluations: string;
    goals: string;
    notes: string;
  };
  status: FormStatus;
  sentAt: string | null;
  updatedAt: string;
}

function emptyDays(): Record<DayKey, DayCell> {
  return WEEK_DAYS.reduce(
    (acc, d) => {
      acc[d.key] = {
        text: "",
        category: null,
        realizado: false,
        data_realizacao: null,
        observacao_lida: false,
      };
      return acc;
    },
    {} as Record<DayKey, DayCell>,
  );
}

let rowCounter = 0;
export function createRow(start = "", end = ""): ScheduleRow {
  rowCounter += 1;
  return {
    id: `row-${Date.now()}-${rowCounter}`,
    start,
    end,
    days: emptyDays(),
  };
}

export function createEmptyForm(): RotinaForm {
  return {
    studentName: "",
    classGroup: "",
    week: "",
    advisor: "",
    rows: [
      createRow("07:00", "08:40"),
      createRow("08:40", "09:50"),
      createRow("09:50", "12:20"),
      createRow("12:20", "14:00"),
      createRow("14:00", "15:30"),
      createRow("15:30", "16:30"),
      createRow("16:30", "18:00"),
      createRow("18:00", "19:30"),
      createRow("19:30", "21:00"),
    ],
    focus: { attention: "", evaluations: "", goals: "", notes: "" },
    status: "draft",
    sentAt: null,
    updatedAt: new Date().toISOString(),
  };
}

const STORAGE_KEY = "rotina-estudos-2026";

export function loadForm(): RotinaForm | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RotinaForm;
  } catch {
    return null;
  }
}

export function saveForm(form: RotinaForm) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
}

export function clearForm() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
