import { describe, it, expect, beforeEach } from "vitest";
import { GetCompanyByTickerUseCase } from "../../../../src/modules/companies/application/GetCompanyByTickerUseCase.js";
import { MockCompanyRepository } from "../../../../src/modules/companies/infrastructure/MockCompanyRepository.js";
import { CacheService } from "../../../../src/shared/infrastructure/cache/CacheService.js";

describe("GetCompanyByTickerUseCase", () => {
  let useCase: GetCompanyByTickerUseCase;

  beforeEach(() => {
    const cache = new CacheService(300, true);
    const repository = new MockCompanyRepository();
    useCase = new GetCompanyByTickerUseCase(repository, cache);
  });

  it("should return company by ticker", async () => {
    const result = await useCase.execute("PETR4");

    expect(result).not.toBeNull();
    expect(result!.success).toBe(true);
    expect(result!.data.ticker).toBe("PETR4");
    expect(result!.data.companyName).toContain("PETROBRAS");
  });

  it("should return null for unknown ticker", async () => {
    const result = await useCase.execute("XXXX9");

    expect(result).toBeNull();
  });

  it("should be case-insensitive", async () => {
    const result = await useCase.execute("petr4");

    expect(result).not.toBeNull();
    expect(result!.data.ticker).toBe("PETR4");
  });
});
