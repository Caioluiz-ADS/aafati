# 🌱 AAFATI — Associação de Agricultura Familiar e Avanço Tecnológico de Itanagra

Site institucional e sistema de gestão de associados da **AAFATI**, uma associação de agricultores familiares de Itanagra, Bahia.

🔗 **Site no ar:** https://aafati.onrender.com

---

## 🎯 Objetivo

O projeto atende dois públicos — a comunidade em geral e os associados/administração — com três objetivos principais:

1. **Apresentar a associação** ao público (quem é, o que faz, benefícios e regiões atendidas).
2. **Permitir o cadastro online** de novos associados.
3. **Gerenciar os membros** por meio de uma área do associado e um painel administrativo (anuidades, reuniões, presenças e benefícios).

---

## 💻 Tecnologias utilizadas

### Front-end
- **HTML5** — estrutura das páginas
- **CSS3** — visual próprio (tipografia *Fraunces* + *Plus Jakarta Sans*, ícones SVG e animações)
- **JavaScript** (vanilla, sem framework) — interatividade e comunicação com a API

### Back-end
- **Node.js** — ambiente de execução do servidor
- **Express** — framework para as rotas e a API
- **SQLite** (`node:sqlite`) — banco de dados
- **JWT** (jsonwebtoken) — autenticação por token
- **bcrypt** (bcryptjs) — criptografia de senhas

### Ferramentas
- **Git / GitHub** — controle de versão
- **Render** — hospedagem (com deploy automático)

---

## 🗂️ Páginas

| Página | Função |
|---|---|
| `index.html` | Home institucional (sobre, benefícios, regiões, contato, estatísticas) |
| `associar.html` | Formulário de cadastro de novo associado |
| `login.html` | Tela de login |
| `membro.html` | Área do associado (perfil, anuidades, reuniões, benefícios) |
| `admin.html` | Painel do administrador (membros, benefícios, estatísticas) |

---

## ⚙️ Funcionalidades

- Cadastro e login de associados com senha criptografada
- Perfil do membro com dados editáveis
- Controle de anuidades
- Agenda de reuniões e registro de presenças
- Solicitação e acompanhamento de benefícios
- Painel administrativo com estatísticas e gestão dos membros

---

## 🚀 Como rodar localmente

Requer **Node.js 24 ou superior** (por causa do `node:sqlite`).

```bash
# 1. Instalar as dependências
npm install

# 2. Iniciar o servidor
npm start
```

O site ficará disponível em **http://localhost:3000**.

### Acesso de administrador (padrão)
- **E-mail:** `admin@aafati.org`
- **Senha:** `admin123`

---

## 📁 Estrutura do projeto

```
aafati/
├── server.js         # Servidor Express e rotas da API
├── database.js       # Criação das tabelas e conexão com o SQLite
├── package.json      # Dependências e scripts
├── render.yaml       # Configuração de deploy no Render
└── public/           # Front-end
    ├── index.html
    ├── associar.html
    ├── login.html
    ├── membro.html
    ├── admin.html
    ├── css/style.css
    └── js/site.js
```

---

Desenvolvido para a AAFATI — Itanagra/BA.
