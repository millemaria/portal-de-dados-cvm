import type { EnvConfig } from "./config/env.js";
import { buildServer } from "./config/server.js";
import { CacheService } from "./shared/infrastructure/cache/CacheService.js";
import { DatabricksClient } from "./shared/infrastructure/databricks/DatabricksClient.js";

// Companies
import type { CompanyRepository } from "./modules/companies/domain/CompanyRepository.js";
import { MockCompanyRepository } from "./modules/companies/infrastructure/MockCompanyRepository.js";
import { DatabricksCompanyRepository } from "./modules/companies/infrastructure/DatabricksCompanyRepository.js";
import { GetCompaniesUseCase } from "./modules/companies/application/GetCompaniesUseCase.js";
import { GetCompanyByTickerUseCase } from "./modules/companies/application/GetCompanyByTickerUseCase.js";
import { registerCompanyRoutes } from "./modules/companies/presentation/companiesRoutes.js";

// Financial statements
import type { FinancialRepository } from "./modules/financial-statements/domain/FinancialRepository.js";
import { MockFinancialRepository } from "./modules/financial-statements/infrastructure/MockFinancialRepository.js";
import { GetFinancialsUseCase } from "./modules/financial-statements/application/GetFinancialsUseCase.js";
import { registerFinancialRoutes } from "./modules/financial-statements/presentation/financialRoutes.js";

// Indicators
import type { IndicatorRepository } from "./modules/indicators/domain/IndicatorRepository.js";
import { MockIndicatorRepository } from "./modules/indicators/infrastructure/MockIndicatorRepository.js";
import { GetIndicatorsUseCase } from "./modules/indicators/application/GetIndicatorsUseCase.js";
import { registerIndicatorRoutes } from "./modules/indicators/presentation/indicatorRoutes.js";

// Auth
import { PasswordService } from "./modules/auth/infrastructure/PasswordService.js";
import { TokenService } from "./modules/auth/infrastructure/TokenService.js";
import { MockUserRepository } from "./modules/auth/infrastructure/MockUserRepository.js";
import { LoginUseCase } from "./modules/auth/application/LoginUseCase.js";
import { VerifySessionUseCase } from "./modules/auth/application/VerifySessionUseCase.js";
import { registerAuthRoutes } from "./modules/auth/presentation/authRoutes.js";

export async function createApp(config: EnvConfig) {
  const server = await buildServer(config);

  // --- Infrastructure ---
  const cache = new CacheService(config.CACHE_TTL, config.CACHE_TTL > 0);

  // --- Repositories (choose mock or Databricks based on config) ---
  let companyRepository: CompanyRepository;
  let financialRepository: FinancialRepository;
  let indicatorRepository: IndicatorRepository;

  if (config.USE_MOCK_DATA) {
    console.log("📦 Using MOCK repositories (local development mode)");
    companyRepository = new MockCompanyRepository();
    financialRepository = new MockFinancialRepository();
    indicatorRepository = new MockIndicatorRepository();
  } else {
    console.log("🔗 Using DATABRICKS repositories (production mode)");

    if (
      !config.DATABRICKS_HOST ||
      !config.DATABRICKS_TOKEN ||
      !config.DATABRICKS_WAREHOUSE_ID
    ) {
      throw new Error(
        "Databricks configuration required when USE_MOCK_DATA=false. " +
          "Set DATABRICKS_HOST, DATABRICKS_TOKEN, and DATABRICKS_WAREHOUSE_ID."
      );
    }

    const databricksClient = new DatabricksClient({
      host: config.DATABRICKS_HOST,
      token: config.DATABRICKS_TOKEN,
      warehouseId: config.DATABRICKS_WAREHOUSE_ID,
      catalog: config.DATABRICKS_CATALOG,
      schema: config.DATABRICKS_SCHEMA,
    });

    companyRepository = new DatabricksCompanyRepository(databricksClient);
    // TODO: Implement DatabricksFinancialRepository and DatabricksIndicatorRepository
    // For now, fall back to mock for financial and indicator data
    financialRepository = new MockFinancialRepository();
    indicatorRepository = new MockIndicatorRepository();
  }

  // --- Auth Services & Repository ---
  const passwordService = new PasswordService();
  const tokenService = new TokenService(config.JWT_SECRET);
  const userRepository = new MockUserRepository(passwordService);

  // --- Use Cases ---
  const getCompanies = new GetCompaniesUseCase(companyRepository, cache);
  const getCompanyByTicker = new GetCompanyByTickerUseCase(
    companyRepository,
    cache
  );
  const getFinancials = new GetFinancialsUseCase(financialRepository, cache);
  const getIndicators = new GetIndicatorsUseCase(indicatorRepository, cache);
  const loginUseCase = new LoginUseCase(
    userRepository,
    passwordService,
    tokenService
  );
  const verifySessionUseCase = new VerifySessionUseCase(
    userRepository,
    tokenService
  );

  // --- Routes ---
  registerAuthRoutes(server, loginUseCase, verifySessionUseCase);
  registerCompanyRoutes(server, getCompanies, getCompanyByTicker);
  registerFinancialRoutes(server, getFinancials);
  registerIndicatorRoutes(server, getIndicators);

  server.addHook('onRequest', (request, reply, done) => {
    console.log(`[REQ] ${request.method} ${request.url}`);
    done();
  });

  // --- Global error handler ---
  server.setErrorHandler((error: Error & { statusCode?: number }, _request, reply) => {
    server.log.error(error);

    const statusCode = error.statusCode ?? 500;
    reply.status(statusCode).send({
      success: false,
      error: {
        code: statusCode === 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR",
        message:
          config.NODE_ENV === "production"
            ? "An unexpected error occurred"
            : error.message,
      },
    });
  });

  return server;
}
