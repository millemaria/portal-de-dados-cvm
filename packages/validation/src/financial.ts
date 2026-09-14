import { z } from "zod";

/** Schema for financial statement query parameters */
export const financialQuerySchema = z.object({
  /** Consolidation type filter */
  consolidation: z
    .enum(["CON", "IND"])
    .default("CON"),
  /** Reference year filter */
  year: z
    .coerce.number()
    .int()
    .min(2010)
    .max(2030)
    .optional(),
  /** Limit number of periods returned */
  limit: z
    .coerce.number()
    .int()
    .min(1)
    .max(20)
    .default(5),
});

export type FinancialQueryInput = z.infer<typeof financialQuerySchema>;
