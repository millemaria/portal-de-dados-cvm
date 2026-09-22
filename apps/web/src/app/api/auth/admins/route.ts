import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:3001";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_session")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Sessão não autenticada.",
          },
        },
        { status: 401 }
      );
    }

    const res = await fetch(`${API_BASE_URL}/api/auth/admins`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "CONNECTION_ERROR",
          message: "Não foi possível conectar ao servidor de dados.",
        },
      },
      { status: 500 }
    );
  }
}
