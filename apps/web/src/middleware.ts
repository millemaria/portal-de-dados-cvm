import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware de proteção de rotas no Next.js.
 * Garante que a aplicação NÃO abra diretamente na tela de empresas ou no dashboard
 * sem autenticação administrativa prévia.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("admin_session")?.value;

  const isLoginPage = pathname === "/login";
  const isProtectedPath =
    pathname === "/" || pathname.startsWith("/companies");

  // Se não estiver autenticado e tentar acessar uma rota protegida:
  if (!token && isProtectedPath) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Se já estiver autenticado e tentar acessar a tela de login:
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica o middleware nas rotas principais, ignorando:
     * - api (rotas de API)
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico, ícones e assets públicos
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
