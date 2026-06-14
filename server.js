const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
const SECRET = 'aafati_secret_2024';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

function adminAuth(req, res, next) {
  auth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    next();
  });
}

// ─── Auth ────────────────────────────────────────────────────────────────────

app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  const membro = db.prepare('SELECT * FROM membros WHERE email = ?').get(email);
  if (!membro || !bcrypt.compareSync(senha, membro.senha))
    return res.status(401).json({ error: 'Email ou senha inválidos' });
  const token = jwt.sign({ id: membro.id, role: membro.role }, SECRET, { expiresIn: '7d' });
  res.json({ token, role: membro.role, id: membro.id, nome: membro.nome });
});

// ─── Cadastro ────────────────────────────────────────────────────────────────

app.post('/api/membros', (req, res) => {
  const { nome, cpf, rg, email, senha, telefone, data_nascimento, endereco, familia, regiao } = req.body;
  if (!nome || !cpf || !email || !senha || !familia || !regiao)
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  try {
    const hash = bcrypt.hashSync(senha, 10);
    const hoje = new Date().toISOString().split('T')[0];
    const r = db.prepare(`
      INSERT INTO membros (nome,cpf,rg,email,senha,telefone,data_nascimento,endereco,familia,regiao,data_inscricao)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `).run(nome, cpf, rg, email, hash, telefone, data_nascimento, endereco, familia, regiao, hoje);
    const ano = new Date().getFullYear();
    db.prepare('INSERT INTO anuidades (membro_id,ano,valor) VALUES (?,?,?)').run(r.lastInsertRowid, ano, 50.00);
    res.json({ success: true, id: r.lastInsertRowid });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'CPF ou email já cadastrado' });
    res.status(500).json({ error: e.message });
  }
});

// ─── Perfil do membro ────────────────────────────────────────────────────────

app.get('/api/membros/:id', auth, (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id))
    return res.status(403).json({ error: 'Acesso negado' });
  const m = db.prepare('SELECT id,nome,cpf,rg,email,telefone,data_nascimento,endereco,familia,regiao,data_inscricao,status,role FROM membros WHERE id=?').get(req.params.id);
  if (!m) return res.status(404).json({ error: 'Membro não encontrado' });
  res.json(m);
});

app.put('/api/membros/:id', auth, (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id))
    return res.status(403).json({ error: 'Acesso negado' });
  const { nome, telefone, endereco, familia, regiao, rg, data_nascimento } = req.body;
  db.prepare('UPDATE membros SET nome=?,telefone=?,endereco=?,familia=?,regiao=?,rg=?,data_nascimento=? WHERE id=?')
    .run(nome, telefone, endereco, familia, regiao, rg, data_nascimento, req.params.id);
  res.json({ success: true });
});

// ─── Anuidades ───────────────────────────────────────────────────────────────

app.get('/api/membros/:id/anuidades', auth, (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id))
    return res.status(403).json({ error: 'Acesso negado' });
  const rows = db.prepare('SELECT * FROM anuidades WHERE membro_id=? ORDER BY ano DESC').all(req.params.id);
  res.json(rows);
});

app.post('/api/membros/:id/anuidades/pagar', auth, (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id))
    return res.status(403).json({ error: 'Acesso negado' });
  const { ano } = req.body;
  const hoje = new Date().toISOString().split('T')[0];
  db.prepare("UPDATE anuidades SET status='pago', data_pagamento=? WHERE membro_id=? AND ano=?")
    .run(hoje, req.params.id, ano);
  res.json({ success: true, mensagem: 'Pagamento registrado. Entre em contato com a secretaria para confirmar.' });
});

// ─── Reuniões ─────────────────────────────────────────────────────────────────

app.get('/api/reunioes', auth, (req, res) => {
  const rows = db.prepare('SELECT * FROM reunioes ORDER BY data DESC').all();
  res.json(rows);
});

app.post('/api/reunioes', adminAuth, (req, res) => {
  const { titulo, data, horario, local, descricao } = req.body;
  const r = db.prepare('INSERT INTO reunioes (titulo,data,horario,local,descricao,criado_por) VALUES (?,?,?,?,?,?)')
    .run(titulo, data, horario, local, descricao, req.user.id);
  res.json({ success: true, id: r.lastInsertRowid });
});

app.get('/api/membros/:id/presencas', auth, (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id))
    return res.status(403).json({ error: 'Acesso negado' });
  const rows = db.prepare(`
    SELECT p.*, r.titulo, r.data, r.horario, r.local
    FROM presencas p JOIN reunioes r ON p.reuniao_id = r.id
    WHERE p.membro_id=? ORDER BY r.data DESC
  `).all(req.params.id);
  res.json(rows);
});

