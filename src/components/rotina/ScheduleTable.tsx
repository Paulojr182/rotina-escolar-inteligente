import React, { useState } from "react";
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
import { Plus, Trash2, X, MessageSquare, ChevronDown } from "lucide-react";

interface ScheduleTableProps {
  rows: ScheduleRow[];
  onChangeTime: (rowId: string, field: "start" | "end", value: string) => void;
  onChangeCell: (
    rowId: string,
    day: string,
    updates: Record<string, any>,
  ) => void;
  onAddRow: () => void;
  onRemoveRow: (rowId: string) => void;
  showRealizado?: boolean;
  isAdmin?: boolean;
}

export function ScheduleTable({
  rows,
  onChangeTime,
  onChangeCell,
  onAddRow,
  onRemoveRow,
  showRealizado = false,
  isAdmin = false,
}: ScheduleTableProps) {
  const [activeObs, setActiveObs] = useState<{
    rowId: string;
    dayKey: string;
    text: string;
    dayLabel: string;
    timeLabel: string;
  } | null>(null);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-border print-shadow-none">
        <table className="w-full border-collapse text-sm table-fixed min-w-[850px] xl:min-w-full">
          <thead>
            <tr className="bg-brand text-brand-foreground">
              <th className="sticky left-0 z-10 w-[12%] bg-brand p-2 text-left text-xs font-semibold uppercase tracking-wide">
                Horário
              </th>
              {WEEK_DAYS.map((d) => (
                <th
                  key={d.key}
                  className="w-[12%] border-l border-white/20 p-2 text-center text-xs font-semibold uppercase tracking-wide"
                >
                  {d.label}
                </th>
              ))}
              <th className="w-[4%] border-l border-white/20 p-2 no-print" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.id}
                className={idx % 2 === 0 ? "bg-card" : "bg-secondary/40"}
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
                  const cell = row.days[d.key] || { text: "", category: null, realizado: false, data_realizacao: "", observacao_lida: false };
                  const cat = cell.category ? CATEGORY_MAP[cell.category] : null;
                  const hasObs = cell.text && cell.text.trim() !== "";
                  const isRead = !!cell.observacao_lida;

                  return (
                    <td
                      key={d.key}
                      className="border-l border-t border-border p-2 align-top transition-all duration-150 hover:bg-muted/10 relative group min-h-[90px]"
                      onDragOver={(e) => {
                        e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const catId = e.dataTransfer.getData("text/plain");
                        if (catId) {
                          onChangeCell(row.id, d.key, { category: catId as any });
                        }
                      }}
                    >
                      <div className="flex flex-col h-full justify-between gap-1.5">
                        <Select
                          value={cell.category ?? ""}
                          onValueChange={(v) =>
                            onChangeCell(row.id, d.key, { category: v as CategoryId })
                          }
                        >
                          {cat ? (
                            <div className="relative w-full">
                              <SelectTrigger className="w-full h-auto p-0 border-0 bg-transparent shadow-none hover:bg-transparent focus:ring-0 focus:ring-offset-0 [&>span]:w-full [&>svg]:hidden">
                                <div
                                  className={`flex flex-col items-center justify-center w-full p-2 rounded-xl border border-${cat.color}/30 bg-${cat.color}/10 hover:bg-${cat.color}/20 transition-all text-center min-h-[64px] cursor-pointer`}
                                >
                                  <span className={`flex h-6 w-6 items-center justify-center rounded-lg bg-${cat.color} text-white mb-1`}>
                                    {React.createElement(cat.icon, { className: "h-3.5 w-3.5" })}
                                  </span>
                                  <span className={`text-[10px] font-bold leading-tight text-${cat.color} truncate max-w-full px-1`}>
                                    {cat.label}
                                  </span>
                                </div>
                              </SelectTrigger>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onChangeCell(row.id, d.key, { category: null });
                                }}
                                className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-destructive text-white hover:bg-destructive/90 shadow-xs border border-white z-10 no-print cursor-pointer"
                                aria-label="Remover categoria"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ) : (
                            <SelectTrigger className="w-full h-auto p-0 border-0 bg-transparent shadow-none hover:bg-transparent focus:ring-0 focus:ring-offset-0 [&>span]:w-full [&>svg]:hidden">
                              <div className="flex flex-col items-center justify-center w-full p-2 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/5 hover:bg-muted/15 hover:border-muted-foreground/50 transition-all text-center min-h-[64px] cursor-pointer">
                                <span className="text-[9px] leading-tight text-muted-foreground block w-full px-1 break-words">
                                  Solte ou clique
                                </span>
                                <ChevronDown className="h-3 w-3 mt-1 text-muted-foreground/40" />
                              </div>
                            </SelectTrigger>
                          )}
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

                        {/* Realizado Checkbox */}
                        {showRealizado && cat && (
                          <label className="mt-1 flex items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!cell.realizado}
                              onChange={(e) =>
                                onChangeCell(row.id, d.key, { realizado: e.target.checked })
                              }
                              className="h-3.5 w-3.5 rounded border-input text-brand focus:ring-brand/40"
                            />
                            Realizado
                          </label>
                        )}
                      </div>

                      {/* Observation Badge/Button */}
                      {(() => {
                        if (hasObs) {
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveObs({
                                  rowId: row.id,
                                  dayKey: d.key,
                                  text: cell.text,
                                  dayLabel: d.label,
                                  timeLabel: `${row.start} - ${row.end}`
                                });
                              }}
                              className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs border border-white hover:bg-amber-600 transition-colors z-10 cursor-pointer"
                              title="Ver observação"
                            >
                              <MessageSquare className="h-3 w-3" />
                              {!isAdmin && !isRead && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                              )}
                            </button>
                          );
                        } else if (isAdmin) {
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveObs({
                                  rowId: row.id,
                                  dayKey: d.key,
                                  text: "",
                                  dayLabel: d.label,
                                  timeLabel: `${row.start} - ${row.end}`
                                });
                              }}
                              className="absolute bottom-1 left-1 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30 text-white shadow-xs border border-white hover:bg-brand transition-colors z-10 cursor-pointer"
                              title="Adicionar observação"
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </td>
                  );
                })}
                <td className="border-l border-t border-border p-1 text-center align-middle no-print">
                  <button
                    type="button"
                    onClick={() => onRemoveRow(row.id)}
                    disabled={rows.length <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-30 cursor-pointer"
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

      <Button type="button" variant="outline" size="sm" onClick={onAddRow} className="no-print cursor-pointer">
        <Plus className="h-4 w-4" />
        Adicionar horário
      </Button>

      {/* Observation Modal */}
      {activeObs && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-amber-500" />
                Observação da Orientadora
              </h3>
              <button
                onClick={() => {
                  if (!isAdmin && activeObs.text) {
                    onChangeCell(activeObs.rowId, activeObs.dayKey, { observacao_lida: true });
                  }
                  setActiveObs(null);
                }}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-4">
                Referente a: <strong>{activeObs.dayLabel} às {activeObs.timeLabel}</strong>
              </p>

              {isAdmin ? (
                <div className="space-y-4">
                  <textarea
                    value={activeObs.text}
                    onChange={(e) => setActiveObs({ ...activeObs, text: e.target.value })}
                    rows={4}
                    placeholder="Digite a observação para o aluno..."
                    className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveObs(null)}
                      className="cursor-pointer"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        onChangeCell(activeObs.rowId, activeObs.dayKey, {
                          text: activeObs.text,
                          observacao_lida: false,
                        });
                        setActiveObs(null);
                      }}
                      className="cursor-pointer"
                    >
                      Salvar Observação
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted/40 border border-border p-4 rounded-xl text-sm leading-relaxed text-foreground whitespace-pre-wrap font-medium">
                    {activeObs.text || "Nenhuma observação cadastrada."}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => {
                        onChangeCell(activeObs.rowId, activeObs.dayKey, { observacao_lida: true });
                        setActiveObs(null);
                      }}
                      className="cursor-pointer"
                    >
                      Entendido / Fechar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
