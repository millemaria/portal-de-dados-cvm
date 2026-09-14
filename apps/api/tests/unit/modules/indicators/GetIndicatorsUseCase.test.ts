import { describe, it, expect, beforeEach } from "vitest";
import { GetIndicatorsUseCase } from "../../../../src/modules/indicators/application/GetIndicatorsUseCase.js";
import { MockIndicatorRepository } from "../../../../src/modules/indicators/infrastructure/MockIndicatorRepository.js";
import { CacheService } from "../../../../src/shared/infrastructure/cache/CacheService.js";

describe("GetIndicatorsUseCase", () => {
  let useCase: GetIndicatorsUseCase;

  beforeEach(() => {
    const cache = new CacheService(300, true);
    const repository = new MockIndicatorRepository();
    useCase = new GetIndicatorsUseCase(repository, cache);
  });

  it("should return indicators for known ticker", async () => {
    const result = await useCase.execute("PETR4");

    expect(result.success).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0].ticker).toBe("PETR4");
    expect(result.data[0].roe).toBeDefined();
    expect(result.data[0].netMargin).toBeDefined();
  });

  it("should return empty array for unknown ticker", async () => {
    const result = await useCase.execute("XXXX9");

    expect(result.success).toBe(true);
    expect(result.data.length).toBe(0);
  });
});
