/**
 * Formatters for currency, percentages, and dates
 * Localized for Brazilian Portuguese
 */

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const brlCompactFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  compactDisplay: "short",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Format value in BRL.
 * If scale is "MIL", multiplies by 1000 first.
 */
export function formatCurrency(
  value: number | null | undefined,
  scale?: string
): string {
  if (value == null) return "—";
  const adjusted = scale === "MIL" ? value * 1000 : value;
  return brlCompactFormatter.format(adjusted);
}

/** Format value as full BRL (no compact) */
export function formatCurrencyFull(
  value: number | null | undefined,
  scale?: string
): string {
  if (value == null) return "—";
  const adjusted = scale === "MIL" ? value * 1000 : value;
  return brlFormatter.format(adjusted);
}

/** Format as percentage (0.15 → 15.0%) */
export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "—";
  return percentFormatter.format(value);
}

/** Format number with locale separators */
export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "—";
  return numberFormatter.format(value);
}

/** Format a ratio (e.g. 1.85x) */
export function formatRatio(value: number | null | undefined): string {
  if (value == null) return "—";
  return `${numberFormatter.format(value)}x`;
}

/** Format date string "2024-12-31" → "31/12/2024" */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

/** Extract year from date string "2024-12-31" → "2024" */
export function extractYear(dateStr: string): string {
  return dateStr.split("-")[0];
}

/** Format large BRL values with suffix (e.g., R$ 992,8 Bi) */
export function formatCurrencyWithSuffix(
  value: number | null | undefined,
  scale?: string
): string {
  if (value == null) return "—";
  const adjusted = scale === "MIL" ? value * 1000 : value;
  const abs = Math.abs(adjusted);
  const sign = adjusted < 0 ? "-" : "";

  if (abs >= 1e12) return `${sign}R$ ${(abs / 1e12).toFixed(1)} Tri`;
  if (abs >= 1e9) return `${sign}R$ ${(abs / 1e9).toFixed(1)} Bi`;
  if (abs >= 1e6) return `${sign}R$ ${(abs / 1e6).toFixed(1)} Mi`;
  if (abs >= 1e3) return `${sign}R$ ${(abs / 1e3).toFixed(1)} mil`;
  return brlFormatter.format(adjusted);
}

/**
 * Formata o nome completo para exibir apenas o primeiro e último nome.
 * Exemplo: "Jamille Maria Felix Barbosa" -> "Jamille Barbosa"
 */
export function formatShortName(fullName?: string | null): string {
  if (!fullName) return "Administrador";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

/**
 * Formata o CPF no padrão 000.000.000-00
 */
export function formatCPF(cpf?: string | null): string {
  if (!cpf) return "—";
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return cpf;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
}

