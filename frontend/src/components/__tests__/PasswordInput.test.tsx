import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordInput } from "../PasswordInput";

// We need user-event — check if it's installed, otherwise use fireEvent
describe("PasswordInput", () => {
  it("renders as password type by default", () => {
    render(<PasswordInput placeholder="Enter password" />);
    const input = screen.getByPlaceholderText("Enter password");
    expect(input).toHaveAttribute("type", "password");
  });

  it("toggles to text type when eye button is clicked", async () => {
    render(<PasswordInput placeholder="Enter password" />);
    const input = screen.getByPlaceholderText("Enter password");
    const toggleBtn = screen.getByRole("button");

    await userEvent.click(toggleBtn);
    expect(input).toHaveAttribute("type", "text");

    await userEvent.click(toggleBtn);
    expect(input).toHaveAttribute("type", "password");
  });

  it("applies custom className", () => {
    render(<PasswordInput placeholder="pw" className="my-class" />);
    const input = screen.getByPlaceholderText("pw");
    expect(input.className).toContain("my-class");
  });

  it("forwards other input props", () => {
    render(<PasswordInput placeholder="pw" required minLength={6} id="test-pw" />);
    const input = screen.getByPlaceholderText("pw");
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("minLength", "6");
    expect(input).toHaveAttribute("id", "test-pw");
  });
});
