import type { FastifyInstance } from "fastify";
import { companySearchSchema, tickerParamSchema } from "@portal-cvm/validation";
import type { GetCompaniesUseCase } from "../application/GetCompaniesUseCase.js";
import type { GetCompanyByTickerUseCase } from "../application/GetCompanyByTickerUseCase.js";

export function registerCompanyRoutes(
  server: FastifyInstance,
  getCompanies: GetCompaniesUseCase,
  getCompanyByTicker: GetCompanyByTickerUseCase
) {
  // GET /api/companies
  server.get("/api/companies", async (request, reply) => {
    const parsed = companySearchSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: parsed.error.flatten(),
        },
      });
    }

    const result = await getCompanies.execute(parsed.data);
    return reply.send(result);
  });

  // GET /api/companies/:ticker
  server.get<{ Params: { ticker: string } }>(
    "/api/companies/:ticker",
    async (request, reply) => {
      const parsed = tickerParamSchema.safeParse(request.params);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid ticker parameter",
            details: parsed.error.flatten(),
          },
        });
      }

      const result = await getCompanyByTicker.execute(parsed.data.ticker);
      if (!result) {
        return reply.status(404).send({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Company with ticker '${parsed.data.ticker}' not found`,
          },
        });
      }

      return reply.send(result);
    }
  );
}
