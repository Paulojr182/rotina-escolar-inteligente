import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  CATEGORIES,
  CATEGORY_MAP,
  WEEK_DAYS,
  type CategoryId,
  type ScheduleRow,
} from "@/lib/rotina";
import { Plus, Trash2, X } from "lucide-react";

interface ScheduleTableProps {
  rows: ScheduleRow[];
  onChangeTime: (rowId: string, field: "start" | "end", value: string) => void;
  onChangeCell: (
    rowId: string,
    day: string,
    field: "text" | "category",
    value: string | CategoryId | null,
  ) => void;
  onAddRow: () => void;
  onRemoveRow: (rowId: string) => void;
}

export function ScheduleTable({
  rows,
  onChangeTime,
  onChangeCell,
  onAddRow,
  onRemoveRow,
}: ScheduleTableProps) {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-border print-shadow-none">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-brand text-brand-foreground">
              <th className="sticky left-0 z-10 min-w-[120px] bg-brand p-2 text-left text-xs font-semibold uppercase tracking-wide">
                Horário
              </th>
              {WEEK_DAYS.map((d) => (
                <th
                  key={d.key}
                  className="min-w-[150px] border-l border-white/20 p-2 text-center text-xs font-semibold uppercase tracking-wide"
                >
                  {d.label}
                </th>
              ))}
              <th className="w-10 border-l border-white/20 p-2 no-print" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.id}
                className={
                  idx % 2 === 0 ? "bg-card" : "bg-secondary/40"
                }
              >
                <td className="sticky left-0 z-10 border-t border-border bg-inherit p-2 align-top">
                  <div className="flex flex-col gap-1">
                    <input
                      type="time"
                      value={row.start}
                      onChange={(e) => onChangeTime(row.id, "start", e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      aria-label="Horário inicial"
                    />
                    <input
                      type="time"
                      value={row.end}
                      onChange={(e) => onChangeTime(row.id, "end", e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      aria-label="Horário final"
                    />
                  </div>
                </td>
                {WEEK_DAYS.map((d) => {
                  const cell = row.days[d.key];
                  const cat = cell.category ? CATEGORY_MAP[cell.category] : null;
                  return (
                    <td
                      key={d.key}
                      className="border-l border-t border-border p-1.5 align-top"
                      style={
                        cat
                          ? {
                              boxShadow: `inset 4px 0 0 var(--color-${cat.color})`,
                            }
                          : undefined
                      }
                    >
                      <textarea
                        value={cell.text}
                        onChange={(e) =>
                          onChangeCell(row.id, d.key, "text", e.target.value)
                        }
                        rows={2}
                        placeholder="Atividade..."
                        className="w-full resize-y rounded-md border border-input bg-background px-2 py-1 text-xs leading-snug focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <div className="mt-1 flex items-center gap-1">
                        <Select
                          value={cell.category ?? ""}
                          onValueChange={(v) =>
                            onChangeCell(row.id, d.key, "category", v as CategoryId)
                          }
                        >
                          <SelectTrigger className="h-7 flex-1 px-2 text-[11px]">
                            <SelectValue placeholder="Categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((c) => {
                              const Icon = c.icon;
                              return (
                                <SelectItem key={c.id} value={c.id} className="text-xs">
                                  <span className="flex items-center gap-2">
                                    <span
                                      className={`flex h-4 w-4 items-center justify-center rounded bg-${c.color} text-white`}
                                    >
                                      <Icon className="h-2.5 w-2.5" />
                                    </span>
                                    {c.label}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {cell.category && (
                          <button
                            type="button"
                            onClick={() =>
                              onChangeCell(row.id, d.key, "category", null)
                            }
                            className="no-print flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                            aria-label="Remover categoria"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="border-l border-t border-border p-1 text-center align-middle no-print">
                  <button
                    type="button"
                    onClick={() => onRemoveRow(row.id)}
                    disabled={rows.length <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-30"
                    aria-label="Remover linha"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onAddRow} className="no-print">
        <Plus className="h-4 w-4" />
        Adicionar horário
      </Button>
    </div>
  );
}
