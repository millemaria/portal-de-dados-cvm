import { z } from "zod";

/** Schema for company search/filter query parameters */
export const companySearchSchema = z.object({
  search: z
    .string()
    .max(200, "Search term too long")
    .optional(),
  sector: z
    .string()
    .max(100)
    .optional(),
  status: z
    .enum(["ATIVO", "INATIVO"])
    .optional(),
  page: z
    .coerce.number()
    .int()
    .min(1)
    .default(1),
  pageSize: z
    .coerce.number()
    .int()
    .min(1)
    .max(100)
    .default(20),
});

/** Schema for ticker path parameter */
export const tickerParamSchema = z.object({
  ticker: z
    .string()
    .min(1, "Ticker is required")
    .max(10, "Ticker too long")
    .regex(/^[A-Z0-9]+$/i, "Invalid ticker format")
    .transform((val) => val.toUpperCase()),
});

export type CompanySearchInput = z.infer<typeof companySearchSchema>;
export type TickerParamInput = z.infer<typeof tickerParamSchema>;
