import { describe, it, expect, beforeEach } from "vitest";
import { MockUserRepository } from "../../../../src/modules/auth/infrastructure/MockUserRepository.js";
import { PasswordService } from "../../../../src/modules/auth/infrastructure/PasswordService.js";
import { TokenService } from "../../../../src/modules/auth/infrastructure/TokenService.js";
import {
  LoginUseCase,
  InvalidCredentialsError,
  UnauthorizedRoleError,
  InvalidCpfError,
} from "../../../../src/modules/auth/application/LoginUseCase.js";

describe("LoginUseCase (Unit)", () => {
  let userRepository: MockUserRepository;
  let passwordService: PasswordService;
  let tokenService: TokenService;
  let loginUseCase: LoginUseCase;

  beforeEach(() => {
    passwordService = new PasswordService();
    tokenService = new TokenService("test-secret-key-cvm-portal");
    userRepository = new MockUserRepository(passwordService);
    loginUseCase = new LoginUseCase(
      userRepository,
      passwordService,
      tokenService
    );
  });

  it("deve autenticar com sucesso um administrador com CPF formatado", async () => {
    const response = await loginUseCase.execute({
      cpf: "111.444.777-35",
      password: "Admin@123456",
    });

    expect(response).toBeDefined();
    expect(response.token).toBeDefined();
    expect(typeof response.token).toBe("string");
    expect(response.user.role).toBe("ADMIN");
    expect(response.user.cpf).toBe("11144477735");
    expect(response.user.name).toBe("Administrador CVM");
  });

  it("deve autenticar com sucesso um administrador com CPF sem formatação", async () => {
    const response = await loginUseCase.execute({
      cpf: "11144477735",
      password: "Admin@123456",
    });

    expect(response).toBeDefined();
    expect(response.user.role).toBe("ADMIN");
    expect(response.user.cpf).toBe("11144477735");
  });

  it("deve lançar InvalidCpfError se o CPF tiver algoritmo inválido", async () => {
    await expect(
      loginUseCase.execute({
        cpf: "111.111.111-11", // Repetidos
        password: "Admin@123456",
      })
    ).rejects.toThrow(InvalidCpfError);

    await expect(
      loginUseCase.execute({
        cpf: "123.456.789-99", // Dígitos verificadores incorretos
        password: "Admin@123456",
      })
    ).rejects.toThrow(InvalidCpfError);
  });

  it("deve lançar InvalidCredentialsError quando a senha estiver errada", async () => {
    await expect(
      loginUseCase.execute({
        cpf: "111.444.777-35",
        password: "SenhaErrada123",
      })
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("deve lançar InvalidCredentialsError quando o usuário não existir", async () => {
    // CPF matematicamente válido mas inexistente no banco (ex: 52998224725)
    await expect(
      loginUseCase.execute({
        cpf: "52998224725",
        password: "Admin@123456",
      })
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it("deve lançar UnauthorizedRoleError quando o usuário for válido mas NÃO for ADMIN", async () => {
    // Usuário comum cadastrado: CPF 222.555.888-46, role USER
    await expect(
      loginUseCase.execute({
        cpf: "222.555.888-46",
        password: "User@123456",
      })
    ).rejects.toThrow(UnauthorizedRoleError);
  });
});
