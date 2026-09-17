import type { AdminUser, LoginResponse } from "@portal-cvm/types";
import { normalizeCpf, validateCpf } from "@portal-cvm/validation";
import type { UserRepository } from "../domain/UserRepository.js";
import type { PasswordService } from "../infrastructure/PasswordService.js";
import type { TokenService } from "../infrastructure/TokenService.js";

export class InvalidCredentialsError extends Error {
  constructor(message = "CPF ou senha incorretos") {
    super(message);
    this.name = "InvalidCredentialsError";
  }
}

export class UnauthorizedRoleError extends Error {
  constructor(
    message = "Acesso negado: Somente usuários com permissão administrativa podem acessar o sistema."
  ) {
    super(message);
    this.name = "UnauthorizedRoleError";
  }
}

export class InvalidCpfError extends Error {
  constructor(message = "CPF inválido. Verifique os dígitos informados.") {
    super(message);
    this.name = "InvalidCpfError";
  }
}

export interface LoginUseCaseInput {
  cpf: string;
  password: string;
}

/**
 * Caso de uso: Autenticação Administrativa
 * Responsabilidades:
 * 1. Normalização e validação algorítmica do CPF
 * 2. Validação das credenciais do usuário
 * 3. Verificação explícita do papel de administrador (role === "ADMIN")
 * 4. Geração do token de sessão administrativa
 */
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService
  ) {}

  async execute(input: LoginUseCaseInput): Promise<LoginResponse> {
    const cleanedCpf = normalizeCpf(input.cpf);

    // Validação de segurança no backend (nunca confiar apenas no frontend)
    if (!validateCpf(cleanedCpf)) {
      throw new InvalidCpfError();
    }

    // Busca o usuário no repositório pelo CPF normalizado
    const user = await this.userRepository.findByCpf(cleanedCpf);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    // Verifica a senha fornecida
    const isPasswordValid = this.passwordService.verifyPassword(
      input.password,
      user.passwordHash,
      user.salt
    );
    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    // Verificação estrita de permissão administrativa
    if (user.role !== "ADMIN") {
      throw new UnauthorizedRoleError();
    }

    const adminUser: AdminUser = {
      id: user.id,
      name: user.name,
      cpf: user.cpf,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    const token = this.tokenService.generateToken(adminUser);

    return {
      user: adminUser,
      token,
    };
  }
}
