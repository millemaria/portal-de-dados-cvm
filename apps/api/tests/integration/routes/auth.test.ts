import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { createApp } from "../../../src/app.js";
import type { EnvConfig } from "../../../src/config/env.js";

describe("Auth Routes (Integration)", () => {
  let server: FastifyInstance;

  const testConfig: EnvConfig = {
    API_PORT: 0,
    API_HOST: "127.0.0.1",
    NODE_ENV: "test",
    USE_MOCK_DATA: true,
    CACHE_TTL: 0,
    DATABRICKS_CATALOG: "portal_cvm",
    DATABRICKS_SCHEMA: "gold",
    JWT_SECRET: "test-auth-routes-secret",
  };

  beforeAll(async () => {
    server = await createApp(testConfig);
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  it("POST /api/auth/login deve autenticar com sucesso o administrador (200)", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        cpf: "111.444.777-35",
        password: "Admin@123456",
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
    expect(body.data.user.role).toBe("ADMIN");
    expect(body.data.user.cpf).toBe("11144477735");
  });

  it("POST /api/auth/login deve aceitar CPF não formatado (200)", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        cpf: "11144477735",
        password: "Admin@123456",
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.user.cpf).toBe("11144477735");
  });

  it("POST /api/auth/login deve retornar 403 Forbidden para usuário sem permissão de admin", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        cpf: "222.555.888-46",
        password: "User@123456",
      },
    });

    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("POST /api/auth/login deve retornar 401 para senha incorreta", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        cpf: "111.444.777-35",
        password: "SenhaIncorreta",
      },
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("POST /api/auth/login deve retornar 400 para CPF inválido", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        cpf: "000.000.000-00",
        password: "Admin@123456",
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
  });

  it("GET /api/auth/me deve validar o token retornado e responder 200 com os dados do admin", async () => {
    // 1. Obter o token
    const loginRes = await server.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        cpf: "111.444.777-35",
        password: "Admin@123456",
      },
    });
    const { token } = JSON.parse(loginRes.body).data;

    // 2. Chamar /api/auth/me
    const meRes = await server.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(meRes.statusCode).toBe(200);
    const meBody = JSON.parse(meRes.body);
    expect(meBody.success).toBe(true);
    expect(meBody.data.user.role).toBe("ADMIN");
    expect(meBody.data.user.cpf).toBe("11144477735");
  });

  it("GET /api/auth/me deve retornar 401 se nenhum token for fornecido", async () => {
    const meRes = await server.inject({
      method: "GET",
      url: "/api/auth/me",
    });

    expect(meRes.statusCode).toBe(401);
  });

  it("POST /api/auth/logout deve retornar 200 de confirmação", async () => {
    const logoutRes = await server.inject({
      method: "POST",
      url: "/api/auth/logout",
    });

    expect(logoutRes.statusCode).toBe(200);
    const body = JSON.parse(logoutRes.body);
    expect(body.success).toBe(true);
  });
});
