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
    if (!user?.organizationId) {
      setLoading(false);
      return;
    }
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
      const orgId = user?.organizationId;
      if (!orgId) {
        return { allowed: false, usage: 0, limit: 0, reason: "No organization" };
      }

      // Use cached orgUsage or fetch fresh data
      let data = orgUsage;
      if (!data) {
        try {
          const res = await apiClient<OrgUsage>(`/api/organizations/${orgId}/usage`);
          data = res.data ?? null;
        } catch {
          return { allowed: false, usage: 0, limit: 0, reason: "Failed to fetch usage" };
        }
      }

      if (!data) {
        return { allowed: false, usage: 0, limit: 0, reason: "No usage data" };
      }

      const limit = (data.limits as any)[metric];
      const current = data.usage[metric] || 0;
      const plan_name = data.plan_name;

      // Feature flag (boolean), not a numeric limit
      if (typeof limit !== "number") {
        return { allowed: true, usage: 0, limit: 0, plan_name };
      }

      // Unlimited plan
      if (limit === -1) {
        return { allowed: true, usage: current, limit: -1, remaining: -1, plan_name };
      }

      // Over limit
      if (current >= limit) {
        return { allowed: false, usage: current, limit, remaining: 0, reason: "Plan limit reached", plan_name };
      }

      // Under limit
      return { allowed: true, usage: current, limit, remaining: limit - current, plan_name };
    },
    [user?.organizationId, orgUsage]
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
