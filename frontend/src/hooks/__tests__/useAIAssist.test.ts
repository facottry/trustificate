import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAIAssist } from "../useAIAssist";

vi.mock("@/lib/apiClient", () => ({
  apiClient: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
const mockApiClient = vi.mocked(apiClient);

describe("useAIAssist", () => {
  afterEach(() => vi.clearAllMocks());

  it("starts with loading false", () => {
    const { result } = renderHook(() => useAIAssist());
    expect(result.current.loading).toBe(false);
  });

  it("getDocumentSuggestions returns suggestions on success", async () => {
    mockApiClient.mockResolvedValue({
      success: true,
      data: { suggestions: { recipientName: "John Doe" } },
    });

    const { result } = renderHook(() => useAIAssist());
    let suggestions: any;
    await act(async () => {
      suggestions = await result.current.getDocumentSuggestions({
        templateTitle: "Test",
        templatePrefix: "CC",
      });
    });

    expect(suggestions).toEqual({ recipientName: "John Doe" });
    expect(mockApiClient).toHaveBeenCalledWith("/api/ai/assist", {
      method: "POST",
      body: expect.stringContaining("document-fill"),
    });
  });

  it("getTemplateSuggestions returns suggestions on success", async () => {
    mockApiClient.mockResolvedValue({
      success: true,
      data: { suggestions: { title: "Pro Certificate" } },
    });

    const { result } = renderHook(() => useAIAssist());
    let suggestions: any;
    await act(async () => {
      suggestions = await result.current.getTemplateSuggestions({ title: "Draft" });
    });

    expect(suggestions).toEqual({ title: "Pro Certificate" });
  });

  it("returns null and shows toast on error", async () => {
    mockApiClient.mockRejectedValue(new Error("AI down"));

    const { result } = renderHook(() => useAIAssist());
    let suggestions: any;
    await act(async () => {
      suggestions = await result.current.getDocumentSuggestions({
        templateTitle: "Test",
        templatePrefix: "CC",
      });
    });

    expect(suggestions).toBeNull();
    expect(toast.error).toHaveBeenCalledWith("AI down");
  });

  it("sets loading during request", async () => {
    let resolvePromise: any;
    mockApiClient.mockImplementation(
      () => new Promise((resolve) => { resolvePromise = resolve; })
    );

    const { result } = renderHook(() => useAIAssist());

    let promise: Promise<any>;
    act(() => {
      promise = result.current.getDocumentSuggestions({
        templateTitle: "Test",
        templatePrefix: "CC",
      });
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise({ success: true, data: { suggestions: {} } });
      await promise!;
    });

    expect(result.current.loading).toBe(false);
  });
});
