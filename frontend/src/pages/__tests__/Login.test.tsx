import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "../Login";

const mockNavigate = vi.fn();
const mockRefresh = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false, refresh: mockRefresh, signOut: vi.fn() }),
}));

vi.mock("@/lib/apiClient", () => ({
  apiClient: vi.fn(),
  setAuthToken: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

// Mock mascot assets
vi.mock("@/assets/mascot-idle.png", () => ({ default: "" }));
vi.mock("@/assets/mascot-working.png", () => ({ default: "" }));
vi.mock("@/assets/mascot-success.png", () => ({ default: "" }));
vi.mock("@/assets/mascot-error.png", () => ({ default: "" }));
vi.mock("@/assets/mascot-verified.png", () => ({ default: "" }));
vi.mock("@/assets/mascot-search.png", () => ({ default: "" }));
vi.mock("@/assets/mascot.png", () => ({ default: "" }));

import { apiClient, setAuthToken } from "@/lib/apiClient";
import { toast } from "sonner";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  function renderLogin() {
    return render(
      <MemoryRouter initialEntries={["/login"]}>
        <LoginPage />
      </MemoryRouter>
    );
  }

  it("renders login form with email and password fields", () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("renders link to signup page", () => {
    renderLogin();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });

  it("renders link to forgot password", () => {
    renderLogin();
    expect(screen.getByText(/forgot password\?/i)).toBeInTheDocument();
  });

  it("submits login form and navigates to dashboard on success", async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient).mockResolvedValue({
      success: true,
      data: {
        token: "jwt-token",
        user: { isEmailVerified: true, email: "t@t.com", displayName: "Test" },
      },
    });
    mockRefresh.mockResolvedValue(undefined);

    renderLogin();

    await user.type(screen.getByLabelText(/email/i), "t@t.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(setAuthToken).toHaveBeenCalledWith("jwt-token");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error toast on login failure", async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient).mockRejectedValue({ message: "Invalid credentials" });

    renderLogin();

    await user.type(screen.getByLabelText(/email/i), "bad@t.com");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid credentials");
    });
  });

  it("redirects to verify-email when email not verified", async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient).mockResolvedValue({
      success: true,
      data: {
        user: { isEmailVerified: false, email: "t@t.com", displayName: "Test" },
        emailVerificationPending: true,
      },
    });

    renderLogin();

    await user.type(screen.getByLabelText(/email/i), "t@t.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/verify-email-link", expect.any(Object));
    });
  });
});
