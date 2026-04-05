import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SignupPage from "../Signup";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false, refresh: vi.fn(), signOut: vi.fn() }),
}));

vi.mock("@/lib/apiClient", () => ({
  apiClient: vi.fn(),
  setAuthToken: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

vi.mock("@/assets/mascot-idle.png", () => ({ default: "" }));
vi.mock("@/assets/mascot-working.png", () => ({ default: "" }));
vi.mock("@/assets/mascot-success.png", () => ({ default: "" }));
vi.mock("@/assets/mascot-error.png", () => ({ default: "" }));
vi.mock("@/assets/mascot-verified.png", () => ({ default: "" }));
vi.mock("@/assets/mascot-search.png", () => ({ default: "" }));
vi.mock("@/assets/mascot.png", () => ({ default: "" }));

import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";

describe("SignupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  function renderSignup() {
    return render(
      <MemoryRouter initialEntries={["/signup"]}>
        <SignupPage />
      </MemoryRouter>
    );
  }

  it("renders signup form fields", () => {
    renderSignup();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("renders link to login page", () => {
    renderSignup();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  it("shows error for short password", async () => {
    const user = userEvent.setup();
    renderSignup();

    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "t@t.com");
    await user.type(screen.getByLabelText(/password/i), "12345");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Password must be at least 6 characters");
    });
  });

  it("submits signup and navigates to verify-email on success", async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient).mockResolvedValue({ success: true });

    renderSignup();

    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "t@t.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/verify-email-link", expect.any(Object));
    });
  });

  it("shows error toast on signup failure", async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient).mockRejectedValue({ message: "Email already exists" });

    renderSignup();

    await user.type(screen.getByLabelText(/full name/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "t@t.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Email already exists");
    });
  });
});
