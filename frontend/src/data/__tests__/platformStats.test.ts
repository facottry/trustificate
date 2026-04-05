import { describe, it, expect } from "vitest";
import { PLATFORM_STATS } from "../platformStats";

describe("PLATFORM_STATS", () => {
  it("has all required stat keys", () => {
    expect(PLATFORM_STATS).toHaveProperty("CERTIFICATES_ISSUED");
    expect(PLATFORM_STATS).toHaveProperty("ORGANIZATIONS");
    expect(PLATFORM_STATS).toHaveProperty("VERIFICATIONS");
    expect(PLATFORM_STATS).toHaveProperty("TEMPLATES");
    expect(PLATFORM_STATS).toHaveProperty("UPTIME_SLA");
    expect(PLATFORM_STATS).toHaveProperty("COUNTRIES_SERVED");
  });

  it("has numeric values for counts", () => {
    expect(typeof PLATFORM_STATS.CERTIFICATES_ISSUED).toBe("number");
    expect(typeof PLATFORM_STATS.ORGANIZATIONS).toBe("number");
    expect(typeof PLATFORM_STATS.VERIFICATIONS).toBe("number");
    expect(typeof PLATFORM_STATS.TEMPLATES).toBe("number");
  });

  it("has positive values", () => {
    expect(PLATFORM_STATS.CERTIFICATES_ISSUED).toBeGreaterThan(0);
    expect(PLATFORM_STATS.ORGANIZATIONS).toBeGreaterThan(0);
  });

  it("has string labels", () => {
    expect(typeof PLATFORM_STATS.CERTIFICATES_ISSUED_LABEL).toBe("string");
    expect(typeof PLATFORM_STATS.UPTIME_SLA).toBe("string");
  });
});
