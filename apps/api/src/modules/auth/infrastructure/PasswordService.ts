import crypto from "node:crypto";

/**
 * Serviço de criptografia e verificação de senhas utilizando o módulo nativo node:crypto.
 */
export class PasswordService {
  /**
   * Gera um salt aleatório e calcula o hash criptográfico seguro da senha.
   */
  hashPassword(password: string): { hash: string; salt: string } {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto
      .scryptSync(password, salt, 64)
      .toString("hex");
    return { hash, salt };
  }

  /**
   * Compara uma senha fornecida com o hash armazenado usando timingSafeEqual
   * para prevenir ataques de temporização (timing attacks).
   */
  verifyPassword(password: string, storedHash: string, salt: string): boolean {
    try {
      const computedHash = crypto
        .scryptSync(password, salt, 64)
        .toString("hex");

      const computedBuffer = Buffer.from(computedHash, "hex");
      const storedBuffer = Buffer.from(storedHash, "hex");

      if (computedBuffer.length !== storedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(computedBuffer, storedBuffer);
    } catch {
      return false;
    }
  }
}
