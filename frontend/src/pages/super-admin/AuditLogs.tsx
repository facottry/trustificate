import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Search, Download } from "lucide-react";

const ACTION_COLORS: Record<string, "default" | "destructive" | "secondary"> = {
  certificate_revoked: "destructive",
  certificate_restored: "default",
  grant_role: "default",
  remove_role: "destructive",
  plan_change: "secondary",
  plan_updated: "secondary",
  subscription_status_change: "secondary",
};

export default function SuperAdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    supabase
      .from("admin_audit_logs" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data }: any) => {
        setLogs(data || []);
        setLoading(false);
      });
  }, []);

  const actions = [...new Set(logs.map((l) => l.action))];

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || l.action?.toLowerCase().includes(q) || l.details?.toLowerCase().includes(q) || l.target_type?.toLowerCase().includes(q);
    const matchesAction = actionFilter === "all" || l.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  function exportCSV() {
    const rows = filtered.map((l) => ({
      id: l.id?.slice(0, 8),
      action: l.action,
      target_type: l.target_type || "",
      target_id: l.target_id?.slice(0, 8) || "",
      details: l.details || "",
      actor: l.actor_id?.slice(0, 8) || "",
      timestamp: l.created_at,
    }));
    const header = Object.keys(rows[0] || {}).join(",");
    const csv = [header, ...rows.map((r) => Object.values(r).map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "audit-logs-export.csv";
    a.click();
  }

  return (
    <SuperAdminLayout
      title="Audit Logs"
      subtitle={`${logs.length} recorded actions`}
      actions={
        <Button variant="outline" size="sm" className="text-xs" onClick={exportCSV}>
          <Download className="mr-1 h-3.5 w-3.5" /> Export CSV
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48 h-9 text-xs">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>{a.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                {logs.length === 0 ? "No audit logs yet. Actions will be recorded as admins use the panel." : "No logs match your filters"}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Action</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Target</TableHead>
                      <TableHead className="text-xs">Details</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Actor</TableHead>
                      <TableHead className="text-xs">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>
                          <Badge variant={ACTION_COLORS[l.action] || "secondary"} className="text-[10px]">
                            {l.action?.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="text-xs">
                            {l.target_type && <span className="text-muted-foreground">{l.target_type}: </span>}
                            <span className="font-mono">{l.target_id?.slice(0, 8) || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{l.details || "—"}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground hidden md:table-cell">
                          {l.actor_id?.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(l.created_at).toLocaleString()}
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
