import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/apiClient";
import { Check, X } from "lucide-react";

export default function SuperAdminPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient("/api/admin/super/plans")
      .then((res) => setPlans((res.data as any[]) || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const features = [
    { key: "api_access", label: "API Access" },
    { key: "bulk_import", label: "Bulk Import" },
    { key: "webhook_access", label: "Webhooks" },
    { key: "analytics_access", label: "Analytics" },
    { key: "audit_exports", label: "Audit Exports" },
    { key: "priority_support", label: "Priority Support" },
  ];

  return (
    <SuperAdminLayout title="Plans" subtitle="Subscription plan configuration (read-only)">
      <div className="space-y-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-4"><Skeleton className="h-48 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="relative">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base capitalize">{plan.name}</CardTitle>
                  <p className="text-2xl font-bold">
                    {plan.price_monthly === 0
                      ? "Free"
                      : `₹${plan.price_monthly.toLocaleString("en-IN")}`}
                    {plan.price_monthly > 0 && (
                      <span className="text-xs text-muted-foreground font-normal">/mo</span>
                    )}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Certificates/mo</span>
                    <span className="font-medium">
                      {plan.max_certificates_per_month >= 10000
                        ? "10,000+"
                        : plan.max_certificates_per_month.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Templates</span>
                    <span className="font-medium">
                      {plan.max_templates >= 10000 ? "10,000+" : plan.max_templates}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Team Members</span>
                    <span className="font-medium">
                      {plan.team_members >= 10000 ? "10,000+" : plan.team_members}
                    </span>
                  </div>
                  <div className="pt-2 space-y-1.5 border-t">
                    {features.map((f) => (
                      <div key={f.key} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{f.label}</span>
                        {plan[f.key]
                          ? <Check className="h-3 w-3 text-green-500" />
                          : <X className="h-3 w-3 text-muted-foreground/40" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground text-center">
          Plans are defined in <code className="font-mono bg-muted px-1 rounded">planConfig.js</code> and require a code deployment to change.
        </p>
      </div>
    </SuperAdminLayout>
  );
}
