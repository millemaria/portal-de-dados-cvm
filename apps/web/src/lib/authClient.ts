import type { AdminUser, LoginResponse, AdminListItem } from "@portal-cvm/types";
import type { RegisterAdminInput } from "@portal-cvm/validation";
import { normalizeCpf } from "@portal-cvm/validation";

const ADMIN_USER_STORAGE_KEY = "portal_cvm_admin_user";

export async function loginAdmin(
  cpf: string,
  password: string
): Promise<LoginResponse> {
  const normalized = normalizeCpf(cpf);

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ cpf: normalized, password }),
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    const errorMsg =
      json?.error?.message ?? "Falha ao realizar login administrativo.";
    throw new Error(errorMsg);
  }

  // Guarda dados do admin para exibição na UI
  if (typeof window !== "undefined" && json.data?.user) {
    localStorage.setItem(
      ADMIN_USER_STORAGE_KEY,
      JSON.stringify(json.data.user)
    );
  }

  return json.data;
}

export async function registerAdmin(
  input: RegisterAdminInput
): Promise<{ user: AdminUser }> {
  const res = await fetch("/api/auth/register-admin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    const errorMsg =
      json?.error?.message ?? "Erro ao realizar pré-cadastro do administrador.";
    throw new Error(errorMsg);
  }

  return json.data;
}

export async function getAdminsList(): Promise<AdminListItem[]> {
  const res = await fetch("/api/auth/admins", {
    method: "GET",
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    const errorMsg =
      json?.error?.message ?? "Erro ao consultar a lista de administradores.";
    throw new Error(errorMsg);
  }

  return json.data.admins;
}

export async function logoutAdmin(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
  } catch {
    // Continua para limpar o storage local
  } finally {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ADMIN_USER_STORAGE_KEY);
      window.location.href = "/login";
    }
  }
}

export function getStoredAdminUser(): AdminUser | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(ADMIN_USER_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

