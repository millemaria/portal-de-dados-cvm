import type { AdminUser } from "@portal-cvm/types";
import type { UserRepository } from "../domain/UserRepository.js";
import type { TokenService } from "../infrastructure/TokenService.js";
import { InvalidCredentialsError, UnauthorizedRoleError } from "./LoginUseCase.js";

/**
 * Caso de uso: Verificação de Sessão Administrativa
 * Responsável por validar um token JWT e garantir que o usuário ainda é válido e possui perfil ADMIN.
 */
export class VerifySessionUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService
  ) {}

  async execute(token: string): Promise<AdminUser> {
    const payload = this.tokenService.verifyToken(token);
    if (!payload) {
      throw new InvalidCredentialsError("Sessão inválida ou expirada");
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new InvalidCredentialsError("Usuário não encontrado");
    }

    if (user.role !== "ADMIN") {
      throw new UnauthorizedRoleError();
    }

    return {
      id: user.id,
      name: user.name,
      cpf: user.cpf,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
