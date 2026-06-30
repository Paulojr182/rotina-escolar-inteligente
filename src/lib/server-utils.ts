import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { db } from "./db";

// Helper to get active session
export interface SessionUser {
  id: number;
  nome: string;
  login_office365: string;
  perfil: "admin" | "aluno";
  serie?: string;
  turma?: string;
  codigo_matricula?: string;
}

export function getSession(): SessionUser | null {
  const cookie = getCookie("session_auth");
  if (!cookie) return null;
  try {
    const raw = Buffer.from(cookie, "base64").toString("utf-8");
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function setSession(user: SessionUser) {
  const raw = Buffer.from(JSON.stringify(user)).toString("base64");
  setCookie("session_auth", raw, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

// Implementations for the handlers
export function login(data: { login: string; senha: string }) {
  const stmt = db.prepare("SELECT * FROM usuarios WHERE login_office365 = ?");
  const user = stmt.get(data.login) as any;

  if (!user || user.senha !== data.senha) {
    throw new Error("Login ou senha incorretos.");
  }

  const sessionUser: SessionUser = {
    id: user.id,
    nome: user.nome,
    login_office365: user.login_office365,
    perfil: user.perfil,
    serie: user.serie,
    turma: user.turma,
    codigo_matricula: user.codigo_matricula,
  };

  setSession(sessionUser);
  return { success: true, user: sessionUser };
}

export function logout() {
  deleteCookie("session_auth", { path: "/" });
  return { success: true };
}

export function importEstudantes(data: any[]) {
  let inserted = 0;
  let updated = 0;

  const checkStmt = db.prepare(`
    SELECT id FROM usuarios 
    WHERE codigo_matricula = ? OR login_office365 = ?
  `);

  const updateStmt = db.prepare(`
    UPDATE usuarios 
    SET nome = ?, login_office365 = ?, senha = ?, serie = ?, turma = ?
    WHERE id = ?
  `);

  const insertStmt = db.prepare(`
    INSERT INTO usuarios (nome, login_office365, senha, perfil, serie, turma, codigo_matricula)
    VALUES (?, ?, ?, 'aluno', ?, ?, ?)
  `);

  db.exec("BEGIN TRANSACTION;");
  try {
    for (const row of data) {
      if (!row.CODIGOMATRICULA || !row.LOGINOFFICE365) continue;

      const existing = checkStmt.get(row.CODIGOMATRICULA, row.LOGINOFFICE365) as { id: number } | undefined;
      if (existing) {
        updateStmt.run(
          row.NOMEALUNO,
          row.LOGINOFFICE365,
          row.SENHA,
          row.SERIE,
          row.TURMA,
          existing.id
        );
        updated++;
      } else {
        insertStmt.run(
          row.NOMEALUNO,
          row.LOGINOFFICE365,
          row.SENHA,
          row.SERIE,
          row.TURMA,
          row.CODIGOMATRICULA
        );
        inserted++;
      }
    }
    db.exec("COMMIT;");
  } catch (e: any) {
    db.exec("ROLLBACK;");
    throw new Error(`Erro ao importar: ${e.message}`);
  }

  return { success: true, inserted, updated };
}

export function getEstudantes(data: { serie?: string; turma?: string; alunoId?: string; semana?: string }) {
  let queryStr = `
    SELECT u.id, u.nome, u.login_office365, u.senha, u.serie, u.turma, u.codigo_matricula,
           r.id as rotina_id, r.status, r.semana, r.orientadora, r.atualizado_em, r.enviado_em
    FROM usuarios u
    LEFT JOIN rotinas r ON u.id = r.usuario_id ${data.semana ? "AND r.semana = ?" : ""}
    WHERE u.perfil = 'aluno'
  `;

  const params: any[] = [];
  if (data.semana) {
    params.push(data.semana);
  }

  if (data.serie) {
    queryStr += " AND u.serie = ?";
    params.push(data.serie);
  }
  if (data.turma) {
    queryStr += " AND u.turma = ?";
    params.push(data.turma);
  }
  if (data.alunoId) {
    queryStr += " AND u.id = ?";
    params.push(Number(data.alunoId));
  }

  queryStr += " ORDER BY u.nome ASC";

  const stmt = db.prepare(queryStr);
  const rows = stmt.all(...params) as any[];

  const result = rows.map((row) => {
    let totalItens = 0;
    let realizados = 0;
    let pendentesDeRealizacao = 0;

    if (row.rotina_id) {
      const itemsStmt = db.prepare("SELECT realizado, descricao FROM rotina_itens WHERE rotina_id = ?");
      const items = itemsStmt.all(row.rotina_id) as any[];
      totalItens = items.length;
      items.forEach((it) => {
        if (it.realizado === 1) {
          realizados++;
        } else if (it.descricao && it.descricao.trim()) {
          pendentesDeRealizacao++;
        }
      });
    }

    return {
      id: row.id,
      nome: row.nome,
      login_office365: row.login_office365,
      senha: row.senha,
      serie: row.serie,
      turma: row.turma,
      codigo_matricula: row.codigo_matricula,
      rotina: row.rotina_id ? {
        id: row.rotina_id,
        semana: row.semana,
        status: row.status,
        orientadora: row.orientadora,
        atualizado_em: row.atualizado_em,
        enviado_em: row.enviado_em,
        totalItens,
        realizados,
        pendentesDeRealizacao,
      } : null,
    };
  });

  return result;
}

export function editEstudante(data: any) {
  const stmt = db.prepare(`
    UPDATE usuarios 
    SET nome = ?, login_office365 = ?, senha = ?, serie = ?, turma = ?
    WHERE id = ?
  `);
  stmt.run(data.nome, data.login_office365, data.senha, data.serie, data.turma, data.id);
  return { success: true };
}

export function deleteEstudante(id: number) {
  const stmt = db.prepare("DELETE FROM usuarios WHERE id = ?");
  stmt.run(id);
  return { success: true };
}

export function resetSenhaEstudante(id: number, novaSenha?: string) {
  const senha = novaSenha || "123456";
  const stmt = db.prepare("UPDATE usuarios SET senha = ? WHERE id = ?");
  stmt.run(senha, id);
  return { success: true, senha };
}

export function getRotina(usuarioId: number, semana: string) {
  const rotinaStmt = db.prepare("SELECT * FROM rotinas WHERE usuario_id = ? AND semana = ?");
  const rotina = rotinaStmt.get(usuarioId, semana) as any;

  if (!rotina) return null;

  const itensStmt = db.prepare("SELECT * FROM rotina_itens WHERE rotina_id = ?");
  const itens = itensStmt.all(rotina.id) as any[];

  const rowsMap: Record<string, any> = {};
  itens.forEach((it) => {
    const key = `${it.horario_inicio}-${it.horario_fim}`;
    if (!rowsMap[key]) {
      rowsMap[key] = {
        id: `row-${key}`,
        start: it.horario_inicio,
        end: it.horario_fim,
        days: {
          mon: { text: "", category: null, realizado: false, data_realizacao: "", observacao_lida: false },
          tue: { text: "", category: null, realizado: false, data_realizacao: "", observacao_lida: false },
          wed: { text: "", category: null, realizado: false, data_realizacao: "", observacao_lida: false },
          thu: { text: "", category: null, realizado: false, data_realizacao: "", observacao_lida: false },
          fri: { text: "", category: null, realizado: false, data_realizacao: "", observacao_lida: false },
          sat: { text: "", category: null, realizado: false, data_realizacao: "", observacao_lida: false },
          sun: { text: "", category: null, realizado: false, data_realizacao: "", observacao_lida: false },
        },
      };
    }
    rowsMap[key].days[it.dia_semana] = {
      text: it.descricao || "",
      category: it.categoria || null,
      realizado: it.realizado === 1,
      data_realizacao: it.data_realizacao || "",
      observacao_lida: it.observacao_lida === 1,
    };
  });

  return {
    id: rotina.id,
    studentName: "",
    classGroup: "",
    week: rotina.semana,
    advisor: rotina.orientadora || "",
    status: rotina.status,
    focus: {
      attention: rotina.materias_atencao || "",
      evaluations: rotina.avaliacoes || "",
      goals: rotina.metas || "",
      notes: rotina.observacoes || "",
    },
    rows: Object.values(rowsMap),
    sentAt: rotina.enviado_em,
    updatedAt: rotina.atualizado_em,
  };
}

export function saveRotina(usuarioId: number, semana: string, form: any) {
  db.exec("BEGIN TRANSACTION;");
  try {
    const checkStmt = db.prepare("SELECT id FROM rotinas WHERE usuario_id = ? AND semana = ?");
    const existing = checkStmt.get(usuarioId, semana) as { id: number } | undefined;

    let rotinaId = existing?.id;
    const nowStr = new Date().toISOString();

    if (existing) {
      const updateStmt = db.prepare(`
        UPDATE rotinas 
        SET status = ?, orientadora = ?, materias_atencao = ?, avaliacoes = ?, metas = ?, observacoes = ?, enviado_em = ?, atualizado_em = ?
        WHERE id = ?
      `);
      updateStmt.run(
        form.status,
        form.advisor || "",
        form.focus.attention || "",
        form.focus.evaluations || "",
        form.focus.goals || "",
        form.focus.notes || "",
        form.status === "sent" ? (form.sentAt || nowStr) : null,
        nowStr,
        existing.id
      );
    } else {
      const insertStmt = db.prepare(`
        INSERT INTO rotinas (usuario_id, semana, status, orientadora, materias_atencao, avaliacoes, metas, observacoes, enviado_em, atualizado_em)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const res = insertStmt.run(
        usuarioId,
        semana,
        form.status,
        form.advisor || "",
        form.focus.attention || "",
        form.focus.evaluations || "",
        form.focus.goals || "",
        form.focus.notes || "",
        form.status === "sent" ? nowStr : null,
        nowStr
      );
      rotinaId = res.lastInsertRowid as number;
    }

    const deleteItensStmt = db.prepare("DELETE FROM rotina_itens WHERE rotina_id = ?");
    deleteItensStmt.run(rotinaId);

    const insertItemStmt = db.prepare(`
      INSERT INTO rotina_itens (rotina_id, horario_inicio, horario_fim, dia_semana, categoria, descricao, realizado, data_realizacao, observacao_lida)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const row of form.rows) {
      for (const dayKey of Object.keys(row.days)) {
        const cell = row.days[dayKey];
        insertItemStmt.run(
          rotinaId,
          row.start,
          row.end,
          dayKey,
          cell.category || null,
          cell.text || "",
          cell.realizado ? 1 : 0,
          cell.realizado ? (cell.data_realizacao || nowStr) : null,
          cell.observacao_lida ? 1 : 0
        );
      }
    }

    db.exec("COMMIT;");
    return { success: true, rotinaId };
  } catch (e: any) {
    db.exec("ROLLBACK;");
    throw new Error(`Erro ao salvar rotina: ${e.message}`);
  }
}

export function getDashboardStats(semana: string) {
  const totalStmt = db.prepare("SELECT count(*) as count FROM usuarios WHERE perfil = 'aluno'");
  const totalAlunos = (totalStmt.get() as { count: number }).count;

  const preencheramStmt = db.prepare(`
    SELECT count(distinct usuario_id) as count 
    FROM rotinas 
    WHERE semana = ? AND status IN ('sent', 'reviewed')
  `);
  const preencheram = (preencheramStmt.get(semana) as { count: number }).count;

  const naoPreencheram = totalAlunos - preencheram;

  const pendentesStmt = db.prepare(`
    SELECT count(distinct r.usuario_id) as count
    FROM rotinas r
    JOIN rotina_itens ri ON r.id = ri.rotina_id
    WHERE r.semana = ? AND ri.descricao IS NOT NULL AND ri.descricao != '' AND ri.realizado = 0
  `);
  const pendentesRealizacao = (pendentesStmt.get(semana) as { count: number }).count;

  const weeksStmt = db.prepare("SELECT distinct semana FROM rotinas ORDER BY semana DESC");
  const weeks = (weeksStmt.all() as { semana: string }[]).map(w => w.semana);

  return {
    totalAlunos,
    preencheram,
    naoPreencheram,
    pendentesRealizacao,
    weeks,
  };
}

export function getAdministradores() {
  const stmt = db.prepare("SELECT id, nome, login_office365, senha, perfil FROM usuarios WHERE perfil = 'admin' ORDER BY nome ASC");
  return stmt.all() as any[];
}

export function saveAdministrador(id: number | null, nome: string, loginOffice: string, senha: string) {
  if (id) {
    db.prepare(`
      UPDATE usuarios 
      SET nome = ?, login_office365 = ?, senha = ?
      WHERE id = ? AND perfil = 'admin'
    `).run(nome, loginOffice, senha, id);
    return { success: true, id };
  } else {
    const res = db.prepare(`
      INSERT INTO usuarios (nome, login_office365, senha, perfil)
      VALUES (?, ?, ?, 'admin')
    `).run(nome, loginOffice, senha);
    return { success: true, id: res.lastInsertRowid };
  }
}

export function deleteAdministrador(id: number) {
  const res = db.prepare("DELETE FROM usuarios WHERE id = ? AND perfil = 'admin'").run(id);
  if (res.changes === 0) {
    throw new Error("Administrador não encontrado ou não pôde ser excluído.");
  }
  return { success: true };
}
