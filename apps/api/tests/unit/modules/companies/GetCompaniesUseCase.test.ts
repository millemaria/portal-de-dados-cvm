import { describe, it, expect, beforeEach } from "vitest";
import { GetCompaniesUseCase } from "../../../../src/modules/companies/application/GetCompaniesUseCase.js";
import { MockCompanyRepository } from "../../../../src/modules/companies/infrastructure/MockCompanyRepository.js";
import { CacheService } from "../../../../src/shared/infrastructure/cache/CacheService.js";

describe("GetCompaniesUseCase", () => {
  let useCase: GetCompaniesUseCase;
  let cache: CacheService;

  beforeEach(() => {
    cache = new CacheService(300, true);
    const repository = new MockCompanyRepository();
    useCase = new GetCompaniesUseCase(repository, cache);
  });

  it("should return paginated companies", async () => {
    const result = await useCase.execute({ page: 1, pageSize: 20 });

    expect(result.success).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.pagination).toBeDefined();
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.totalItems).toBeGreaterThan(0);
  });

  it("should filter by search term", async () => {
    const result = await useCase.execute({
      page: 1,
      pageSize: 20,
      search: "PETROBRAS",
    });

    expect(result.success).toBe(true);
    expect(result.data.length).toBe(1);
    expect(result.data[0].ticker).toBe("PETR4");
  });

  it("should filter by ticker search", async () => {
    const result = await useCase.execute({
      page: 1,
      pageSize: 20,
      search: "VALE3",
    });

    expect(result.success).toBe(true);
    expect(result.data.length).toBe(1);
    expect(result.data[0].companyName).toContain("VALE");
  });

  it("should return empty results for unknown search", async () => {
    const result = await useCase.execute({
      page: 1,
      pageSize: 20,
      search: "UNKNOWN_COMPANY_XYZ",
    });

    expect(result.success).toBe(true);
    expect(result.data.length).toBe(0);
    expect(result.pagination.totalItems).toBe(0);
  });

  it("should respect pagination", async () => {
    const result = await useCase.execute({ page: 1, pageSize: 2 });

    expect(result.data.length).toBe(2);
    expect(result.pagination.pageSize).toBe(2);
    expect(result.pagination.hasNextPage).toBe(true);
  });

  it("should use cache on repeated calls", async () => {
    const params = { page: 1, pageSize: 20, search: "PETR" };
    const result1 = await useCase.execute(params);
    const result2 = await useCase.execute(params);

    expect(result1).toEqual(result2);
    expect(cache.size).toBe(1);
  });
});
