import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NavLink } from "../NavLink";

describe("NavLink", () => {
  it("renders a link with correct text and href", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <NavLink to="/about" className="base">About</NavLink>
      </MemoryRouter>
    );
    const link = screen.getByText("About");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/about");
  });

  it("applies activeClassName when route matches", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <NavLink to="/about" className="base" activeClassName="active">About</NavLink>
      </MemoryRouter>
    );
    const link = screen.getByText("About");
    expect(link.className).toContain("active");
  });

  it("does not apply activeClassName when route does not match", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <NavLink to="/about" className="base" activeClassName="active">About</NavLink>
      </MemoryRouter>
    );
    const link = screen.getByText("About");
    expect(link.className).not.toContain("active");
  });
});
