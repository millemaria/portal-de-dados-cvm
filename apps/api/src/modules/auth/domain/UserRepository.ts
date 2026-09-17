import type { User } from "./User.js";

/**
 * Interface do repositório de usuários (Porta na Clean Architecture).
 */
export interface UserRepository {
  /**
   * Busca um usuário pelo CPF normalizado (11 dígitos numéricos).
   */
  findByCpf(cpf: string): Promise<User | null>;

  /**
   * Busca um usuário pelo ID único.
   */
  findById(id: string): Promise<User | null>;
}
