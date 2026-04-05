import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { OptionalProtectedRoute } from "../OptionalProtectedRoute";

const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("OptionalProtectedRoute", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows loading spinner when loading", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    render(<OptionalProtectedRoute><div>Content</div></OptionalProtectedRoute>);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders children when not loading (no user)", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    render(<OptionalProtectedRoute><div>Public Content</div></OptionalProtectedRoute>);
    expect(screen.getByText("Public Content")).toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "1", displayName: "Test", email: "t@t.com", role: "user" },
      loading: false,
    });
    render(<OptionalProtectedRoute><div>Content for All</div></OptionalProtectedRoute>);
    expect(screen.getByText("Content for All")).toBeInTheDocument();
  });
});
