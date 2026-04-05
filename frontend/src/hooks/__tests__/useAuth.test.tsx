import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../useAuth";
import type { ReactNode } from "react";

vi.mock("@/lib/apiClient", () => ({
  apiClient: vi.fn(),
  setAuthToken: vi.fn(),
}));

import { apiClient, setAuthToken } from "@/lib/apiClient";
const mockApiClient = vi.mocked(apiClient);
const mockSetAuthToken = vi.mocked(setAuthToken);

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts with loading true", () => {
    mockApiClient.mockImplementation(() => new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it("sets user after successful /api/auth/me", async () => {
    mockApiClient.mockResolvedValue({
      success: true,
      data: { id: "1", displayName: "Test User", email: "test@example.com", role: "user", organizationId: "org1" },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual({
      id: "1",
      displayName: "Test User",
      email: "test@example.com",
      role: "user",
      organizationId: "org1",
    });
    expect(result.current.profile?.display_name).toBe("Test User");
  });

  it("sets user to null on failed /api/auth/me", async () => {
    mockApiClient.mockRejectedValue(new Error("Unauthorized"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(mockSetAuthToken).toHaveBeenCalledWith(null);
  });

  it("signOut clears user and token", async () => {
    mockApiClient.mockResolvedValue({
      success: true,
      data: { id: "1", displayName: "Test", email: "t@t.com", role: "user" },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.signOut());

    expect(result.current.user).toBeNull();
    expect(mockSetAuthToken).toHaveBeenCalledWith(null);
  });

  it("refresh re-fetches user data", async () => {
    mockApiClient
      .mockResolvedValueOnce({
        success: true,
        data: { id: "1", displayName: "Old", email: "t@t.com", role: "user" },
      })
      .mockResolvedValueOnce({
        success: true,
        data: { id: "1", displayName: "New", email: "t@t.com", role: "admin" },
      });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user?.displayName).toBe("Old"));

    await act(() => result.current.refresh());
    expect(result.current.user?.displayName).toBe("New");
  });
});
