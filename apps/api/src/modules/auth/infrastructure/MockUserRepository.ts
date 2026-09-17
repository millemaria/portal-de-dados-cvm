import type { User } from "../domain/User.js";
import type { UserRepository } from "../domain/UserRepository.js";
import { PasswordService } from "./PasswordService.js";

/**
 * Repositório em memória de usuários para desenvolvimento local e testes.
 * Fornece um usuário com perfil ADMIN e um usuário com perfil comum (USER)
 * para possibilitar a verificação de permissões administrativas.
 */
export class MockUserRepository implements UserRepository {
  private readonly users: Map<string, User> = new Map();

  constructor(passwordService: PasswordService = new PasswordService()) {
    // 1. Usuário Administrador (CPF válido: 111.444.777-35)
    const adminPass = passwordService.hashPassword("Admin@123456");
    const adminUser: User = {
      id: "usr-admin-001",
      name: "Administrador CVM",
      cpf: "11144477735",
      email: "admin@cvm.gov.br",
      role: "ADMIN",
      passwordHash: adminPass.hash,
      salt: adminPass.salt,
      createdAt: "2025-01-01T00:00:00.000Z",
    };
    this.users.set(adminUser.cpf, adminUser);

    // 2. Usuário Comum não-administrador (CPF válido: 222.555.888-46)
    const userPass = passwordService.hashPassword("User@123456");
    const regularUser: User = {
      id: "usr-regular-002",
      name: "Analista CVM (Não Admin)",
      cpf: "22255588846",
      email: "analista@cvm.gov.br",
      role: "USER",
      passwordHash: userPass.hash,
      salt: userPass.salt,
      createdAt: "2025-01-01T00:00:00.000Z",
    };
    this.users.set(regularUser.cpf, regularUser);
  }

  async findByCpf(cpf: string): Promise<User | null> {
    const user = this.users.get(cpf);
    return user ? { ...user } : null;
  }

  async findById(id: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.id === id) {
        return { ...user };
      }
    }
    return null;
  }

  /** Método auxiliar para testes */
  addUser(user: User): void {
    this.users.set(user.cpf, user);
  }
}
