import { useQuery } from "@tanstack/react-query";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/apiClient";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Users, Building2, FileCheck2, LayoutTemplate,
  TrendingUp, IndianRupee, ShieldX, CalendarDays,
} from "lucide-react";

const PLAN_COLORS: Record<string, string> = {
  free: "#94a3b8",
  starter: "#60a5fa",
  pro: "#a78bfa",
  enterprise: "#34d399",
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function SuperAdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["sa-stats"],
    queryFn: () => apiClient<any>("/api/admin/super/stats").then((r) => r.data),
  });

  const { data: recentCerts = [], isLoading: certsLoading } = useQuery({
    queryKey: ["sa-certs-recent"],
    queryFn: () =>
      apiClient<any[]>("/api/admin/super/certificates").then((r) =>
        (r.data ?? []).slice(0, 8)
      ),
  });

  return (
    <SuperAdminLayout title="Dashboard" subtitle="Platform overview">
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <Skeleton className="h-14 w-full" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatCard icon={Users} label="Total Users" value={(stats?.total_users ?? 0).toLocaleString()} />
              <StatCard icon={Building2} label="Organizations" value={(stats?.total_organizations ?? 0).toLocaleString()} sub={`${stats?.paid_orgs ?? 0} paid · ${stats?.free_orgs ?? 0} free`} />
              <StatCard icon={FileCheck2} label="Certificates" value={(stats?.total_certificates ?? 0).toLocaleString()} sub={`${stats?.active_certificates ?? 0} active`} />
              <StatCard icon={ShieldX} label="Revoked" value={(stats?.revoked_certificates ?? 0).toLocaleString()} />
              <StatCard icon={LayoutTemplate} label="Templates" value={(stats?.total_templates ?? 0).toLocaleString()} />
              <StatCard icon={CalendarDays} label="Certs This Month" value={(stats?.certs_this_month ?? 0).toLocaleString()} />
              <StatCard icon={IndianRupee} label="Total Revenue" value={`Rs.${(stats?.total_revenue ?? 0).toLocaleString("en-IN")}`} />
              <StatCard icon={TrendingUp} label="Paid Orgs" value={(stats?.active_subscriptions ?? 0).toLocaleString()} />
            </>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium mb-4">Plan Distribution</p>
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={stats?.plan_distribution ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2}>
                        {(stats?.plan_distribution ?? []).map((entry: any) => (
                          <Cell key={entry.name} fill={PLAN_COLORS[entry.name] ?? "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any, n: any) => [v, n]} contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 flex-1">
                    {(stats?.plan_distribution ?? []).map((entry: any) => (
                      <div key={entry.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: PLAN_COLORS[entry.name] ?? "#94a3b8" }} />
                          <span className="capitalize text-muted-foreground">{entry.name}</span>
                        </div>
                        <span className="font-semibold">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <p className="text-xs font-medium mb-4">Recent Certificates</p>
              {certsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : recentCerts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No certificates yet</p>
              ) : (
                <div className="space-y-2">
                  {recentCerts.map((c: any) => (
                    <div key={String(c.id)} className="flex items-center justify-between py-1 border-b last:border-0">
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{c.recipient_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{c.org_name ?? "No org"}</p>
                      </div>
                      <Badge variant={c.status === "issued" ? "default" : "destructive"} className="text-[10px] ml-2 shrink-0">
                        {c.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
}