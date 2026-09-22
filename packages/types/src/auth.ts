export type UserRole = "ADMIN" | "USER";

export type AdminLevel = "ADMIN_MASTER" | "ADMIN_GESTOR" | "ADMIN_ANALISTA";

export interface AdminUser {
  id: string;
  name: string;
  cpf: string; // CPF normalizado (11 dígitos numéricos)
  email?: string;
  role: UserRole;
  level: AdminLevel;
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

export interface RegisterAdminRequest {
  name: string;
  cpf: string;
  password: string;
  level: AdminLevel;
  email?: string;
}

export interface RegisterAdminResponse {
  user: AdminUser;
}

export interface AdminListItem {
  id: string;
  name: string;
  cpf: string;
  email?: string;
  role: UserRole;
  level: AdminLevel;
  createdAt: string;
}

/**
 * Funções auxiliares para verificação de permissões baseadas no nível administrativo
 */
export function canManageAdmins(level?: AdminLevel | null): boolean {
  return level === "ADMIN_MASTER";
}

export function canExportData(level?: AdminLevel | null): boolean {
  return level === "ADMIN_MASTER" || level === "ADMIN_GESTOR";
}

export function getAdminLevelLabel(level?: AdminLevel | null): string {
  switch (level) {
    case "ADMIN_MASTER":
      return "Administrador Master";
    case "ADMIN_GESTOR":
      return "Gestor CVM";
    case "ADMIN_ANALISTA":
      return "Analista CVM";
    default:
      return "Administrador";
  }
}

