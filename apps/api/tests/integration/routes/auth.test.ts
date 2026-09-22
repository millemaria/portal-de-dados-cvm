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

  it("POST /api/auth/register-admin deve permitir que ADMIN_MASTER pré-cadastre um novo admin (201)", async () => {
    // 1. Obter token do ADMIN_MASTER
    const loginRes = await server.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        cpf: "111.444.777-35",
        password: "Admin@123456",
      },
    });
    const { token } = JSON.parse(loginRes.body).data;

    // 2. Pré-cadastrar novo administrador com CPF válido
    const registerRes = await server.inject({
      method: "POST",
      url: "/api/auth/register-admin",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      payload: {
        name: "Carlos Gestor CVM",
        cpf: "529.982.247-25",
        password: "Gestor@123456",
        level: "ADMIN_GESTOR",
        email: "carlos.gestor@cvm.gov.br",
      },
    });

    expect(registerRes.statusCode).toBe(201);
    const regBody = JSON.parse(registerRes.body);
    expect(regBody.success).toBe(true);
    expect(regBody.data.user.cpf).toBe("52998224725");
    expect(regBody.data.user.level).toBe("ADMIN_GESTOR");

    // 3. Fazer login com as credenciais do novo administrador pré-cadastrado
    const newAdminLoginRes = await server.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        cpf: "52998224725",
        password: "Gestor@123456",
      },
    });

    expect(newAdminLoginRes.statusCode).toBe(200);
    const newAdminLoginBody = JSON.parse(newAdminLoginRes.body);
    expect(newAdminLoginBody.data.user.name).toBe("Carlos Gestor CVM");
    expect(newAdminLoginBody.data.user.level).toBe("ADMIN_GESTOR");
  });

  it("POST /api/auth/register-admin deve retornar 409 se o CPF já estiver cadastrado", async () => {
    const loginRes = await server.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        cpf: "111.444.777-35",
        password: "Admin@123456",
      },
    });
    const { token } = JSON.parse(loginRes.body).data;

    const duplicateRes = await server.inject({
      method: "POST",
      url: "/api/auth/register-admin",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      payload: {
        name: "Duplicado Teste",
        cpf: "111.444.777-35",
        password: "QualquerSenha123",
        level: "ADMIN_ANALISTA",
      },
    });

    expect(duplicateRes.statusCode).toBe(409);
    const body = JSON.parse(duplicateRes.body);
    expect(body.error.code).toBe("CPF_ALREADY_EXISTS");
  });

  it("POST /api/auth/register-admin deve retornar 401 para requisições sem token", async () => {
    const res = await server.inject({
      method: "POST",
      url: "/api/auth/register-admin",
      payload: {
        name: "Sem Auth",
        cpf: "52998224725",
        password: "QualquerSenha123",
        level: "ADMIN_ANALISTA",
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it("GET /api/auth/admins deve listar todos os administradores cadastrados para usuário autenticado", async () => {
    const loginRes = await server.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        cpf: "111.444.777-35",
        password: "Admin@123456",
      },
    });
    const { token } = JSON.parse(loginRes.body).data;

    const listRes = await server.inject({
      method: "GET",
      url: "/api/auth/admins",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(listRes.statusCode).toBe(200);
    const body = JSON.parse(listRes.body);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.admins)).toBe(true);
    expect(body.data.admins.length).toBeGreaterThanOrEqual(1);
    expect(body.data.admins[0].passwordHash).toBeUndefined();
    expect(body.data.admins[0].salt).toBeUndefined();
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

