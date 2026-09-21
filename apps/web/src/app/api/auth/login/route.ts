import { NextResponse } from "next/server";
import { normalizeCpf, validateCpf } from "@portal-cvm/validation";

const API_BASE_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:3001";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cpf, password } = body;

    if (!cpf || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "CPF e senha são obrigatórios",
          },
        },
        { status: 400 }
      );
    }

    const cleanedCpf = normalizeCpf(cpf);
    if (!validateCpf(cleanedCpf)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CPF",
            message: "CPF inválido. Verifique os dígitos informados.",
          },
        },
        { status: 400 }
      );
    }

    // Chamada à API backend Fastify com o CPF normalizado
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cpf: cleanedCpf, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return NextResponse.json(data, { status: res.status });
    }

    const response = NextResponse.json(data, { status: 200 });

    // Salva o cookie de sessão httpOnly do domínio Web
    response.cookies.set("admin_session", data.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 horas
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CONNECTION_ERROR",
          message: "Não foi possível conectar ao servidor de autenticação.",
        },
      },
      { status: 500 }
    );
  }
}
