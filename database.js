const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = process.env.DATA_DIR || __dirname;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'aafati.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS membros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE NOT NULL,
    rg TEXT,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    telefone TEXT,
    data_nascimento TEXT,
    endereco TEXT,
    familia TEXT NOT NULL,
    regiao TEXT NOT NULL,
    data_inscricao TEXT NOT NULL,
    status TEXT DEFAULT 'ativo',
    role TEXT DEFAULT 'membro'
  );

  CREATE TABLE IF NOT EXISTS anuidades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    membro_id INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    valor REAL NOT NULL DEFAULT 50.00,
    status TEXT DEFAULT 'pendente',
    data_pagamento TEXT,
    FOREIGN KEY (membro_id) REFERENCES membros(id)
  );

  CREATE TABLE IF NOT EXISTS reunioes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    data TEXT NOT NULL,
    horario TEXT NOT NULL,
    local TEXT,
    descricao TEXT,
    criado_por INTEGER
  );

  CREATE TABLE IF NOT EXISTS presencas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    membro_id INTEGER NOT NULL,
    reuniao_id INTEGER NOT NULL,
    presente INTEGER DEFAULT 0,
    observacao TEXT,
    UNIQUE(membro_id, reuniao_id),
    FOREIGN KEY (membro_id) REFERENCES membros(id),
    FOREIGN KEY (reuniao_id) REFERENCES reunioes(id)
  );

  CREATE TABLE IF NOT EXISTS beneficios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    membro_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    data_solicitacao TEXT NOT NULL,
    data_agendada TEXT,
    horario_agendado TEXT,
    taxa REAL DEFAULT 0,
    status_taxa TEXT DEFAULT 'isento',
    data_pagamento_taxa TEXT,
    status TEXT DEFAULT 'pendente',
    observacao_admin TEXT,
    FOREIGN KEY (membro_id) REFERENCES membros(id)
  );
`);

const bcrypt = require('bcryptjs');
const adminExiste = db.prepare('SELECT id FROM membros WHERE role = ?').get('admin');
if (!adminExiste) {
  const senha = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO membros (nome, cpf, email, senha, familia, regiao, data_inscricao, role)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('Administrador', '000.000.000-00', 'admin@aafati.org', senha, 'Administração', 'Itanagra', new Date().toISOString().split('T')[0], 'admin');
}

module.exports = db;
