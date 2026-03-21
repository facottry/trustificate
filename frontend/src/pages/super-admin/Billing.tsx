import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/apiClient";
import { Download, CreditCard, Package, Tag } from "lucide-react";

export default function SuperAdminBilling() {
  const [orders, setOrders] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient("/api/admin/super/billing")
      .then((res) => {
        const d = (res.data as any) || {};
        setOrders(d.orders || []);
        setSubscriptions(d.subscriptions || []);
        setCoupons(d.coupons || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.final_amount || 0), 0);
  const completedOrders = orders.filter((o) => o.status === "completed").length;
  const paidSubs = subscriptions.filter((s) => s.plan && s.plan !== "free").length;

  function exportOrders() {
    const rows = orders.map((o) => ({
      order_id: String(o.id || "").slice(0, 8),
      org: o.org_name || "",
      plan: o.plan_name || "",
      original: o.original_price,
      discount: `${o.discount_percent}%`,
      coupon: o.coupon_code || "",
      final: o.final_amount,
      status: o.status,
      date: o.created_at,
    }));
    const header = Object.keys(rows[0] || {}).join(",");
    const csv = [header, ...rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "billing-export.csv";
    a.click();
  }

  return (
    <SuperAdminLayout
      title="Billing"
      subtitle="Subscriptions, orders, and coupons"
      actions={
        <Button variant="outline" size="sm" className="text-xs" onClick={exportOrders}>
          <Download className="mr-1 h-3.5 w-3.5" /> Export
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Revenue</p>
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold">₹{totalRevenue.toLocaleString("en-IN")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Paid Subscriptions</p>
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold">{paidSubs}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Completed Orders</p>
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold">{completedOrders}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions ({subscriptions.length})</TabsTrigger>
            <TabsTrigger value="coupons">Coupons ({coupons.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">No orders</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Order ID</TableHead>
                          <TableHead className="text-xs hidden sm:table-cell">Organization</TableHead>
                          <TableHead className="text-xs">Plan</TableHead>
                          <TableHead className="text-xs hidden sm:table-cell">Original</TableHead>
                          <TableHead className="text-xs hidden sm:table-cell">Discount</TableHead>
                          <TableHead className="text-xs hidden md:table-cell">Coupon</TableHead>
                          <TableHead className="text-xs">Final</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs hidden md:table-cell">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((o: any) => (
                          <TableRow key={o.id || o._id}>
                            <TableCell className="font-mono text-xs">{String(o.id || o._id || "").slice(0, 8).toUpperCase()}</TableCell>
                            <TableCell className="text-xs hidden sm:table-cell">{o.org_name || "—"}</TableCell>
                            <TableCell className="text-xs font-medium">{o.plan_name || "—"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden sm:table-cell line-through">
                              ₹{(o.original_price || 0).toLocaleString("en-IN")}
                            </TableCell>
                            <TableCell className="text-xs hidden sm:table-cell">{o.discount_percent || 0}%</TableCell>
                            <TableCell className="text-xs hidden md:table-cell">
                              {o.coupon_code ? <Badge variant="outline" className="text-[10px] font-mono">{o.coupon_code}</Badge> : "—"}
                            </TableCell>
                            <TableCell className="text-xs font-semibold">₹{(o.final_amount || 0).toLocaleString("en-IN")}</TableCell>
                            <TableCell>
                              <Badge variant={o.status === "completed" ? "default" : "secondary"} className="text-[10px]">{o.status}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                              {o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : subscriptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">No subscriptions</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Organization</TableHead>
                          <TableHead className="text-xs">Plan</TableHead>
                          <TableHead className="text-xs hidden md:table-cell">Billing Cycle</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscriptions.map((s: any) => (
                          <TableRow key={s.id || s._id}>
                            <TableCell className="text-sm font-medium">{s.org_name || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[10px] capitalize">{s.plan || "free"}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                              {s.billing_cycle_start ? new Date(s.billing_cycle_start).toLocaleDateString() : "—"}
                              {" — "}
                              {s.billing_cycle_end ? new Date(s.billing_cycle_end).toLocaleDateString() : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coupons" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : coupons.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-10">No coupons</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Code</TableHead>
                          <TableHead className="text-xs">Discount</TableHead>
                          <TableHead className="text-xs">Uses</TableHead>
                          <TableHead className="text-xs hidden sm:table-cell">Max Uses</TableHead>
                          <TableHead className="text-xs hidden sm:table-cell">Expires</TableHead>
                          <TableHead className="text-xs">Active</TableHead>
                          <TableHead className="text-xs hidden md:table-cell">Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {coupons.map((c: any) => (
                          <TableRow key={c.id || c._id}>
                            <TableCell className="font-mono text-xs font-bold">{c.code}</TableCell>
                            <TableCell className="text-xs">{c.discount_percent}%</TableCell>
                            <TableCell className="text-xs">{c.current_uses || 0}</TableCell>
                            <TableCell className="text-xs hidden sm:table-cell">{c.max_uses || "∞"}</TableCell>
                            <TableCell className="text-xs hidden sm:table-cell">
                              {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={c.is_active ? "default" : "secondary"} className="text-[10px]">
                                {c.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                              {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}
