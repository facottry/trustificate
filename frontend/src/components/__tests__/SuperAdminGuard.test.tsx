import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { SuperAdminGuard } from "../SuperAdminGuard";

const mockUseAuth = vi.fn();
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

function renderGuard(user: any) {
  mockUseAuth.mockReturnValue({ user, loading: false });
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="/admin" element={<SuperAdminGuard><div>Admin Panel</div></SuperAdminGuard>} />
        <Route path="/super-admin/login" element={<div>Super Admin Login</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("SuperAdminGuard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects to login when no user", async () => {
    renderGuard(null);
    await waitFor(() => {
      expect(screen.getByText("Super Admin Login")).toBeInTheDocument();
    });
  });

  it("redirects to login when user is not admin", async () => {
    renderGuard({ id: "1", role: "user" });
    await waitFor(() => {
      expect(screen.getByText("Super Admin Login")).toBeInTheDocument();
    });
  });

  it("renders children when user is admin", async () => {
    renderGuard({ id: "1", role: "admin" });
    await waitFor(() => {
      expect(screen.getByText("Admin Panel")).toBeInTheDocument();
    });
  });
});
