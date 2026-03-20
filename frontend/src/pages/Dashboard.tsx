import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Mascot, MascotTipWidget } from "@/components/Mascot";
import { Award, ShieldCheck, ShieldX, Globe, Plus, Zap } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { usePlanGuard } from "@/hooks/usePlanGuard";
import { UsageBanner } from "@/components/UsageBanner";
import { UpgradeModal } from "@/components/UpgradeModal";

export default function DashboardPage() {
  const { profile } = useAuth();
  const { orgUsage, loading: usageLoading, getUsagePercent, getUsageCount, getLimit } = usePlanGuard();
  const [stats, setStats] = useState({
    totalDocs: 0,
    activeDocs: 0,
    revokedDocs: 0,
    externalDocs: 0,
  });
  const [recentCerts, setRecentCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    if (profile === undefined) return;
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }
    const orgId = profile.organization_id;

    async function fetchData() {
      try {
        const [allRes, recentRes] = await Promise.all([
          apiClient<any[]>('/api/certificates').catch(() => ({ data: [] })),
          apiClient<any[]>('/api/certificates?limit=8&sort=-createdAt').catch(() => ({ data: [] })),
        ]);

        const all = (allRes as any).data || [];
        setStats({
          totalDocs: all.length,
          activeDocs: all.filter((c: any) => c.status === "issued").length,
          revokedDocs: all.filter((c: any) => c.status === "revoked").length,
          externalDocs: all.filter((c: any) => c.isExternal).length,
        });
        setRecentCerts((recentRes as any).data || []);
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [profile]);

  const metrics = [
    { title: "Total Documents", value: stats.totalDocs, icon: Award },
    { title: "Active Verified", value: stats.activeDocs, icon: ShieldCheck },
    { title: "Revoked", value: stats.revokedDocs, icon: ShieldX },
    { title: "External Registered", value: stats.externalDocs, icon: Globe },
  ];

  const certPercent = getUsagePercent("certificates_created");
  const templatePercent = getUsagePercent("templates_created");

  const usageMetrics = [
    {
      label: "Certificates",
      metric: "certificates_created",
      used: getUsageCount("certificates_created"),
      limit: getLimit("certificates_created"),
      percent: certPercent,
    },
    {
      label: "Templates",
      metric: "templates_created",
      used: getUsageCount("templates_created"),
      limit: getLimit("templates_created"),
      percent: templatePercent,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Document issuance & verification overview
            </p>
          </div>
          <div className="flex gap-2 items-center">
            {orgUsage && (
              <Badge variant="outline" className="text-xs font-normal gap-1">
                <Zap className="h-3 w-3" />
                {orgUsage.plan_name} Plan
              </Badge>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link to="/registry/external/new">
                <Globe className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Register External</span>
                <span className="sm:hidden">External</span>
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/documents/new">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Issue Document</span>
                <span className="sm:hidden">Issue</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Usage Warning — show the most urgent banner across both metrics */}
        {orgUsage && (() => {
          const metrics = [
            { metric: "certificates_created", usage: getUsageCount("certificates_created"), limit: getLimit("certificates_created") },
            { metric: "templates_created", usage: getUsageCount("templates_created"), limit: getLimit("templates_created") },
          ];

          // Filter out unlimited (-1) and zero limits, compute percent
          const candidates = metrics
            .filter((m) => m.limit > 0)
            .map((m) => ({ ...m, percent: Math.round((m.usage / m.limit) * 100) }))
            .filter((m) => m.percent >= 80);

          if (candidates.length === 0) return null;

          // Pick the most urgent (highest percent; ties broken by first)
          const mostUrgent = candidates.reduce((a, b) => (b.percent > a.percent ? b : a));

          return (
            <UsageBanner
              metric={mostUrgent.metric}
              usage={mostUrgent.usage}
              limit={mostUrgent.limit}
              planName={orgUsage.plan_name}
            />
          );
        })()}

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <Card key={m.title}>
              <CardContent className="pt-5 pb-4">
                {loading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{m.title}</p>
                      <p className="text-2xl font-semibold mt-1">{m.value}</p>
                    </div>
                    <m.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Plan Usage */}
        {!usageLoading && orgUsage && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-medium">Plan Usage</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {orgUsage.plan_name} plan — billing cycle ends{" "}
                  {new Date(orgUsage.billing_cycle_end).toLocaleDateString()}
                </p>
              </div>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setUpgradeOpen(true)}>
                <Zap className="mr-1 h-3 w-3" />
                Upgrade
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {usageMetrics.map((u) => (
                  <div key={u.metric} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{u.label}</span>
                      <span className="font-medium">
                        {u.used} / {u.limit}
                      </span>
                    </div>
                    <Progress
                      value={u.percent}
                      className={`h-2 ${u.percent >= 100 ? "[&>div]:bg-destructive" : u.percent >= 80 ? "[&>div]:bg-yellow-500" : ""}`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Recently issued documents</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link to="/registry">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recentCerts.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Mascot mood="empty" size="lg" message="No documents yet. Let's create your first!" />
                <div className="flex gap-2 mt-2">
                  <Button size="sm" asChild>
                    <Link to="/documents/new">Issue your first document</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/welcome">View setup guide</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Certificate #</TableHead>
                      <TableHead className="text-xs">Recipient</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Type</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentCerts.map((cert) => (
                      <TableRow key={cert._id || cert.id}>
                        <TableCell>
                          <Link
                            to={cert.isExternal ? `/registry/${cert._id || cert.id}` : `/documents/${cert._id || cert.id}`}
                            className="font-mono text-xs text-primary hover:underline"
                          >
                            {cert.certificateNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">{cert.recipientName}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {cert.isExternal ? (
                            <span className="text-xs text-muted-foreground">External</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {cert.templateId?.title || "\u2014"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={cert.status === "issued" ? "default" : "destructive"}
                            className="text-[10px] font-medium"
                          >
                            {cert.status === "issued" ? "Verified" : "Revoked"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                          {new Date(cert.issueDate).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mascot Tips */}
        <MascotTipWidget />
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        currentPlan={orgUsage?.plan_name}
        metric="certificates_created"
        usage={getUsageCount("certificates_created")}
        limit={getLimit("certificates_created")}
      />
    </AdminLayout>
  );
}
