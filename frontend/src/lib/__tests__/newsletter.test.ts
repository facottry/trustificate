import { describe, it, expect, vi, afterEach } from "vitest";
import { polishDraft, sendNewsletter, fetchNewsletterHistory } from "../newsletter";

// Mock apiClient
vi.mock("@/lib/apiClient", () => ({
  apiClient: vi.fn(),
}));

import { apiClient } from "@/lib/apiClient";
const mockApiClient = vi.mocked(apiClient);

describe("newsletter lib", () => {
  afterEach(() => vi.clearAllMocks());

  it("polishDraft calls correct endpoint with draft text", async () => {
    mockApiClient.mockResolvedValue({ success: true, data: { polishedText: "polished" } });
    await polishDraft("rough draft");
    expect(mockApiClient).toHaveBeenCalledWith("/api/newsletter/polish", {
      method: "POST",
      body: JSON.stringify({ draft: "rough draft" }),
    });
  });

  it("sendNewsletter calls correct endpoint", async () => {
    mockApiClient.mockResolvedValue({ success: true });
    await sendNewsletter("Subject", "<p>Body</p>");
    expect(mockApiClient).toHaveBeenCalledWith("/api/newsletter/send", {
      method: "POST",
      body: JSON.stringify({ subject: "Subject", body: "<p>Body</p>" }),
    });
  });

  it("fetchNewsletterHistory calls correct endpoint", async () => {
    mockApiClient.mockResolvedValue({ success: true, data: [] });
    await fetchNewsletterHistory();
    expect(mockApiClient).toHaveBeenCalledWith("/api/newsletter/history");
  });
});
