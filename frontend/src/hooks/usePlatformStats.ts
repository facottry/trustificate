import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import { PLATFORM_STATS } from "@/data/platformStats";

interface PlatformStats {
  credentialsIssued: number;
  organizations: number;
  verifications: number;
  templates: number;
  loading: boolean;
}

// SEO-friendly fallback values from the central PLATFORM_STATS enum
const FALLBACK_STATS: Omit<PlatformStats, "loading"> = {
  credentialsIssued: PLATFORM_STATS.CERTIFICATES_ISSUED,
  organizations: PLATFORM_STATS.ORGANIZATIONS,
  verifications: PLATFORM_STATS.VERIFICATIONS,
  templates: PLATFORM_STATS.TEMPLATES,
};

export function usePlatformStats(): PlatformStats {
  const [stats, setStats] = useState<PlatformStats>({
    ...FALLBACK_STATS,
    loading: true,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data } = await apiClient<any>("/api/public/platform-stats");
        if (data) {
          setStats({
            credentialsIssued: data.credentialsIssued ?? data.credentials_issued ?? FALLBACK_STATS.credentialsIssued,
            organizations: data.organizations ?? FALLBACK_STATS.organizations,
            verifications: data.verifications ?? FALLBACK_STATS.verifications,
            templates: data.templates ?? FALLBACK_STATS.templates,
            loading: false,
          });
        } else {
          setStats((s) => ({ ...s, loading: false }));
        }
      } catch {
        // Graceful fallback — show hardcoded SEO values
        setStats({ ...FALLBACK_STATS, loading: false });
      }
    }
    fetchStats();
  }, []);

  return stats;
}
