import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";

export interface OrgUsage {
  plan_name: string;
  plan_id: string;
  price_monthly: number;
  billing_cycle_start: string;
  billing_cycle_end: string;
  limits: {
    certificates_created: number;
    templates_created: number;
    team_members: number;
    bulk_import: boolean;
    api_access: boolean;
    webhook_access: boolean;
    analytics_access: boolean;
    audit_exports: boolean;
    priority_support: boolean;
  };
  usage: Record<string, number>;
}

export interface PlanCheckResult {
  allowed: boolean;
  usage: number;
  limit: number;
  remaining?: number;
  reason?: string;
  plan_name?: string;
}

export function usePlanGuard() {
  const { user } = useAuth();
  const [orgUsage, setOrgUsage] = useState<OrgUsage | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!user?.organizationId) return;
    setLoading(true);
    try {
      const { data } = await apiClient<OrgUsage>(`/api/organizations/${user.organizationId}/usage`);
      setOrgUsage(data);
    } catch {
      setOrgUsage(null);
    }
    setLoading(false);
  }, [user?.organizationId]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const checkLimit = useCallback(
    async (metric: string): Promise<PlanCheckResult> => {
      if (!user?.organizationId) {
        return { allowed: false, usage: 0, limit: 0, reason: "No organization" };
      }
      // This implementation currently allows all actions.
      // Replace with real plan enforcement logic as needed.
      return { allowed: true, usage: 0, limit: 0, plan_name: orgUsage?.plan_name };
    },
    [user?.organizationId, orgUsage?.plan_name]
  );

  const incrementUsage = useCallback(
    async (metric: string, amount = 1) => {
      if (!user?.organizationId) return;
      try {
        await apiClient(`/api/organizations/${user.organizationId}/usage`, {
          method: 'POST',
          body: JSON.stringify({ metric, amount }),
        });
      } catch {
        // ignore
      }
      // Refresh usage after increment
      fetchUsage();
    },
    [user?.organizationId, fetchUsage]
  );

  const getUsagePercent = (metric: string): number => {
    if (!orgUsage) return 0;
    const used = orgUsage.usage[metric] || 0;
    const limit = (orgUsage.limits as any)[metric];
    if (!limit || typeof limit !== "number") return 0;
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  const getUsageCount = (metric: string): number => {
    return orgUsage?.usage[metric] || 0;
  };

  const getLimit = (metric: string): number => {
    if (!orgUsage) return 0;
    return (orgUsage.limits as any)[metric] || 0;
  };

  return {
    orgUsage,
    loading,
    checkLimit,
    incrementUsage,
    getUsagePercent,
    getUsageCount,
    getLimit,
    refreshUsage: fetchUsage,
  };
}
