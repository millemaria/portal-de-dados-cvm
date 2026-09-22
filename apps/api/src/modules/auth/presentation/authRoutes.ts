import type { FastifyInstance } from "fastify";
import { loginSchema, registerAdminSchema } from "@portal-cvm/validation";
import {
  LoginUseCase,
  InvalidCredentialsError,
  UnauthorizedRoleError,
  InvalidCpfError,
} from "../application/LoginUseCase.js";
import type { VerifySessionUseCase } from "../application/VerifySessionUseCase.js";
import {
  RegisterAdminUseCase,
  CpfAlreadyExistsError,
  InvalidAdminDataError,
} from "../application/RegisterAdminUseCase.js";
import type { ListAdminsUseCase } from "../application/ListAdminsUseCase.js";

export function registerAuthRoutes(
  server: FastifyInstance,
  loginUseCase: LoginUseCase,
  verifySessionUseCase: VerifySessionUseCase,
  registerAdminUseCase?: RegisterAdminUseCase,
  listAdminsUseCase?: ListAdminsUseCase
) {
  // POST /api/auth/login - Autenticação administrativa com CPF e senha
  server.post("/api/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Dados de login inválidos",
          details: parsed.error.flatten(),
        },
      });
    }

    try {
      const result = await loginUseCase.execute(parsed.data);
      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof InvalidCpfError) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "INVALID_CPF",
            message: error.message,
          },
        });
      }

      if (error instanceof InvalidCredentialsError) {
        return reply.status(401).send({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: error.message,
          },
        });
      }

      if (error instanceof UnauthorizedRoleError) {
        return reply.status(403).send({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: error.message,
          },
        });
      }

      server.log.error(error);
      return reply.status(500).send({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Erro interno no servidor ao processar o login",
        },
      });
    }
  });

  // GET /api/auth/me - Dados do administrador autenticado
  server.get("/api/auth/me", async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Token de autenticação não fornecido",
        },
      });
    }

    const token = authHeader.slice(7).trim();

    try {
      const user = await verifySessionUseCase.execute(token);
      return reply.status(200).send({
        success: true,
        data: { user },
      });
    } catch (error) {
      if (error instanceof UnauthorizedRoleError) {
        return reply.status(403).send({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: error.message,
          },
        });
      }

      return reply.status(401).send({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message:
            error instanceof Error
              ? error.message
              : "Sessão inválida ou expirada",
        },
      });
    }
  });

  // POST /api/auth/register-admin - Pré-cadastro de novo administrador (Acesso exclusivo ADMIN_MASTER)
  server.post("/api/auth/register-admin", async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Acesso não autorizado: token de autenticação obrigatório.",
        },
      });
    }

    const token = authHeader.slice(7).trim();

    try {
      // Validação da sessão e do perfil master
      const currentUser = await verifySessionUseCase.execute(token);
      if (currentUser.level !== "ADMIN_MASTER") {
        return reply.status(403).send({
          success: false,
          error: {
            code: "FORBIDDEN",
            message:
              "Acesso negado: Apenas administradores com perfil Master podem realizar o pré-cadastro de usuários.",
          },
        });
      }

      if (!registerAdminUseCase) {
        return reply.status(500).send({
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Serviço de pré-cadastro não configurado.",
          },
        });
      }

      const parsed = registerAdminSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Dados de pré-cadastro inválidos.",
            details: parsed.error.flatten(),
          },
        });
      }

      const createdUser = await registerAdminUseCase.execute(parsed.data);

      return reply.status(201).send({
        success: true,
        data: { user: createdUser },
        message: "Administrador pré-cadastrado com sucesso.",
      });
    } catch (error) {
      if (error instanceof CpfAlreadyExistsError) {
        return reply.status(409).send({
          success: false,
          error: {
            code: "CPF_ALREADY_EXISTS",
            message: error.message,
          },
        });
      }

      if (error instanceof InvalidCpfError) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "INVALID_CPF",
            message: error.message,
          },
        });
      }

      if (error instanceof InvalidAdminDataError) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
          },
        });
      }

      if (error instanceof UnauthorizedRoleError) {
        return reply.status(403).send({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: error.message,
          },
        });
      }

      if (error instanceof InvalidCredentialsError) {
        return reply.status(401).send({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: error.message,
          },
        });
      }

      server.log.error(error);
      return reply.status(500).send({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Erro interno no servidor ao realizar pré-cadastro.",
        },
      });
    }
  });

  // GET /api/auth/admins - Listagem de administradores cadastrados
  server.get("/api/auth/admins", async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Token de autenticação não fornecido.",
        },
      });
    }

    const token = authHeader.slice(7).trim();

    try {
      const currentUser = await verifySessionUseCase.execute(token);
      if (currentUser.role !== "ADMIN") {
        return reply.status(403).send({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Acesso negado.",
          },
        });
      }

      if (!listAdminsUseCase) {
        return reply.status(500).send({
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Serviço de listagem não configurado.",
          },
        });
      }

      const admins = await listAdminsUseCase.execute();

      return reply.status(200).send({
        success: true,
        data: { admins },
      });
    } catch (error) {
      if (error instanceof UnauthorizedRoleError) {
        return reply.status(403).send({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: error.message,
          },
        });
      }

      return reply.status(401).send({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message:
            error instanceof Error
              ? error.message
              : "Sessão inválida ou expirada",
        },
      });
    }
  });

  // POST /api/auth/logout - Logout administrativo
  server.post("/api/auth/logout", async (_request, reply) => {
    return reply.status(200).send({
      success: true,
      message: "Sessão administrativa finalizada com sucesso",
    });
  });
}

