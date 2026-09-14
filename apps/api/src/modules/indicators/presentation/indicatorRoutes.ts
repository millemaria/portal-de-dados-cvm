import type { FastifyInstance } from "fastify";
import { tickerParamSchema } from "@portal-cvm/validation";
import type { GetIndicatorsUseCase } from "../application/GetIndicatorsUseCase.js";

export function registerIndicatorRoutes(
  server: FastifyInstance,
  getIndicators: GetIndicatorsUseCase
) {
  // GET /api/companies/:ticker/indicators
  server.get<{ Params: { ticker: string } }>(
    "/api/companies/:ticker/indicators",
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

      const result = await getIndicators.execute(parsed.data.ticker);
      return reply.send(result);
    }
  );
}
