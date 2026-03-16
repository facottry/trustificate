import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Building2, Award, CreditCard, TrendingUp,
  ShieldCheck, ShieldX, FileText, Eye, Package, Tag, BarChart3
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentCerts, setRecentCerts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [planDist, setPlanDist] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const [statsRes, certsRes, ordersRes, planRes] = await Promise.all([
        supabase.rpc("get_admin_stats"),
        supabase
          .from("certificates")
          .select("id, certificate_number, recipient_name, status, created_at, organizations(name)")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("orders" as any)
          .select("id, plan_name, final_amount, coupon_code, status, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase.from("subscriptions").select("plans(name)").eq("status", "active"),
      ]);

      setStats(statsRes.data);
      setRecentCerts(certsRes.data || []);
      setRecentOrders((ordersRes as any).data || []);

      const dist: Record<string, number> = {};
      ((planRes.data || []) as any[]).forEach((s: any) => {
        const name = s.plans?.name || "Unknown";
        dist[name] = (dist[name] || 0) + 1;
      });
      setPlanDist(Object.entries(dist).map(([name, value]) => ({ name, value })));
      setLoading(false);
    }
    load();
  }, []);

  const kpis = stats
    ? [
        { label: "Total Users", value: stats.total_users, icon: Users, color: "text-blue-500" },
        { label: "Organizations", value: stats.total_organizations, icon: Building2, color: "text-indigo-500" },
        { label: "Active Subs", value: stats.active_subscriptions, icon: Package, color: "text-green-500" },
        { label: "MRR", value: `₹${Number(stats.mrr).toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-emerald-500" },
        { label: "Total Revenue", value: `₹${Number(stats.total_revenue).toLocaleString("en-IN")}`, icon: CreditCard, color: "text-yellow-500" },
        { label: "Certificates", value: stats.total_certificates, icon: Award, color: "text-purple-500" },
        { label: "Active Certs", value: stats.active_certificates, icon: ShieldCheck, color: "text-green-600" },
        { label: "Revoked", value: stats.revoked_certificates, icon: ShieldX, color: "text-red-500" },
        { label: "Templates", value: stats.total_templates, icon: FileText, color: "text-orange-500" },
        { label: "Verifications", value: stats.total_verifications, icon: Eye, color: "text-cyan-500" },
        { label: "Free / Paid", value: `${stats.free_orgs} / ${stats.paid_orgs}`, icon: BarChart3, color: "text-pink-500" },
        { label: "Certs This Month", value: stats.certs_this_month, icon: Tag, color: "text-teal-500" },
      ]
    : [];

  const COLORS = ["hsl(142, 71%, 45%)", "hsl(217, 91%, 60%)", "hsl(280, 65%, 60%)", "hsl(25, 95%, 53%)"];

  return (
    <SuperAdminLayout title="Dashboard" subtitle="Platform-wide overview and metrics">
      <div className="space-y-6">
        {/* KPI Grid */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-4 pb-3">
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))
            : kpis.map((kpi) => (
                <Card key={kpi.label} className="hover:shadow-sm transition-shadow">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-tight">
                        {kpi.label}
                      </p>
                      <kpi.icon className={cn("h-3.5 w-3.5", kpi.color)} />
                    </div>
                    <p className="text-lg font-bold">{kpi.value}</p>
                  </CardContent>
                </Card>
              ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Plan Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Plan Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : planDist.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No data</p>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planDist}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {planDist.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Certificates */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recent Certificates</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Certificate #</TableHead>
                        <TableHead className="text-xs">Recipient</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">Issuer</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentCerts.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-mono text-xs">
                            {c.certificate_number?.slice(0, 18)}
                          </TableCell>
                          <TableCell className="text-xs">{c.recipient_name}</TableCell>
                          <TableCell className="text-xs hidden sm:table-cell text-muted-foreground">
                            {c.organizations?.name || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={c.status === "issued" ? "default" : "destructive"}
                              className="text-[10px]"
                            >
                              {c.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No orders yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Order ID</TableHead>
                      <TableHead className="text-xs">Plan</TableHead>
                      <TableHead className="text-xs">Amount</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Coupon</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((o: any) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs">
                          {o.id?.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{o.plan_name}</TableCell>
                        <TableCell className="text-xs">
                          ₹{o.final_amount?.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-xs hidden sm:table-cell">
                          {o.coupon_code ? (
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {o.coupon_code}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={o.status === "completed" ? "default" : "secondary"}
                            className="text-[10px]"
                          >
                            {o.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                          {new Date(o.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
