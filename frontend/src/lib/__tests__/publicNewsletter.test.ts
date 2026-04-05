import { describe, it, expect, vi, afterEach } from "vitest";
import { subscribeToNewsletter, fetchPublicNewsletters, fetchPublicNewsletterBySlug } from "../publicNewsletter";

vi.mock("@/lib/apiClient", () => ({
  apiClient: vi.fn(),
}));

import { apiClient } from "@/lib/apiClient";
const mockApiClient = vi.mocked(apiClient);

describe("publicNewsletter lib", () => {
  afterEach(() => vi.clearAllMocks());

  it("subscribeToNewsletter sends email", async () => {
    mockApiClient.mockResolvedValue({ success: true });
    await subscribeToNewsletter("test@example.com");
    expect(mockApiClient).toHaveBeenCalledWith("/api/public/newsletter/subscribe", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com" }),
    });
  });

  it("fetchPublicNewsletters calls list endpoint", async () => {
    mockApiClient.mockResolvedValue({ success: true, data: [] });
    await fetchPublicNewsletters();
    expect(mockApiClient).toHaveBeenCalledWith("/api/public/newsletter");
  });

  it("fetchPublicNewsletterBySlug calls slug endpoint", async () => {
    mockApiClient.mockResolvedValue({ success: true, data: { _id: "1", subject: "Test" } });
    await fetchPublicNewsletterBySlug("my-slug");
    expect(mockApiClient).toHaveBeenCalledWith("/api/public/newsletter/my-slug");
  });
});
