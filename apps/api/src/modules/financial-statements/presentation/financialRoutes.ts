import type { FastifyInstance } from "fastify";
import { tickerParamSchema, financialQuerySchema } from "@portal-cvm/validation";
import type { GetFinancialsUseCase } from "../application/GetFinancialsUseCase.js";

export function registerFinancialRoutes(
  server: FastifyInstance,
  getFinancials: GetFinancialsUseCase
) {
  // Helper to validate ticker param
  const validateTicker = (params: unknown) => {
    const parsed = tickerParamSchema.safeParse(params);
    if (!parsed.success) {
      return {
        error: {
          success: false as const,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid ticker parameter",
            details: parsed.error.flatten(),
          },
        },
      };
    }
    return { ticker: parsed.data.ticker };
  };

  // Helper to validate financial query
  const validateQuery = (query: unknown) => {
    const parsed = financialQuerySchema.safeParse(query);
    if (!parsed.success) {
      return {
        error: {
          success: false as const,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: parsed.error.flatten(),
          },
        },
      };
    }
    return { params: parsed.data };
  };

  // GET /api/companies/:ticker/financials
  server.get<{ Params: { ticker: string } }>(
    "/api/companies/:ticker/financials",
    async (request, reply) => {
      const tickerResult = validateTicker(request.params);
      if ("error" in tickerResult) return reply.status(400).send(tickerResult.error);

      const queryResult = validateQuery(request.query);
      if ("error" in queryResult) return reply.status(400).send(queryResult.error);

      const [balanceSheet, incomeStatement, cashFlow] = await Promise.all([
        getFinancials.getBalanceSheet(tickerResult.ticker, queryResult.params),
        getFinancials.getIncomeStatement(tickerResult.ticker, queryResult.params),
        getFinancials.getCashFlow(tickerResult.ticker, queryResult.params),
      ]);

      return reply.send({
        success: true,
        data: {
          balanceSheet: balanceSheet.data,
          incomeStatement: incomeStatement.data,
          cashFlow: cashFlow.data,
        },
      });
    }
  );

  // GET /api/companies/:ticker/balance-sheet
  server.get<{ Params: { ticker: string } }>(
    "/api/companies/:ticker/balance-sheet",
    async (request, reply) => {
      const tickerResult = validateTicker(request.params);
      if ("error" in tickerResult) return reply.status(400).send(tickerResult.error);

      const queryResult = validateQuery(request.query);
      if ("error" in queryResult) return reply.status(400).send(queryResult.error);

      const result = await getFinancials.getBalanceSheet(
        tickerResult.ticker,
        queryResult.params
      );
      return reply.send(result);
    }
  );

  // GET /api/companies/:ticker/income-statement
  server.get<{ Params: { ticker: string } }>(
    "/api/companies/:ticker/income-statement",
    async (request, reply) => {
      const tickerResult = validateTicker(request.params);
      if ("error" in tickerResult) return reply.status(400).send(tickerResult.error);

      const queryResult = validateQuery(request.query);
      if ("error" in queryResult) return reply.status(400).send(queryResult.error);

      const result = await getFinancials.getIncomeStatement(
        tickerResult.ticker,
        queryResult.params
      );
      return reply.send(result);
    }
  );

  // GET /api/companies/:ticker/cash-flow
  server.get<{ Params: { ticker: string } }>(
    "/api/companies/:ticker/cash-flow",
    async (request, reply) => {
      const tickerResult = validateTicker(request.params);
      if ("error" in tickerResult) return reply.status(400).send(tickerResult.error);

      const queryResult = validateQuery(request.query);
      if ("error" in queryResult) return reply.status(400).send(queryResult.error);

      const result = await getFinancials.getCashFlow(
        tickerResult.ticker,
        queryResult.params
      );
      return reply.send(result);
    }
  );
}
