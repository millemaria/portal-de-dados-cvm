import type { AdminUser, LoginResponse } from "@portal-cvm/types";
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
