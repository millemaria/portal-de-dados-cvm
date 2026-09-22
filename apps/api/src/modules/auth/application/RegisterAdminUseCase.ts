import crypto from "node:crypto";
import type { AdminLevel, AdminUser } from "@portal-cvm/types";
import { normalizeCpf, validateCpf } from "@portal-cvm/validation";
import type { User } from "../domain/User.js";
import type { UserRepository } from "../domain/UserRepository.js";
import type { PasswordService } from "../infrastructure/PasswordService.js";
import { InvalidCpfError } from "./LoginUseCase.js";

export class CpfAlreadyExistsError extends Error {
  constructor(message = "CPF já cadastrado no sistema.") {
    super(message);
    this.name = "CpfAlreadyExistsError";
  }
}

export class InvalidAdminDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAdminDataError";
  }
}

export interface RegisterAdminInput {
  name: string;
  cpf: string;
  password: string;
  level: AdminLevel;
  email?: string;
}

/**
 * Caso de uso: Pré-cadastro de Usuários Administradores
 * Responsabilidades:
 * 1. Normalização e validação oficial do CPF (Módulo 11)
 * 2. Validação da unicidade do CPF (sem duplicidades)
 * 3. Hashing seguro da senha via node:crypto (scrypt + salt aleatório)
 * 4. Atribuição do nível de permissão administrativa
 * 5. Persistência no repositório de dados
 * 6. Retorno seguro dos dados criados (sem expor hash e salt)
 */
export class RegisterAdminUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService
  ) {}

  async execute(input: RegisterAdminInput): Promise<AdminUser> {
    const trimmedName = input.name ? input.name.trim() : "";
    if (trimmedName.length < 3) {
      throw new InvalidAdminDataError("O nome completo deve ter no mínimo 3 caracteres.");
    }

    if (!input.password || input.password.length < 6) {
      throw new InvalidAdminDataError("A senha deve ter no mínimo 6 caracteres.");
    }

    const validLevels: AdminLevel[] = ["ADMIN_MASTER", "ADMIN_GESTOR", "ADMIN_ANALISTA"];
    if (!validLevels.includes(input.level)) {
      throw new InvalidAdminDataError("Nível de administrador inválido.");
    }

    const cleanedCpf = normalizeCpf(input.cpf);
    if (!validateCpf(cleanedCpf)) {
      throw new InvalidCpfError();
    }

    // Verifica se o CPF já está cadastrado
    const existingUser = await this.userRepository.findByCpf(cleanedCpf);
    if (existingUser) {
      throw new CpfAlreadyExistsError();
    }

    // Gera hash criptográfico seguro e salt
    const { hash, salt } = this.passwordService.hashPassword(input.password);

    const generatedId = `usr-admin-${crypto.randomUUID().slice(0, 8)}`;
    const email = input.email && input.email.trim().length > 0
      ? input.email.trim()
      : `${cleanedCpf}@cvm.gov.br`;

    const newUser: User = {
      id: generatedId,
      name: trimmedName,
      cpf: cleanedCpf,
      email,
      role: "ADMIN",
      level: input.level,
      passwordHash: hash,
      salt,
      createdAt: new Date().toISOString(),
    };

    await this.userRepository.create(newUser);

    return {
      id: newUser.id,
      name: newUser.name,
      cpf: newUser.cpf,
      email: newUser.email,
      role: newUser.role,
      level: newUser.level,
      createdAt: newUser.createdAt,
    };
  }
}
