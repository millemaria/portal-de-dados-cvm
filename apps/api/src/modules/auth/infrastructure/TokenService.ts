import crypto from "node:crypto";
import type { UserRole } from "@portal-cvm/types";

export interface TokenPayload {
  sub: string;
  name: string;
  cpf: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * Serviço de geração e validação de tokens de autenticação stateless (JWT HS256)
 * utilizando o módulo nativo node:crypto.
 */
export class TokenService {
  constructor(
    private readonly secret: string,
    private readonly defaultExpiresInSeconds: number = 8 * 60 * 60 // 8 horas
  ) {}

  /**
   * Codifica um objeto JavaScript para uma string Base64URL segura.
   */
  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  }

  /**
   * Decodifica uma string Base64URL para string UTF-8.
   */
  private base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }
    return Buffer.from(base64, "base64").toString("utf-8");
  }

  /**
   * Gera um token assinado (formato JWT HS256) contendo os dados do usuário.
   */
  generateToken(
    user: { id: string; name: string; cpf: string; email: string; role: UserRole },
    expiresInSeconds?: number
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (expiresInSeconds ?? this.defaultExpiresInSeconds);

    const header = {
      alg: "HS256",
      typ: "JWT",
    };

    const payload: TokenPayload = {
      sub: user.id,
      name: user.name,
      cpf: user.cpf,
      email: user.email,
      role: user.role,
      iat: now,
      exp,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const signature = crypto
      .createHmac("sha256", this.secret)
      .update(dataToSign)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    return `${dataToSign}.${signature}`;
  }

  /**
   * Valida a assinatura do token e sua expiração temporal.
   * Retorna o payload se válido ou null se for inválido/expirado.
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const [encodedHeader, encodedPayload, signature] = parts;
      const dataToSign = `${encodedHeader}.${encodedPayload}`;

      const expectedSignature = crypto
        .createHmac("sha256", this.secret)
        .update(dataToSign)
        .digest("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");

      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);

      if (sigBuffer.length !== expectedBuffer.length) {
        return null;
      }

      if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        return null;
      }

      const payloadStr = this.base64UrlDecode(encodedPayload);
      const payload: TokenPayload = JSON.parse(payloadStr);

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }
}
