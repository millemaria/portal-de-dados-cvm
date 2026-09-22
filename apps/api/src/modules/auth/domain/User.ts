import type { UserRole, AdminLevel } from "@portal-cvm/types";

/**
 * Entidade de Usuário do sistema administrativo
 */
export interface User {
  id: string;
  name: string;
  cpf: string; // Sempre normalizado com 11 dígitos numéricos
  email: string;
  role: UserRole;
  level: AdminLevel;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

