import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../ProtectedRoute";

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

function renderWithRoute(user: any, loading = false) {
  mockUseAuth.mockReturnValue({ user, loading, profile: null, refresh: vi.fn(), signOut: vi.fn() });
  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route path="/protected" element={<ProtectedRoute><div>Protected Content</div></ProtectedRoute>} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/verify-email-link" element={<div>Verify Email Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows loading spinner when loading", () => {
    renderWithRoute(null, true);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("redirects to /login when no user", async () => {
    renderWithRoute(null, false);
    await waitFor(() => {
      expect(screen.getByText("Login Page")).toBeInTheDocument();
    });
  });

  it("redirects to /verify-email-link when email not verified", async () => {
    renderWithRoute({ id: "1", displayName: "Test", email: "t@t.com", role: "user", isEmailVerified: false }, false);
    await waitFor(() => {
      expect(screen.getByText("Verify Email Page")).toBeInTheDocument();
    });
  });

  it("renders children when user is authenticated and verified", () => {
    renderWithRoute({ id: "1", displayName: "Test", email: "t@t.com", role: "user", isEmailVerified: true }, false);
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
