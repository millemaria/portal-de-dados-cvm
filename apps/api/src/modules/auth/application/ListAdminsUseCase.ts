import type { AdminListItem } from "@portal-cvm/types";
import type { UserRepository } from "../domain/UserRepository.js";

/**
 * Caso de uso: Listagem de Usuários Administradores
 * Retorna todos os administradores cadastrados para a tela de gerenciamento,
 * sem expor dados sensíveis (hashes ou salts de senha).
 */
export class ListAdminsUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<AdminListItem[]> {
    const users = await this.userRepository.listAll();

    return users
      .filter((u) => u.role === "ADMIN")
      .map((u) => ({
        id: u.id,
        name: u.name,
        cpf: u.cpf,
        email: u.email,
        role: u.role,
        level: u.level,
        createdAt: u.createdAt,
      }));
  }
}
