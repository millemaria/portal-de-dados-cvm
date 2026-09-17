export type UserRole = "ADMIN" | "USER";

export interface AdminUser {
  id: string;
  name: string;
  cpf: string; // CPF normalizado (11 dígitos numéricos)
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface LoginRequest {
  cpf: string;
  password: string;
}

export interface LoginResponse {
  user: AdminUser;
  token: string;
}

export interface AuthSession {
  user: AdminUser;
  token: string;
  expiresAt: string;
}
