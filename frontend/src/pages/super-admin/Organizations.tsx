import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiClient } from "@/lib/apiClient";
import { Search, MoreHorizontal, Download } from "lucide-react";
import { toast } from "sonner";

const PLAN_COLORS: Record<string, "default" | "secondary" | "outline"> = {
  free: "secondary", starter: "outline", pro: "default", enterprise: "default",
};

export default function SuperAdminOrganizations() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["sa-orgs"],
    queryFn: () => apiClient<any[]>("/api/admin/super/organizations").then((r) => r.data ?? []),
  });

  const filtered = orgs.filter((o: any) => {
    const q = search.toLowerCase();
    return !q || o.name?.toLowerCase().includes(q) || o.slug?.toLowerCase().includes(q) || o.plan?.toLowerCase().includes(q);
  });

  async function handlePlanChange(orgId: string, orgName: string, plan: string) {
    try {
      await apiClient(`/api/admin/super/organizations/${orgId}/plan`, { method: "PATCH", body: JSON.stringify({ plan }) });
      toast.success(`${orgName} changed to ${plan}`);
      qc.invalidateQueries({ queryKey: ["sa-orgs"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to change plan");
    }
  }

  function exportCSV() {
    const rows = filtered.map((o: any) => ({
      name: o.name, slug: o.slug, plan: o.plan,
      billing_start: o.billing_cycle_start || "",
      billing_end: o.billing_cycle_end || "",
      created: o.created_at || "",
    }));
    const header = Object.keys(rows[0] || {}).join(",");
    const csv = [header, ...rows.map((r: any) => Object.values(r).map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "organizations-export.csv";
    a.click();
  }

  return (
    <SuperAdminLayout
      title="Organizations"
      subtitle={`${orgs.length} total organizations`}
      actions={
        <Button variant="outline" size="sm" className="text-xs" onClick={exportCSV}>
          <Download className="mr-1 h-3.5 w-3.5" /> Export CSV
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search organizations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No organizations found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Organization</TableHead>
                      <TableHead className="text-xs">Slug</TableHead>
                      <TableHead className="text-xs">Plan</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">Billing Cycle</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Created</TableHead>
                      <TableHead className="text-xs w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((o: any) => (
                      <TableRow key={String(o.id)}>
                        <TableCell className="text-sm font-medium">{o.name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{o.slug}</TableCell>
                        <TableCell>
                          <Badge variant={PLAN_COLORS[o.plan] ?? "secondary"} className="text-[10px] capitalize">{o.plan}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                          {o.billing_cycle_start ? new Date(o.billing_cycle_start).toLocaleDateString() : "—"}
                          {" — "}
                          {o.billing_cycle_end ? new Date(o.billing_cycle_end).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                          {o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {["free", "starter", "pro", "enterprise"].map((p) => (
                                <DropdownMenuItem key={p} onClick={() => handlePlanChange(String(o.id), o.name, p)}>
                                  Set {p.charAt(0).toUpperCase() + p.slice(1)}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
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
