import { createServerFn } from "@tanstack/react-start";

// Interface shared with the client
export interface SessionUser {
  id: number;
  nome: string;
  login_office365: string;
  perfil: "admin" | "aluno";
  serie?: string;
  turma?: string;
  codigo_matricula?: string;
}

// ----------------------------------------------------
// AUTHENTICATION SERVER FUNCTIONS
// ----------------------------------------------------

export const loginFn = createServerFn({ method: "POST" })
  .validator((d: { login: string; senha: string }) => d)
  .handler(async ({ data }) => {
    const utils = await import("./server-utils");
    return utils.login(data);
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const utils = await import("./server-utils");
  return utils.logout();
});

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(async () => {
  const utils = await import("./server-utils");
  return utils.getSession();
});

// ----------------------------------------------------
// STUDENT IMPORT / CRUD
// ----------------------------------------------------

export interface ImportRow {
  SERIE: string;
  CODIGOTURMA: string;
  TURMA: string;
  PREFIXOTURMAOFFICE: string;
  CODIGOMATRICULA: string;
  NOMEALUNO: string;
  LOGINOFFICE365: string;
  SENHA: string;
}

export const importEstudantesFn = createServerFn({ method: "POST" })
  .validator((rows: ImportRow[]) => rows)
  .handler(async ({ data }) => {
    const utils = await import("./server-utils");
    const admin = utils.getSession();
    if (!admin || admin.perfil !== "admin") {
      throw new Error("Não autorizado.");
    }
    return utils.importEstudantes(data);
  });

export const getEstudantesFn = createServerFn({ method: "GET" })
  .validator((filters: { serie?: string; turma?: string; alunoId?: string; semana?: string }) => filters)
  .handler(async ({ data }) => {
    const utils = await import("./server-utils");
    const admin = utils.getSession();
    if (!admin || admin.perfil !== "admin") {
      throw new Error("Não autorizado.");
    }
    return utils.getEstudantes(data);
  });

export const editEstudanteFn = createServerFn({ method: "POST" })
  .validator((d: { id: number; nome: string; login_office365: string; senha: string; serie: string; turma: string }) => d)
  .handler(async ({ data }) => {
    const utils = await import("./server-utils");
    const admin = utils.getSession();
    if (!admin || admin.perfil !== "admin") {
      throw new Error("Não autorizado.");
    }
    return utils.editEstudante(data);
  });

export const deleteEstudanteFn = createServerFn({ method: "POST" })
  .validator((d: { id: number }) => d)
  .handler(async ({ data }) => {
    const utils = await import("./server-utils");
    const admin = utils.getSession();
    if (!admin || admin.perfil !== "admin") {
      throw new Error("Não autorizado.");
    }
    return utils.deleteEstudante(data.id);
  });

export const resetSenhaEstudanteFn = createServerFn({ method: "POST" })
  .validator((d: { id: number; novaSenha?: string }) => d)
  .handler(async ({ data }) => {
    const utils = await import("./server-utils");
    const admin = utils.getSession();
    if (!admin || admin.perfil !== "admin") {
      throw new Error("Não autorizado.");
    }
    return utils.resetSenhaEstudante(data.id, data.novaSenha);
  });

// ----------------------------------------------------
// ROUTINE DATA HANDLERS
// ----------------------------------------------------

export const getRotinaFn = createServerFn({ method: "GET" })
  .validator((d: { usuarioId: number; semana: string }) => d)
  .handler(async ({ data }) => {
    const utils = await import("./server-utils");
    const session = utils.getSession();
    if (!session) throw new Error("Não autenticado.");
    if (session.perfil !== "admin" && session.id !== data.usuarioId) {
      throw new Error("Não autorizado.");
    }

    const rotina = utils.getRotina(data.usuarioId, data.semana);
    return rotina;
  });

export const saveRotinaFn = createServerFn({ method: "POST" })
  .validator((d: { usuarioId: number; semana: string; form: any }) => d)
  .handler(async ({ data }) => {
    const utils = await import("./server-utils");
    const session = utils.getSession();
    if (!session) throw new Error("Não autenticado.");
    if (session.perfil !== "admin" && session.id !== data.usuarioId) {
      throw new Error("Não autorizado.");
    }
    console.log("saveRotinaFn payload:", JSON.stringify({ usuarioId: data.usuarioId, semana: data.semana, rows: data.form.rows?.map((r: any) => ({ start: r.start, days: Object.keys(r.days).reduce((acc: any, k: any) => { if (r.days[k].realizado || r.days[k].observacao_lida) acc[k] = r.days[k]; return acc; }, {}) })) }, null, 2));
    return utils.saveRotina(data.usuarioId, data.semana, data.form);
  });

export const getDashboardStatsFn = createServerFn({ method: "GET" })
  .validator((d: { semana?: string }) => d)
  .handler(async ({ data }) => {
    const utils = await import("./server-utils");
    const admin = utils.getSession();
    if (!admin || admin.perfil !== "admin") {
      throw new Error("Não autorizado.");
    }
    return utils.getDashboardStats(data.semana || "");
  });

export const getAdministradoresFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const utils = await import("./server-utils");
    const admin = utils.getSession();
    if (!admin || admin.perfil !== "admin") {
      throw new Error("Não autorizado.");
    }
    return utils.getAdministradores();
  });

export const saveAdministradorFn = createServerFn({ method: "POST" })
  .validator((d: { id: number | null; nome: string; loginOffice: string; senha: string }) => d)
  .handler(async ({ data }) => {
    const utils = await import("./server-utils");
    const admin = utils.getSession();
    if (!admin || admin.perfil !== "admin") {
      throw new Error("Não autorizado.");
    }
    return utils.saveAdministrador(data.id, data.nome, data.loginOffice, data.senha);
  });

export const deleteAdministradorFn = createServerFn({ method: "POST" })
  .validator((d: { id: number }) => d)
  .handler(async ({ data }) => {
    const utils = await import("./server-utils");
    const admin = utils.getSession();
    if (!admin || admin.perfil !== "admin") {
      throw new Error("Não autorizado.");
    }
    // Block deleting self
    if (admin.id === data.id) {
      throw new Error("Você não pode excluir o seu próprio usuário administrador.");
    }
    return utils.deleteAdministrador(data.id);
  });
