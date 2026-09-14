import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { createApp } from "../../../src/app.js";
import type { EnvConfig } from "../../../src/config/env.js";

describe("Company Routes (Integration)", () => {
  let server: FastifyInstance;

  const testConfig: EnvConfig = {
    API_PORT: 0,
    API_HOST: "127.0.0.1",
    NODE_ENV: "test",
    USE_MOCK_DATA: true,
    CACHE_TTL: 0,
    DATABRICKS_CATALOG: "portal_cvm",
    DATABRICKS_SCHEMA: "gold",
  };

  beforeAll(async () => {
    server = await createApp(testConfig);
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it("GET /health should return ok", async () => {
    const response = await server.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe("ok");
  });

  it("GET /api/companies should return paginated list", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/api/companies",
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.pagination).toBeDefined();
  });

  it("GET /api/companies?search=PETR should filter results", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/api/companies?search=PETR",
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.data.length).toBe(1);
    expect(body.data[0].ticker).toBe("PETR4");
  });

  it("GET /api/companies/:ticker should return company", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/api/companies/PETR4",
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.ticker).toBe("PETR4");
  });

  it("GET /api/companies/:ticker should return 404 for unknown", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/api/companies/XXXX9",
    });
    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
  });

  it("GET /api/companies/:ticker/balance-sheet should return data", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/api/companies/PETR4/balance-sheet",
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("GET /api/companies/:ticker/income-statement should return data", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/api/companies/PETR4/income-statement",
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
  });

  it("GET /api/companies/:ticker/cash-flow should return data", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/api/companies/PETR4/cash-flow",
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
  });

  it("GET /api/companies/:ticker/indicators should return data", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/api/companies/PETR4/indicators",
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
  });

  it("GET /api/companies/:ticker/financials should return combined data", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/api/companies/PETR4/financials",
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.balanceSheet).toBeDefined();
    expect(body.data.incomeStatement).toBeDefined();
    expect(body.data.cashFlow).toBeDefined();
  });

  it("should validate invalid ticker format", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/api/companies/invalid ticker!",
    });
    expect(response.statusCode).toBe(400);
  });
});
