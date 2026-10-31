import { describe, expect, it } from "vitest";
import { CREDIT_COSTS, MAX_UPLOAD_BYTES, PLAN_CATALOG, SUPPORTED_FILE_TYPES } from "@/lib/constants";

describe("PLAN_CATALOG", () => {
  it("contains the three canonical plans in price order", () => {
    const plans = [PLAN_CATALOG.free, PLAN_CATALOG.pro, PLAN_CATALOG.team];
    expect(plans.map((p) => p.priceMonthlyCents)).toEqual([0, 1200, 3900]);
  });

  it("free plan grants no projects and no priority processing", () => {
    expect(PLAN_CATALOG.free.projectsAllowed).toBe(false);
    expect(PLAN_CATALOG.free.priority).toBe(false);
  });

  it("monthly allowances increase monotonically across plans", () => {
    expect(PLAN_CATALOG.free.monthlyCredits).toBeLessThan(PLAN_CATALOG.pro.monthlyCredits);
    expect(PLAN_CATALOG.pro.monthlyCredits).toBeLessThan(PLAN_CATALOG.team.monthlyCredits);
  });

  it("all plans expose a consistent shape", () => {
    for (const plan of Object.values(PLAN_CATALOG)) {
      expect(plan).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        priceMonthlyCents: expect.any(Number),
        monthlyCredits: expect.any(Number),
        storageBytes: expect.any(Number),
      });
    }
  });
});

describe("CREDIT_COSTS", () => {
  it("all costs are non-negative numbers", () => {
    for (const cost of Object.values(CREDIT_COSTS)) {
      expect(cost).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(cost)).toBe(true);
    }
  });

  it("AI operations cost credits, extraction is metered", () => {
    expect(CREDIT_COSTS.summary).toBeGreaterThan(0);
    expect(CREDIT_COSTS.chat_question).toBeGreaterThan(0);
    expect(CREDIT_COSTS.document_extract).toBeGreaterThan(0);
  });
});

describe("upload limits", () => {
  it("exposes a 10 MB cap and supported types", () => {
    expect(MAX_UPLOAD_BYTES).toBe(10 * 1024 * 1024);
    expect(SUPPORTED_FILE_TYPES).toEqual(["pdf", "docx", "txt"]);
  });
});
