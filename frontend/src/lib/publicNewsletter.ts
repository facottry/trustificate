import { apiClient, type ApiResponse } from '@/lib/apiClient';

export interface PublicNewsletter {
  _id: string;
  subject: string;
  body: string;
  slug: string;
  sentAt: string;
  recipientCount: number;
}

export function subscribeToNewsletter(email: string): Promise<ApiResponse<null>> {
  return apiClient<null>('/api/public/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function fetchPublicNewsletters(): Promise<ApiResponse<PublicNewsletter[]>> {
  return apiClient<PublicNewsletter[]>('/api/public/newsletter');
}

export function fetchPublicNewsletterBySlug(slug: string): Promise<ApiResponse<PublicNewsletter>> {
  return apiClient<PublicNewsletter>(`/api/public/newsletter/${slug}`);
}
