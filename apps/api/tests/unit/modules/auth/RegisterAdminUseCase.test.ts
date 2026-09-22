import { describe, it, expect, beforeEach } from "vitest";
import { MockUserRepository } from "../../../../src/modules/auth/infrastructure/MockUserRepository.js";
import { PasswordService } from "../../../../src/modules/auth/infrastructure/PasswordService.js";
import {
  RegisterAdminUseCase,
  CpfAlreadyExistsError,
  InvalidAdminDataError,
} from "../../../../src/modules/auth/application/RegisterAdminUseCase.js";
import { InvalidCpfError } from "../../../../src/modules/auth/application/LoginUseCase.js";

describe("RegisterAdminUseCase (Unit)", () => {
  let userRepository: MockUserRepository;
  let passwordService: PasswordService;
  let registerAdminUseCase: RegisterAdminUseCase;

  beforeEach(() => {
    passwordService = new PasswordService();
    userRepository = new MockUserRepository(passwordService);
    registerAdminUseCase = new RegisterAdminUseCase(
      userRepository,
      passwordService
    );
  });

  it("deve pré-cadastrar com sucesso um novo administrador com CPF válido", async () => {
    // CPF válido (gerado pelo módulo 11): 52998224725
    const result = await registerAdminUseCase.execute({
      name: "Dra. Maria Gestora",
      cpf: "529.982.247-25",
      password: "SenhaSegura@2026",
      level: "ADMIN_GESTOR",
      email: "maria.gestora@cvm.gov.br",
    });

    expect(result).toBeDefined();
    expect(result.id).toMatch(/^usr-admin-/);
    expect(result.name).toBe("Dra. Maria Gestora");
    expect(result.cpf).toBe("52998224725");
    expect(result.role).toBe("ADMIN");
    expect(result.level).toBe("ADMIN_GESTOR");
    expect(result.email).toBe("maria.gestora@cvm.gov.br");
    expect(result.createdAt).toBeDefined();

    // Verifica persistência no repositório e hash seguro da senha
    const storedUser = await userRepository.findByCpf("52998224725");
    expect(storedUser).toBeDefined();
    expect(storedUser?.passwordHash).not.toBe("SenhaSegura@2026");
    expect(storedUser?.salt).toBeDefined();
    expect(
      passwordService.verifyPassword(
        "SenhaSegura@2026",
        storedUser!.passwordHash,
        storedUser!.salt
      )
    ).toBe(true);
  });

  it("deve rejeitar pré-cadastro se o CPF já estiver cadastrado", async () => {
    // CPF do administrador padrão: 11144477735
    await expect(
      registerAdminUseCase.execute({
        name: "Outro Administrador",
        cpf: "111.444.777-35",
        password: "NovaSenha@123",
        level: "ADMIN_ANALISTA",
      })
    ).rejects.toThrow(CpfAlreadyExistsError);
  });

  it("deve rejeitar pré-cadastro se o CPF for inválido", async () => {
    await expect(
      registerAdminUseCase.execute({
        name: "Carlos Teste",
        cpf: "123.456.789-00",
        password: "SenhaForte@123",
        level: "ADMIN_ANALISTA",
      })
    ).rejects.toThrow(InvalidCpfError);
  });

  it("deve rejeitar pré-cadastro se o nome for muito curto", async () => {
    await expect(
      registerAdminUseCase.execute({
        name: "Al",
        cpf: "52998224725",
        password: "SenhaForte@123",
        level: "ADMIN_ANALISTA",
      })
    ).rejects.toThrow(InvalidAdminDataError);
  });

  it("deve rejeitar pré-cadastro se a senha tiver menos de 6 caracteres", async () => {
    await expect(
      registerAdminUseCase.execute({
        name: "Carlos Silva",
        cpf: "52998224725",
        password: "123",
        level: "ADMIN_ANALISTA",
      })
    ).rejects.toThrow(InvalidAdminDataError);
  });
});
