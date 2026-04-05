import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePlatformStats } from "../usePlatformStats";

vi.mock("@/lib/apiClient", () => ({
  apiClient: vi.fn(),
}));

import { apiClient } from "@/lib/apiClient";
const mockApiClient = vi.mocked(apiClient);

describe("usePlatformStats", () => {
  afterEach(() => vi.clearAllMocks());

  it("starts with loading true and fallback values", () => {
    mockApiClient.mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => usePlatformStats());
    expect(result.current.loading).toBe(true);
    expect(result.current.credentialsIssued).toBeGreaterThan(0);
  });

  it("updates stats from API response", async () => {
    mockApiClient.mockResolvedValue({
      success: true,
      data: {
        credentialsIssued: 500,
        organizations: 20,
        verifications: 1500,
        templates: 60,
      },
    });

    const { result } = renderHook(() => usePlatformStats());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.credentialsIssued).toBe(500);
    expect(result.current.organizations).toBe(20);
    expect(result.current.verifications).toBe(1500);
    expect(result.current.templates).toBe(60);
  });

  it("falls back to defaults on API error", async () => {
    mockApiClient.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => usePlatformStats());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Should still have fallback values
    expect(result.current.credentialsIssued).toBeGreaterThan(0);
    expect(result.current.organizations).toBeGreaterThan(0);
  });
});
