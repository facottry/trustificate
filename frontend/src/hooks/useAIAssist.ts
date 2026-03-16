import { useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";

interface AISuggestions {
  [key: string]: any;
}

export function useAIAssist() {
  const [loading, setLoading] = useState(false);

  const callAI = async (type: string, context: any): Promise<AISuggestions | null> => {
    setLoading(true);
    try {
      const { data } = await apiClient<{ suggestions: AISuggestions }>('/api/ai/assist', {
        method: 'POST',
        body: JSON.stringify({ type, context }),
      });
      return data?.suggestions || null;
    } catch (e: any) {
      toast.error(e.message || 'AI suggestion failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getDocumentSuggestions = async (context: {
    templateTitle: string;
    templatePrefix: string;
    recipientName?: string;
    courseName?: string;
    companyName?: string;
    placeholders?: string[];
  }): Promise<AISuggestions | null> => callAI('document-fill', context);

  const getTemplateSuggestions = async (context: {
    title?: string;
    subtitle?: string;
    bodyText?: string;
    layout?: string;
    numberPrefix?: string;
  }): Promise<AISuggestions | null> => callAI('template-assist', context);

  return { loading, getDocumentSuggestions, getTemplateSuggestions };
}
