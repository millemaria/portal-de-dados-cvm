import type { FastifyInstance } from "fastify";
import { loginSchema } from "@portal-cvm/validation";
import {
  LoginUseCase,
  InvalidCredentialsError,
  UnauthorizedRoleError,
  InvalidCpfError,
} from "../application/LoginUseCase.js";
import type { VerifySessionUseCase } from "../application/VerifySessionUseCase.js";

export function registerAuthRoutes(
  server: FastifyInstance,
  loginUseCase: LoginUseCase,
  verifySessionUseCase: VerifySessionUseCase
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

  // POST /api/auth/logout - Logout administrativo
  server.post("/api/auth/logout", async (_request, reply) => {
    return reply.status(200).send({
      success: true,
      message: "Sessão administrativa finalizada com sucesso",
    });
  });
}
