import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SqliteUserRepository } from "../../../../src/modules/auth/infrastructure/SqliteUserRepository.js";
import { PasswordService } from "../../../../src/modules/auth/infrastructure/PasswordService.js";
import type { User } from "../../../../src/modules/auth/domain/User.js";

describe("SqliteUserRepository (Unit)", () => {
  let repository: SqliteUserRepository;
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
    // Usa banco em memória para isolamento total em testes
    repository = new SqliteUserRepository(":memory:", passwordService);
  });

  afterEach(() => {
    repository.close();
  });

  it("deve inicializar e conter os usuários padrão de seed", async () => {
    const admin = await repository.findByCpf("11144477735");
    expect(admin).toBeDefined();
    expect(admin?.role).toBe("ADMIN");
    expect(admin?.level).toBe("ADMIN_MASTER");
    expect(admin?.name).toBe("Administrador CVM");

    const nonAdmin = await repository.findByCpf("22255588846");
    expect(nonAdmin).toBeDefined();
    expect(nonAdmin?.role).toBe("USER");
  });

  it("deve criar e recuperar um novo usuário no SQLite", async () => {
    const pass = passwordService.hashPassword("MinhaSenha@123");
    const newUser: User = {
      id: "usr-sqlite-001",
      name: "Roberta Gestora",
      cpf: "52998224725",
      email: "roberta@cvm.gov.br",
      role: "ADMIN",
      level: "ADMIN_GESTOR",
      passwordHash: pass.hash,
      salt: pass.salt,
      createdAt: new Date().toISOString(),
    };

    await repository.create(newUser);

    const foundByCpf = await repository.findByCpf("52998224725");
    expect(foundByCpf).toBeDefined();
    expect(foundByCpf?.id).toBe("usr-sqlite-001");
    expect(foundByCpf?.level).toBe("ADMIN_GESTOR");

    const foundById = await repository.findById("usr-sqlite-001");
    expect(foundById).toBeDefined();
    expect(foundById?.cpf).toBe("52998224725");
  });

  it("deve listar todos os usuários cadastrados", async () => {
    const users = await repository.listAll();
    expect(users.length).toBeGreaterThanOrEqual(2);
    expect(users.some((u) => u.cpf === "11144477735")).toBe(true);
  });
});
