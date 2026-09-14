import { describe, it, expect, beforeEach } from "vitest";
import { GetFinancialsUseCase } from "../../../../src/modules/financial-statements/application/GetFinancialsUseCase.js";
import { MockFinancialRepository } from "../../../../src/modules/financial-statements/infrastructure/MockFinancialRepository.js";
import { CacheService } from "../../../../src/shared/infrastructure/cache/CacheService.js";

describe("GetFinancialsUseCase", () => {
  let useCase: GetFinancialsUseCase;

  beforeEach(() => {
    const cache = new CacheService(300, true);
    const repository = new MockFinancialRepository();
    useCase = new GetFinancialsUseCase(repository, cache);
  });

  it("should return balance sheet data", async () => {
    const result = await useCase.getBalanceSheet("PETR4", {
      consolidation: "CON",
      limit: 5,
    });

    expect(result.success).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].assets.length).toBeGreaterThan(0);
    expect(result.data[0].liabilities.length).toBeGreaterThan(0);
  });

  it("should return income statement data", async () => {
    const result = await useCase.getIncomeStatement("PETR4", {
      consolidation: "CON",
      limit: 5,
    });

    expect(result.success).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].lineItems.length).toBeGreaterThan(0);
  });

  it("should return cash flow data", async () => {
    const result = await useCase.getCashFlow("PETR4", {
      consolidation: "CON",
      limit: 5,
    });

    expect(result.success).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].method).toBe("MI");
  });

  it("should return revenue history", async () => {
    const result = await useCase.getRevenueHistory("PETR4", 5);

    expect(result.success).toBe(true);
    expect(result.data.length).toBe(5);
    expect(result.data[0].netRevenue).toBeGreaterThan(0);
  });

  it("should return net income history", async () => {
    const result = await useCase.getNetIncomeHistory("PETR4", 5);

    expect(result.success).toBe(true);
    expect(result.data.length).toBe(5);
  });
});
