import { z } from "zod";

/**
 * Remove qualquer caractere não numérico do CPF.
 * Exemplo: "123.456.789-00" -> "12345678900"
 */
export function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

/**
 * Aplica a máscara padrão de CPF (000.000.000-00).
 * Se o valor não tiver 11 dígitos, retorna o valor original ou parcial.
 */
export function formatCpf(cpf: string): string {
  const digits = normalizeCpf(cpf).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Validação algorítmica completa de CPF pelo Módulo 11 (Receita Federal).
 * Suporta entrada com ou sem máscara de formatação.
 */
export function validateCpf(cpf: string): boolean {
  if (!cpf) return false;

  const digits = normalizeCpf(cpf);

  // CPF deve ter exatamente 11 dígitos numéricos
  if (digits.length !== 11) return false;

  // Rejeita sequências conhecidas de dígitos repetidos (ex: 000.000.000-00, 111.111.111-11, etc.)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // Validação do 1º Dígito Verificador
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    sum1 += parseInt(digits[i], 10) * (10 - i);
  }
  let remainder1 = (sum1 * 10) % 11;
  if (remainder1 === 10 || remainder1 === 11) remainder1 = 0;
  if (remainder1 !== parseInt(digits[9], 10)) return false;

  // Validação do 2º Dígito Verificador
  let sum2 = 0;
  for (let i = 0; i < 10; i++) {
    sum2 += parseInt(digits[i], 10) * (11 - i);
  }
  let remainder2 = (sum2 * 10) % 11;
  if (remainder2 === 10 || remainder2 === 11) remainder2 = 0;
  if (remainder2 !== parseInt(digits[10], 10)) return false;

  return true;
}

/**
 * Schema Zod para autenticação administrativa.
 * O campo CPF aceita formatos mascarados ou não, normaliza para 11 dígitos numéricos
 * e valida os dígitos verificadores pelo algoritmo oficial do CPF.
 */
export const loginSchema = z.object({
  cpf: z
    .string()
    .min(1, "CPF é obrigatório")
    .transform((val) => normalizeCpf(val))
    .refine((val) => validateCpf(val), {
      message: "CPF inválido. Verifique os dígitos informados.",
    }),
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;
