# Family Finance App

Aplicacao de controle financeiro familiar para um casal, com gestao de rendas, contas, gastos diarios, cartoes de credito, vale-alimentacao, dividas e investimentos.

## Tecnologias

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Banco de Dados**: PostgreSQL
- **Infraestrutura**: Docker + Docker Compose

## Requisitos

- Docker
- Docker Compose

## Execucao

### 1. Clone o repositorio

```bash
cd family-finance-app
```

### 2. Configure as variaveis de ambiente

Copie os arquivos de exemplo e ajuste conforme necessario:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Suba os containers

```bash
docker compose up --build
```

Este comando ira:
- Criar e iniciar o container PostgreSQL
- Criar e iniciar o container do Backend (Node.js)
- Criar e iniciar o container do Frontend (React)
- Executar o schema do banco de dados automaticamente

### 4. Acesse a aplicacao

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api
- **PostgreSQL**: localhost:5432

## Primeiro Acesso

1. Acesse http://localhost:5173
2. Clique em "Criar conta"
3. Preencha nome, email e senha
4. Voce sera redirecionado para o Dashboard

## Estrutura do Projeto

```
family-finance-app/
├── docker-compose.yml
├── backend/
│   ├── src/
│   │   ├── config/         # Configuracoes (database, auth)
│   │   ├── controllers/    # Controllers da API
│   │   ├── models/         # Modelos de acesso ao banco
│   │   ├── routes/         # Rotas da API
│   │   ├── middleware/     # Middleware (auth, validation, error)
│   │   ├── utils/          # Funcoes utilitarias
│   │   ├── database/       # Schema SQL e seeds
│   │   ├── app.js          # Configuracao do Express
│   │   └── server.js       # Ponto de entrada do servidor
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/            # Servicos de API (axios)
│   │   ├── components/     # Componentes reutilizaveis
│   │   ├── pages/          # Paginas da aplicacao
│   │   ├── context/        # Contextos React (Auth, Month)
│   │   ├── hooks/          # Hooks customizados
│   │   ├── utils/          # Funcoes utilitarias
│   │   ├── styles/         # Estilos globais
│   │   ├── App.jsx         # Componente principal
│   │   └── main.jsx        # Ponto de entrada do React
│   ├── index.html
│   ├── vite.config.js
│   └── Dockerfile
└── README.md
```

## Funcionalidades

- **Autenticacao**: Login e registro com JWT
- **Dados Fixos**: Cadastro de rendas e contas fixas, definicao de teto semanal
- **Gastos Diarios**: Registro de gastos com forma de pagamento e responsavel
- **Cartoes de Credito**: Cadastro de cartoes, registro de gastos (avista e parcelado)
- **Vale-Alimentacao**: Controle de credito e gastos com VA
- **Dividas**: Gestao de dividas e emprestimos com parcelas
- **Investimentos**: Cadastro e acompanhamento de investimentos
- **Dashboard**: Visao geral com resumo semanal, tetos e saldo projetado
- **Relatorio Mensal**: Relatorio profissional com receitas vs gastos

## Endpoints da API

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | /api/auth/register | Registro de usuario |
| POST | /api/auth/login | Login |
| GET | /api/users/me | Dados do usuario |
| PUT | /api/users/me | Atualizar usuario |
| GET | /api/fixed-incomes | Listar rendas fixas |
| POST | /api/fixed-incomes | Criar renda fixa |
| GET | /api/fixed-expenses | Listar contas fixas |
| POST | /api/fixed-expenses | Criar conta fixa |
| GET | /api/weekly-budget | Consultar teto semanal |
| PUT | /api/weekly-budget | Definir teto semanal |
| GET | /api/daily-expenses?month=X&year=Y | Listar gastos diarios |
| POST | /api/daily-expenses | Registrar gasto diario |
| GET | /api/credit-cards | Listar cartoes |
| POST | /api/credit-cards | Criar cartao |
| POST | /api/credit-cards/:id/expenses | Registrar gasto no cartao |
| GET | /api/meal-vouchers | Listar vales |
| POST | /api/meal-vouchers | Criar vale |
| POST | /api/meal-vouchers/:id/expenses | Registrar gasto com VA |
| GET | /api/debts | Listar dividas |
| POST | /api/debts | Criar divida |
| GET | /api/investments | Listar investimentos |
| POST | /api/investments | Criar investimento |
| GET | /api/reports/dashboard?month=X&year=Y | Dashboard |
| GET | /api/reports/monthly?month=X&year=Y | Relatorio mensal |

## Comandos Uteis

### Parar os containers

```bash
docker compose down
```

### Parar e remover volumes (limpar dados)

```bash
docker compose down -v
```

### Ver logs

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### Reconstruir containers

```bash
docker compose up --build
```

## Desenvolvimento Local (sem Docker)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Ajuste DATABASE_URL para seu PostgreSQL local
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
