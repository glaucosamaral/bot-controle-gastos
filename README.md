# Bot Controle de Gastos

> **v0.3.0** â€” release: auth JWT (login Telegram), categorias e relatÃ³rio mensal na API, dashboard React e workflow n8n com fallback de chatId. Consulte CHANGELOG/git log para o detalhe completo.

Registre e acompanhe gastos pelo Telegram: envie uma mensagem, o **n8n** encaminha
para a **API** e o resumo aparece no **dashboard** web.

## Arquitetura

| ServiÃƒÂ§o  | Stack                                  | Papel                                   |
|----------|----------------------------------------|-----------------------------------------|
| backend  | Node.js 22, Express, TypeScript, pg, zod | API REST (expenses, categories, reports) |
| frontend | React, Vite, TypeScript                | Dashboard com relatÃƒÂ³rio mensal          |
| n8n      | n8n (workflow)                         | Recebe mensagens do Telegram e chama a API |
| postgres | PostgreSQL 16                          | PersistÃƒÂªncia (tabelas + migraÃƒÂ§ÃƒÂµes)      |

Fluxo: **Telegram Ã¢â€ â€™ n8n (webhook) Ã¢â€ â€™ `POST /api/v1/expenses` Ã¢â€ â€™ Postgres Ã¢â€ â€™ dashboard**.

## Como rodar localmente

PrÃƒÂ©-requisitos: Docker e Docker Compose.

1. Crie o `.env` a partir do exemplo:

   ```bash
   cp .env.example .env
   ```

2. Preencha `POSTGRES_PASSWORD`, `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`,
   `JWT_SECRET`, `N8N_WEBHOOK_SECRET`, `VITE_TELEGRAM_BOT_USERNAME` e
   `N8N_WEBHOOK_URL`.

3. Suba os serviÃƒÂ§os:

   ```bash
   docker compose up --build
   ```

4. Acesse:
   - Dashboard: http://localhost:5173
   - Backend (health): http://localhost:3001/health
   - n8n: http://localhost:5678

O Postgres local fica na porta **5433** para nÃƒÂ£o conflitar com um Postgres jÃƒÂ¡
instalado na 5432.

### Enviar gasto pelo Telegram

Crie o bot com o [@BotFather](https://t.me/BotFather), configure o token no
workflow do n8n e aponte o webhook para uma URL pÃƒÂºblica HTTPS (ex.: tailnet).
Formato da mensagem:

```
mercado 85.50 alimentacao
```

## API

VersÃƒÂ£o 1 (`/api/v1`). Erros seguem o formato:

```json
{ "error": { "code": "DADOS_INVALIDOS", "message": "..." } }
```

As rotas de leitura exigem `Authorization: Bearer <JWT>`; o **POST /expenses**
exige o header `X-Webhook-Secret` (compartilhado com o n8n).

| MÃƒÂ©todo | Rota                                   | DescriÃƒÂ§ÃƒÂ£o                          |
|--------|----------------------------------------|------------------------------------|
| GET    | `/health`                              | Health check                       |
| POST   | `/auth/telegram`                       | Troca o payload do widget do Telegram por um JWT |
| POST   | `/expenses`                            | Cria um gasto (usado pelo n8n)     |
| GET    | `/expenses?pagina=1&limite=20`         | Lista gastos do usuÃƒÂ¡rio autenticado, paginado |
| GET    | `/categories`                          | Lista categorias                   |
| GET    | `/reports/monthly?mes=AAAA-MM`         | Total por categoria no mÃƒÂªs do usuÃƒÂ¡rio autenticado |

### AutenticaÃƒÂ§ÃƒÂ£o

O login usa o [Telegram Login Widget](https://core.telegram.org/widgets/login):
o bot deve ter o domÃƒÂ­nio do dashboard cadastrado no @BotFather (`/setdomain`).
O backend valida o hash recebido contra o token do bot, cadastra o usuÃƒÂ¡rio e
devolve um JWT (HS256, padrÃƒÂ£o 7 dias). No n8n, o `X-Webhook-Secret` ÃƒÂ© lido de
`N8N_WEBHOOK_SECRET` com `=$env.N8N_WEBHOOK_SECRET`.

### POST /expenses

Requer header `X-Webhook-Secret: <N8N_WEBHOOK_SECRET>`.

```json
{
  "telegramId": "123456",
  "descricao": "mercado",
  "valorCentavos": 8550,
  "categoria": "alimentacao",
  "dataGasto": "2026-09-18"
}
```

`categoria` e `dataGasto` sÃƒÂ£o opcionais.

## Banco de dados

MigraÃƒÂ§ÃƒÂµes SQL ficam em `db/migrations/` e sÃƒÂ£o aplicadas automaticamente na
primeira subida do contÃƒÂªiner do Postgres (`001_init.sql`). Tabelas `usuarios`,
`categorias` e `gastos` em snake_case; valores monetÃƒÂ¡rios em centavos (`INTEGER`).

## Estrutura do projeto

```
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ backend/        # API REST (Express + TypeScript)
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ frontend/       # Dashboard (React + Vite)
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ db/migrations/  # SQL de migraÃƒÂ§ÃƒÂ£o
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ n8n/workflows/  # Workflow do Telegram
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ docker-compose.yml
```

## Desenvolvimento

Cada serviÃƒÂ§o roda localmente sem Docker:

```bash
# Backend (porta 3001)
cd backend
npm install
npm run dev

# Frontend (porta 5173)
cd frontend
npm install
npm run dev
```

VerificaÃƒÂ§ÃƒÂ£o de tipos (lint):

```bash
cd backend && npm run lint
cd frontend && npm run lint
```

## Testes

NÃƒÂ£o hÃƒÂ¡ suÃƒÂ­te automatizada configurada ainda (ver seÃƒÂ§ÃƒÂ£o de testes em qualquer
estrutura). ValidaÃƒÂ§ÃƒÂ£o ÃƒÂ© feita por `npm run lint` (TypeScript strict) e `npm run build`.


## Release `0.3.0`

- Login via Telegram (widget) + JWT HS256; autorizacao por recurso (usuarios
  veem apenas os proprios gastos/categorias).
- Rotas novas: auth, categorias e relatorios mensais; POST /expenses aceita
  `categoria` e `dataGasto`.
- Dashboard: login, pagina de gastos com filtros e relatorio mensal.
- Workflow n8n `telegram-expenses` corrigido: nos de saida usam
  `$('Preparar dados')` para `chatId` (com fallback `chat.id ?? from.id`) e
  texto; credencial Telegram religada ao uuid real.

> **Pendencia BLOQUEIO (proxima iteracao):** no workflow n8n o no
> "Salvar na API" tem `alwaysOutputData: true`, entao o fluxo continua e o
> bot confirma "Gasto salvo" mesmo quando o backend responde 4xx/5xx.
> Corrigir ligando a saida de erro do no HTTP direto ao "Avisar erro no
> Telegram".
