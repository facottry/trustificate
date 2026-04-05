import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotFound from "../NotFound";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, loading: false, refresh: vi.fn(), signOut: vi.fn() }),
}));

vi.mock("@/assets/mascot-idle.png", () => ({ default: "" }));
vi.mock("@/assets/mascot-working.png", () => ({ default: "" }));
vi.mock("@/assets/mascot-success.png", () => ({ default: "" }));
vi.mock("@/assets/mascot-error.png", () => ({ default: "" }));
vi.mock("@/assets/mascot-verified.png", () => ({ default: "" }));
vi.mock("@/assets/mascot-search.png", () => ({ default: "" }));
vi.mock("@/assets/mascot.png", () => ({ default: "" }));

describe("NotFound page", () => {
  it("renders 404 heading", () => {
    render(
      <MemoryRouter initialEntries={["/nonexistent"]}>
        <NotFound />
      </MemoryRouter>
    );
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });

  it("shows the attempted path", () => {
    render(
      <MemoryRouter initialEntries={["/nonexistent"]}>
        <NotFound />
      </MemoryRouter>
    );
    expect(screen.getByText("/nonexistent")).toBeInTheDocument();
  });

  it("has Home and Verify links", () => {
    render(
      <MemoryRouter initialEntries={["/nonexistent"]}>
        <NotFound />
      </MemoryRouter>
    );
    expect(screen.getByText(/home/i)).toBeInTheDocument();
    expect(screen.getByText(/verify a document/i)).toBeInTheDocument();
  });
});
