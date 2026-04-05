import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UsageBanner } from "../UsageBanner";

function renderBanner(props: { metric: string; usage: number; limit: number; planName?: string }) {
  return render(
    <MemoryRouter>
      <UsageBanner {...props} />
    </MemoryRouter>
  );
}

describe("UsageBanner", () => {
  it("renders nothing when usage is below 80%", () => {
    const { container } = renderBanner({ metric: "certificates_created", usage: 5, limit: 100 });
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing for unlimited plans (limit <= 0)", () => {
    const { container } = renderBanner({ metric: "certificates_created", usage: 100, limit: -1 });
    expect(container.innerHTML).toBe("");
  });

  it("shows warning when usage is between 80-99%", () => {
    renderBanner({ metric: "certificates_created", usage: 85, limit: 100 });
    expect(screen.getByText(/You've used 85 of 100/)).toBeInTheDocument();
  });

  it("shows upgrade alert when at 100%", () => {
    renderBanner({ metric: "certificates_created", usage: 100, limit: 100, planName: "free" });
    expect(screen.getByText(/reached your certificates created limit/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upgrade/i })).toBeInTheDocument();
  });

  it("formats metric name with spaces", () => {
    renderBanner({ metric: "team_members", usage: 9, limit: 10 });
    expect(screen.getByText(/team members/)).toBeInTheDocument();
  });
});
