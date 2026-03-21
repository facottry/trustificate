import { apiClient, type ApiResponse } from '@/lib/apiClient';

export interface Newsletter {
  _id: string;
  subject: string;
  body: string;
  sentBy: { _id: string; displayName: string; email: string };
  sentAt: string;
  recipientCount: number;
}

export function polishDraft(draft: string): Promise<ApiResponse<{ polishedText: string }>> {
  return apiClient<{ polishedText: string }>('/api/newsletter/polish', {
    method: 'POST',
    body: JSON.stringify({ draft }),
  });
}

export function sendNewsletter(subject: string, body: string): Promise<ApiResponse<void>> {
  return apiClient<void>('/api/newsletter/send', {
    method: 'POST',
    body: JSON.stringify({ subject, body }),
  });
}

export function fetchNewsletterHistory(): Promise<ApiResponse<Newsletter[]>> {
  return apiClient<Newsletter[]>('/api/newsletter/history');
}
