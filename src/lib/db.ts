import { DatabaseSync } from "node:sqlite";
import path from "node:path";

let db: DatabaseSync;

// In a serverless/SSR environment like TanStack Start, prevent creating multiple connection pools during dev reloading
if (process.env.NODE_ENV === "production") {
  db = new DatabaseSync("database.db");
} else {
  if (!(globalThis as any)._db) {
    (globalThis as any)._db = new DatabaseSync("database.db");
  }
  db = (globalThis as any)._db;
}

// Enable foreign keys
db.exec("PRAGMA foreign_keys = ON;");

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    login_office365 TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    perfil TEXT NOT NULL CHECK(perfil IN ('admin', 'aluno')),
    serie TEXT,
    turma TEXT,
    codigo_matricula TEXT UNIQUE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS rotinas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    semana TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('draft', 'sent', 'reviewed', 'returned')),
    orientadora TEXT,
    materias_atencao TEXT,
    avaliacoes TEXT,
    metas TEXT,
    observacoes TEXT,
    enviado_em TEXT,
    atualizado_em TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS rotina_itens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rotina_id INTEGER NOT NULL,
    horario_inicio TEXT NOT NULL,
    horario_fim TEXT NOT NULL,
    dia_semana TEXT NOT NULL,
    categoria TEXT,
    descricao TEXT,
    realizado INTEGER NOT NULL DEFAULT 0 CHECK(realizado IN (0, 1)),
    data_realizacao TEXT,
    FOREIGN KEY (rotina_id) REFERENCES rotinas(id) ON DELETE CASCADE
  );
`);

try {
  db.exec("ALTER TABLE rotina_itens ADD COLUMN observacao_lida INTEGER DEFAULT 0;");
} catch (e) {
  // A coluna já existe, ignorar erro
}

// Insert default admin if none exists
const checkAdmin = db.prepare("SELECT count(*) as count FROM usuarios WHERE perfil = 'admin'");
const adminCount = (checkAdmin.get() as { count: number }).count;

if (adminCount === 0) {
  const insertAdmin = db.prepare(`
    INSERT INTO usuarios (nome, login_office365, senha, perfil)
    VALUES (?, ?, ?, ?)
  `);
  insertAdmin.run(
    "Administrador",
    "admin",
    "admin2026", // Plain text password since it's a simple school routine dashboard requirements
    "admin"
  );
  insertAdmin.run(
    "Administrador E-mail",
    "admin@admin.com",
    "admin2026",
    "admin"
  );
  console.log("Default admin account created: admin / admin2026 and admin@admin.com / admin2026");
}

export { db };
