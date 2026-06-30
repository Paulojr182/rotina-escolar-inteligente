import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { getCurrentUserFn, importEstudantesFn, SessionUser } from "@/lib/server-functions";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/admin/importar")({
  beforeLoad: async () => {
    const user = await getCurrentUserFn();
    if (!user || user.perfil !== "admin") {
      throw redirect({ to: "/login" });
    }
    return { user };
  },
  component: ImportarEstudantes,
});

function ImportarEstudantes() {
  const { user } = Route.useRouteContext() as { user: SessionUser };
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ inserted: number; updated: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Por favor, selecione um arquivo.");
      return;
    }

    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (!data.length) {
          throw new Error("A planilha está vazia.");
        }

        // Validate structure (check if key headers are present)
        const sample = data[0];
        const requiredHeaders = ["CODIGOMATRICULA", "NOMEALUNO", "LOGINOFFICE365", "SENHA"];
        const missing = requiredHeaders.filter((h) => !(h in sample));

        if (missing.length) {
          throw new Error(`Planilha inválida. Colunas obrigatórias ausentes: ${missing.join(", ")}`);
        }

        // Map, clean up and filter rows (only allow High School 1st, 2nd, 3rd series)
        const formattedData = data
          .map((row) => {
            let serie = String(row.SERIE || "").trim();
            // Standardize format to "Xª Série"
            if (/1(ª|a)\s*s[eé]rie/i.test(serie)) serie = "1ª Série";
            else if (/2(ª|a)\s*s[eé]rie/i.test(serie)) serie = "2ª Série";
            else if (/3(ª|a)\s*s[eé]rie/i.test(serie)) serie = "3ª Série";

            return {
              SERIE: serie,
              CODIGOTURMA: String(row.CODIGOTURMA || "").trim(),
              TURMA: String(row.TURMA || "").trim(),
              PREFIXOTURMAOFFICE: String(row.PREFIXOTURMAOFFICE || "").trim(),
              CODIGOMATRICULA: String(row.CODIGOMATRICULA || "").trim(),
              NOMEALUNO: String(row.NOMEALUNO || "").trim(),
              LOGINOFFICE365: String(row.LOGINOFFICE365 || "").trim(),
              SENHA: String(row.SENHA || "").trim(),
            };
          })
          .filter((row) => ["1ª Série", "2ª Série", "3ª Série"].includes(row.SERIE));

        if (!formattedData.length) {
          throw new Error("Nenhum estudante do Ensino Médio (1ª, 2ª ou 3ª Série) encontrado na planilha.");
        }

        const res = await importEstudantesFn({ data: formattedData });
        if (res.success) {
          toast.success("Importação concluída!");
          setResult({ inserted: res.inserted, updated: res.updated });
          setFile(null);
        }
      } catch (err: any) {
        toast.error(err.message || "Erro ao processar planilha.");
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      toast.error("Erro ao ler o arquivo.");
      setLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <Toaster richColors position="top-center" />
      <AdminHeader currentTab="importar" userName={user.nome} />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Importar Estudantes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Envie uma planilha Excel para cadastrar novos alunos ou atualizar os dados de alunos existentes
          </p>
        </div>

        {/* Requirements warning */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div className="text-xs leading-relaxed text-blue-800">
            <span className="font-semibold block text-sm text-blue-900 mb-1">
              Formato da Planilha Requerido
            </span>
            A planilha deve conter obrigatoriamente as seguintes colunas (com cabeçalhos exatos):
            <div className="mt-2 grid grid-cols-2 gap-x-4 font-mono font-bold text-blue-900 sm:grid-cols-4">
              <div>• SERIE</div>
              <div>• CODIGOTURMA</div>
              <div>• TURMA</div>
              <div>• PREFIXOTURMAOFFICE</div>
              <div>• CODIGOMATRICULA</div>
              <div>• NOMEALUNO</div>
              <div>• LOGINOFFICE365</div>
              <div>• SENHA</div>
            </div>
            <p className="mt-2 font-medium">
              Nota: O sistema identifica duplicidade por MATRÍCULA ou LOGIN OFFICE 365, atualizando as informações
              automaticamente sem perder o histórico do aluno.
            </p>
          </div>
        </div>

        {/* Upload card */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <form onSubmit={handleUpload} className="space-y-6">
            <label className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-input bg-muted/20 p-8 text-center transition-all hover:bg-muted/30 cursor-pointer">
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-sm font-semibold text-foreground">
                Clique para selecionar ou arraste a planilha
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Formatos aceitos: .xlsx, .xls, .ods
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.ods"
                onChange={handleFileChange}
                className="hidden"
                disabled={loading}
              />
              {file && (
                <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-brand/10 px-3 py-1.5 text-xs text-brand font-semibold">
                  <FileSpreadsheet className="h-4 w-4" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </label>

            <Button
              type="submit"
              disabled={loading || !file}
              className="w-full py-2.5 bg-brand text-brand-foreground hover:bg-brand/90 font-semibold flex justify-center items-center gap-2"
            >
              {loading ? "Processando planilha..." : "Iniciar Importação"}
            </Button>
          </form>
        </div>

        {/* Results summary */}
        {result && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-success/20 bg-success/10 p-5 text-success-foreground animate-in fade-in zoom-in-95 duration-200">
            <CheckCircle2 className="h-6 w-6 text-success" />
            <div>
              <h3 className="text-sm font-bold text-success-foreground">
                Importação concluída com sucesso!
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Foram adicionados <strong className="text-foreground">{result.inserted}</strong> novos alunos e atualizados{" "}
                <strong className="text-foreground">{result.updated}</strong> alunos já cadastrados.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
