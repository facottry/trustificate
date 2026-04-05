import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient, ApiError, getAuthToken, setAuthToken, getBackendVersion } from "../apiClient";

describe("apiClient", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("setAuthToken / getAuthToken", () => {
    it("stores and retrieves a token", () => {
      setAuthToken("abc123");
      expect(getAuthToken()).toBe("abc123");
    });

    it("removes token when set to null", () => {
      setAuthToken("abc123");
      setAuthToken(null);
      expect(getAuthToken()).toBeNull();
    });
  });

  describe("getBackendVersion", () => {
    it("returns null when no version stored", () => {
      expect(getBackendVersion()).toBeNull();
    });

    it("returns stored version", () => {
      sessionStorage.setItem("TRUSTIFICATE:backend-version", "1.4.5");
      expect(getBackendVersion()).toBe("1.4.5");
    });
  });

  describe("ApiError", () => {
    it("creates error with message, code, and status", () => {
      const err = new ApiError("Not found", "NOT_FOUND", 404);
      expect(err.message).toBe("Not found");
      expect(err.code).toBe("NOT_FOUND");
      expect(err.status).toBe(404);
      expect(err.name).toBe("ApiError");
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe("fetch calls", () => {
    it("prepends base URL to relative paths", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: () => Promise.resolve({ success: true, data: { id: 1 } }),
      });

      await apiClient("/api/test");

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/test"),
        expect.any(Object)
      );
    });

    it("attaches Authorization header when token exists", async () => {
      setAuthToken("mytoken");
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: () => Promise.resolve({ success: true }),
      });

      await apiClient("/api/test");

      const callArgs = (globalThis.fetch as any).mock.calls[0];
      expect(callArgs[1].headers.Authorization).toBe("Bearer mytoken");
    });

    it("does not attach Authorization header when no token", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: () => Promise.resolve({ success: true }),
      });

      await apiClient("/api/test");

      const callArgs = (globalThis.fetch as any).mock.calls[0];
      expect(callArgs[1].headers.Authorization).toBeUndefined();
    });

    it("returns parsed JSON on success", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: () => Promise.resolve({ success: true, data: { name: "test" } }),
      });

      const result = await apiClient<{ name: string }>("/api/test");
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe("test");
    });

    it("throws ApiError on non-OK response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers(),
        json: () => Promise.resolve({ message: "Unauthorized", code: "AUTH_FAIL" }),
      });

      await expect(apiClient("/api/test")).rejects.toThrow(ApiError);
      try {
        await apiClient("/api/test");
      } catch (e: any) {
        expect(e.message).toBe("Unauthorized");
        expect(e.code).toBe("AUTH_FAIL");
        expect(e.status).toBe(401);
      }
    });

    it("stores backend version from X-App-Version header", async () => {
      const headers = new Headers();
      headers.set("X-App-Version", "2.0.0");
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers,
        json: () => Promise.resolve({ success: true }),
      });

      await apiClient("/api/test");
      expect(getBackendVersion()).toBe("2.0.0");
    });

    it("handles non-JSON error responses gracefully", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers(),
        json: () => Promise.reject(new Error("not json")),
      });

      await expect(apiClient("/api/test")).rejects.toThrow("API request failed");
    });

    it("passes custom headers through", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: () => Promise.resolve({ success: true }),
      });

      await apiClient("/api/test", {
        headers: { "X-Custom": "value" } as any,
      });

      const callArgs = (globalThis.fetch as any).mock.calls[0];
      expect(callArgs[1].headers["X-Custom"]).toBe("value");
    });
  });
});
