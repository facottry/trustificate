import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
      const { data, error } = await supabase.rpc("get_platform_stats" as any);
      if (!error && data) {
        const d = data as any;
        setStats({
          credentialsIssued: d.credentials_issued ?? 0,
          organizations: d.organizations ?? 0,
          verifications: d.verifications ?? 0,
          templates: d.templates ?? 0,
          loading: false,
        });
      } else {
        setStats((s) => ({ ...s, loading: false }));
      }
    }
    fetchStats();
  }, []);

  return stats;
}
