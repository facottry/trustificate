import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ForgotPasswordPage from "../ForgotPassword";

vi.mock("@/lib/apiClient", () => ({
  apiClient: vi.fn(),
  setAuthToken: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";

describe("ForgotPasswordPage", () => {
  beforeEach(() => vi.clearAllMocks());

  function renderPage() {
    return render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );
  }

  it("renders the forgot password form", () => {
    renderPage();
    expect(screen.getByText(/reset your password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("shows success state after sending reset email", async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient).mockResolvedValue({ success: true });

    renderPage();

    await user.type(screen.getByLabelText(/email/i), "t@t.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Password reset OTP sent!");
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it("shows error toast on failure", async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient).mockRejectedValue({ message: "User not found" });

    renderPage();

    await user.type(screen.getByLabelText(/email/i), "bad@t.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("User not found");
    });
  });

  it("has back to sign in link", () => {
    renderPage();
    expect(screen.getByText(/back to sign in/i)).toBeInTheDocument();
  });
});
