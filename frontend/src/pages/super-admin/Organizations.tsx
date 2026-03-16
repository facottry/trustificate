import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { Search, MoreHorizontal, Download } from "lucide-react";
import { toast } from "sonner";

export default function SuperAdminOrganizations() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadOrgs() {
    const { data } = await supabase
      .from("subscriptions")
      .select("*, organizations(id, name, slug, created_at), plans(name, price_monthly, max_certificates_per_month)")
      .order("created_at", { ascending: false });
    setOrgs(data || []);
    setLoading(false);
  }

  useEffect(() => { loadOrgs(); }, []);

  const filtered = orgs.filter((o) => {
    const q = search.toLowerCase();
    return !q || o.organizations?.name?.toLowerCase().includes(q) || o.plans?.name?.toLowerCase().includes(q);
  });

  async function handlePlanChange(subId: string, orgName: string, planName: string) {
    const { data: plan } = await supabase.from("plans").select("id").eq("name", planName).single();
    if (!plan) { toast.error("Plan not found"); return; }
    const { error } = await supabase.from("subscriptions").update({ plan_id: plan.id }).eq("id", subId);
    if (error) { toast.error(error.message); return; }
    toast.success(`${orgName} changed to ${planName}`);
    await supabase.rpc("log_admin_action", {
      _action: "plan_change",
      _target_type: "organization",
      _target_id: subId,
      _details: `Changed to ${planName}`,
    });
    loadOrgs();
  }

  async function handleStatusChange(subId: string, status: string) {
    const { error } = await supabase.from("subscriptions").update({ status }).eq("id", subId);
    if (error) { toast.error(error.message); return; }
    toast.success(`Subscription ${status}`);
    await supabase.rpc("log_admin_action", {
      _action: "subscription_status_change",
      _target_type: "subscription",
      _target_id: subId,
      _details: `Status changed to ${status}`,
    });
    loadOrgs();
  }

  function exportCSV() {
    const rows = filtered.map((o) => ({
      organization: o.organizations?.name || "",
      plan: o.plans?.name || "",
      price: o.plans?.price_monthly || 0,
      status: o.status || "",
      billing_start: o.billing_cycle_start || "",
      billing_end: o.billing_cycle_end || "",
      created: o.organizations?.created_at || "",
    }));
    const header = Object.keys(rows[0] || {}).join(",");
    const csv = [header, ...rows.map((r) => Object.values(r).map(v => `"${v}"`).join(","))].join("\n");
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
            {loading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No organizations found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Organization</TableHead>
                      <TableHead className="text-xs">Plan</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Price</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Status</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">Cert Limit</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">Billing Cycle</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Created</TableHead>
                      <TableHead className="text-xs w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="text-sm font-medium">{o.organizations?.name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={o.plans?.name === "Free" ? "secondary" : "default"} className="text-[10px]">
                            {o.plans?.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                          ₹{o.plans?.price_monthly?.toLocaleString("en-IN")}/mo
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={o.status === "active" ? "default" : "destructive"} className="text-[10px]">
                            {o.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                          {o.plans?.max_certificates_per_month?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                          {new Date(o.billing_cycle_start).toLocaleDateString()} — {new Date(o.billing_cycle_end).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                          {new Date(o.organizations?.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {["Free", "Starter", "Professional", "Enterprise"].map((p) => (
                                <DropdownMenuItem key={p} onClick={() => handlePlanChange(o.id, o.organizations?.name, p)}>
                                  Set {p}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleStatusChange(o.id, "active")}>
                                Activate
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleStatusChange(o.id, "suspended")}>
                                Suspend
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleStatusChange(o.id, "cancelled")}>
                                Cancel Subscription
                              </DropdownMenuItem>
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
