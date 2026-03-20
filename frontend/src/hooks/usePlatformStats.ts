import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";

interface PlatformStats {
  credentialsIssued: number;
  organizations: number;
  verifications: number;
  templates: number;
  loading: boolean;
}

export function usePlatformStats(): PlatformStats {
  const [stats, setStats] = useState<PlatformStats>({
    credentialsIssued: 0,
    organizations: 0,
    verifications: 0,
    templates: 0,
    loading: true,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data } = await apiClient<any>("/api/admin/platform-stats");
        if (data) {
          setStats({
            credentialsIssued: data.credentialsIssued ?? data.credentials_issued ?? 0,
            organizations: data.organizations ?? 0,
            verifications: data.verifications ?? 0,
            templates: data.templates ?? 0,
            loading: false,
          });
        } else {
          setStats((s) => ({ ...s, loading: false }));
        }
      } catch {
        // Graceful fallback
        setStats((s) => ({ ...s, loading: false }));
      }
    }
    fetchStats();
  }, []);

  return stats;
}
