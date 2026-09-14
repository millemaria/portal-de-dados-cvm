# Deployment — Portal de Dados CVM

## Desenvolvimento Local

### Pré-requisitos

- Node.js >= 20
- npm >= 11

### Setup

```bash
# Clone e instale
git clone <repo-url>
cd portal-de-dados-cvm
npm install

# Configure ambiente
cp .env.example .env
# Edite .env se necessário (USE_MOCK_DATA=true para dev local)

# Inicie
npm run dev
```

Isso inicia:
- **API**: http://localhost:3001 (mock data)
- **Web**: http://localhost:3000

### Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia API + Web em modo dev |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint em todos os workspaces |
| `npm run typecheck` | TypeScript check |
| `npm test` | Executa testes |

## Docker

```bash
# Build e run
docker compose up --build

# Apenas API
docker compose up api

# Apenas Web
docker compose up web
```

## Produção com Databricks

1. Configurar workspace Databricks
2. Executar notebooks de dados (ingestion → bronze → silver → gold)
3. Configurar SQL Warehouse
4. Definir variáveis de ambiente no servidor:

```env
USE_MOCK_DATA=false
DATABRICKS_HOST=https://...
DATABRICKS_TOKEN=dapi_...
DATABRICKS_WAREHOUSE_ID=...
DATABRICKS_CATALOG=portal_cvm
DATABRICKS_SCHEMA=gold
```

5. Deploy API e Web (Docker ou plataforma de escolha)

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| USE_MOCK_DATA | Sim | `true` para dev, `false` para produção |
| DATABRICKS_HOST | Quando mock=false | URL do workspace |
| DATABRICKS_TOKEN | Quando mock=false | Personal Access Token |
| DATABRICKS_WAREHOUSE_ID | Quando mock=false | ID do SQL Warehouse |
| DATABRICKS_CATALOG | Não | Catalog (default: portal_cvm) |
| DATABRICKS_SCHEMA | Não | Schema (default: gold) |
| API_PORT | Não | Porta da API (default: 3001) |
| CACHE_TTL | Não | TTL do cache em segundos (default: 300) |
