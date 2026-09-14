# API Reference — Portal de Dados CVM

Base URL: `http://localhost:3001`

## Health Check

### `GET /health`

Retorna status da API.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-31T12:00:00.000Z",
  "environment": "development"
}
```

---

## Companies

### `GET /api/companies`

Lista empresas com paginação e busca.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| search | string | — | Busca por nome ou ticker |
| sector | string | — | Filtro por setor |
| status | "ATIVO" \| "INATIVO" | — | Filtro por status |
| page | number | 1 | Página (1-based) |
| pageSize | number | 20 | Itens por página (max 100) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "cdCvm": "9512",
      "cnpj": "33.000.167/0001-01",
      "companyName": "PETROLEO BRASILEIRO S.A. - PETROBRAS",
      "ticker": "PETR4",
      "sector": "Petróleo, Gás e Biocombustíveis",
      "status": "ATIVO",
      "latestReferenceDate": "2024-12-31",
      "totalAssets": 992847000,
      "netRevenue": 511847000,
      "netIncome": 104761000,
      "currencyScale": "MIL"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 100,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### `GET /api/companies/:ticker`

Retorna dados de uma empresa específica.

### `GET /api/companies/:ticker/indicators`

Retorna indicadores financeiros (ROE, ROA, margens, liquidez).

### `GET /api/companies/:ticker/balance-sheet`

Retorna balanço patrimonial (ativo + passivo).

### `GET /api/companies/:ticker/income-statement`

Retorna demonstração de resultado (DRE).

### `GET /api/companies/:ticker/cash-flow`

Retorna fluxo de caixa.

### `GET /api/companies/:ticker/financials`

Retorna todas as demonstrações combinadas.

---

## Error Responses

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid ticker parameter",
    "details": {}
  }
}
```

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Parâmetros inválidos |
| NOT_FOUND | 404 | Empresa não encontrada |
| INTERNAL_ERROR | 500 | Erro interno |
