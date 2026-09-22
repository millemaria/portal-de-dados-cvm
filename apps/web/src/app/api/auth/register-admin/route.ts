import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:3001";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Sessão não autenticada. Faça login para continuar.",
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const res = await fetch(`${API_BASE_URL}/api/auth/register-admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
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