app.post('/api/presencas', adminAuth, (req, res) => {
  const { membro_id, reuniao_id, presente, observacao } = req.body;
  db.prepare(`
    INSERT INTO presencas (membro_id,reuniao_id,presente,observacao)
    VALUES (?,?,?,?)
    ON CONFLICT(membro_id,reuniao_id) DO UPDATE SET presente=excluded.presente, observacao=excluded.observacao
  `).run(membro_id, reuniao_id, presente ? 1 : 0, observacao);
  res.json({ success: true });
});

// ─── Benefícios ──────────────────────────────────────────────────────────────

app.get('/api/membros/:id/beneficios', auth, (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id))
    return res.status(403).json({ error: 'Acesso negado' });
  const rows = db.prepare('SELECT * FROM beneficios WHERE membro_id=? ORDER BY data_solicitacao DESC').all(req.params.id);
  res.json(rows);
});

app.post('/api/membros/:id/beneficios', auth, (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id))
    return res.status(403).json({ error: 'Acesso negado' });
  const { tipo, descricao } = req.body;
  if (!tipo || !descricao) return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  const hoje = new Date().toISOString().split('T')[0];
  const r = db.prepare(`
    INSERT INTO beneficios (membro_id,tipo,descricao,data_solicitacao)
    VALUES (?,?,?,?)
  `).run(req.params.id, tipo, descricao, hoje);
  res.json({ success: true, id: r.lastInsertRowid });
});

app.put('/api/beneficios/:id', adminAuth, (req, res) => {
  const { data_agendada, horario_agendado, taxa, status_taxa, status, observacao_admin } = req.body;
  db.prepare(`
    UPDATE beneficios SET data_agendada=?,horario_agendado=?,taxa=?,status_taxa=?,status=?,observacao_admin=?
    WHERE id=?
  `).run(data_agendada, horario_agendado, taxa || 0, status_taxa, status, observacao_admin, req.params.id);
  res.json({ success: true });
});

app.post('/api/beneficios/:id/pagar-taxa', auth, (req, res) => {
  const b = db.prepare('SELECT * FROM beneficios WHERE id=?').get(req.params.id);
  if (!b) return res.status(404).json({ error: 'Benefício não encontrado' });
  if (req.user.role !== 'admin' && req.user.id !== b.membro_id)
    return res.status(403).json({ error: 'Acesso negado' });
  const hoje = new Date().toISOString().split('T')[0];
  db.prepare("UPDATE beneficios SET status_taxa='pago', data_pagamento_taxa=? WHERE id=?").run(hoje, req.params.id);
  res.json({ success: true, mensagem: 'Pagamento registrado. Confirme com a secretaria.' });
});

// ─── Admin ───────────────────────────────────────────────────────────────────

app.get('/api/admin/membros', adminAuth, (req, res) => {
  const rows = db.prepare('SELECT id,nome,cpf,email,telefone,familia,regiao,data_inscricao,status FROM membros WHERE role=? ORDER BY nome').all('membro');
  res.json(rows);
});

app.get('/api/admin/stats', adminAuth, (req, res) => {
  const total = db.prepare("SELECT COUNT(*) as n FROM membros WHERE role='membro'").get().n;
  const ativos = db.prepare("SELECT COUNT(*) as n FROM membros WHERE role='membro' AND status='ativo'").get().n;
  const anuidades_pendentes = db.prepare("SELECT COUNT(*) as n FROM anuidades WHERE status='pendente'").get().n;
  const beneficios_pendentes = db.prepare("SELECT COUNT(*) as n FROM beneficios WHERE status='pendente'").get().n;
  const reunioes = db.prepare('SELECT COUNT(*) as n FROM reunioes').get().n;
  res.json({ total, ativos, anuidades_pendentes, beneficios_pendentes, reunioes });
});

app.get('/api/stats', (req, res) => {
  const ativos = db.prepare("SELECT COUNT(*) as n FROM membros WHERE role='membro' AND status='ativo'").get().n;
  const reunioes = db.prepare('SELECT COUNT(*) as n FROM reunioes').get().n;
  res.json({ ativos, reunioes });
});

app.get('/api/admin/beneficios', adminAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT b.*, m.nome as membro_nome, m.familia, m.regiao
    FROM beneficios b JOIN membros m ON b.membro_id = m.id
    ORDER BY b.data_solicitacao DESC
  `).all();
  res.json(rows);
});

// ─── Regiões e famílias ──────────────────────────────────────────────────────

app.get('/api/regioes', (req, res) => {
  res.json([
    'Sede - Itanagra',
    "Pau d'arco",
    'Novo Horizonte 1',
    'Novo Horizonte 2',
    'Novo Horizonte 3',
    'Novo Horizonte 4',
    'Cajá',
    'Outra'
  ]);
});

// ─── Fallback SPA ────────────────────────────────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AAFATI rodando em http://localhost:${PORT}`));
