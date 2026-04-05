import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo, LogoIcon } from "../Logo";

describe("LogoIcon", () => {
  it("renders an SVG element", () => {
    const { container } = render(<LogoIcon />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<LogoIcon className="custom-class" />);
    expect(container.querySelector("svg")).toHaveClass("custom-class");
  });

  it("has aria-hidden for accessibility", () => {
    const { container } = render(<LogoIcon />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Logo", () => {
  it("renders icon and text by default", () => {
    const { container } = render(<Logo />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("TRUSTIFICATE")).toBeInTheDocument();
  });

  it("renders only icon when variant is icon", () => {
    const { container } = render(<Logo variant="icon" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.queryByText("TRUSTIFICATE")).not.toBeInTheDocument();
  });

  it("renders only text when variant is text", () => {
    const { container } = render(<Logo variant="text" />);
    expect(container.querySelector("svg")).not.toBeInTheDocument();
    expect(screen.getByText("TRUSTIFICATE")).toBeInTheDocument();
  });

  it("hides text when showText is false", () => {
    render(<Logo showText={false} />);
    expect(screen.queryByText("TRUSTIFICATE")).not.toBeInTheDocument();
  });

  it("applies size classes", () => {
    const { container } = render(<Logo size="xl" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("h-16", "w-16");
  });
});
