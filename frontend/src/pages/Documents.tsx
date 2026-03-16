import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Award, Download, Upload } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PAGE_SIZE = 20;

export default function DocumentsPage() {
  const { profile } = useAuth();
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchPage = async (pageNum: number, append = false) => {
    if (!profile?.organization_id) return;
    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data } = await supabase
      .from("certificates")
      .select("*, certificate_templates(title)")
      .eq("organization_id", profile.organization_id)
      .eq("is_external", false)
      .order("created_at", { ascending: false })
      .range(from, to);

    const results = data || [];
    setCerts((prev) => (append ? [...prev, ...results] : results));
    setHasMore(results.length === PAGE_SIZE);
    setLoading(false);
  };

  useEffect(() => {
    setPage(0);
    fetchPage(0);
  }, [profile?.organization_id]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPage(next, true);
  };

  const filtered = certs.filter((c) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      c.certificate_number?.toLowerCase().includes(q) ||
      c.recipient_name?.toLowerCase().includes(q) ||
      c.recipient_email?.toLowerCase().includes(q)
    );
  });

  const exportCSV = () => {
    const headers = ["Certificate #", "Recipient", "Email", "Template", "Status", "Issue Date"];
    const rows = filtered.map((c) => [
      c.certificate_number,
      c.recipient_name,
      c.recipient_email || "",
      (c.certificate_templates as any)?.title || "",
      c.status,
      c.issue_date,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v: string) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TRUSTIFICATE-documents-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="text-muted-foreground">Platform-issued certificates and documents</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/documents/bulk"><Upload className="mr-1.5 h-4 w-4" /> Bulk Upload</Link>
            </Button>
            <Button asChild>
              <Link to="/documents/new"><Plus className="mr-1.5 h-4 w-4" /> Issue Document</Link>
            </Button>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by number, name, or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-6">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <Mascot mood="empty" size="lg" message={search ? "No matching documents found." : "No documents yet. Issue your first one!"} />
                {!search && (
                  <Button size="sm" asChild><Link to="/documents/new">Issue your first document</Link></Button>
                )}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certificate #</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issue Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c) => (
                      <TableRow key={c.id} className={c.status === "draft" ? "bg-amber-50/40 dark:bg-amber-950/10" : ""}>
                        <TableCell>
                          <Link to={`/documents/${c.id}`} className="font-mono text-sm text-primary hover:underline">
                            {c.certificate_number}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">{c.recipient_name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {(c.certificate_templates as any)?.title || "â€”"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={c.status === "issued" ? "default" : c.status === "draft" ? "outline" : "destructive"}
                            className={`text-xs ${c.status === "draft" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-400/30" : ""}`}
                          >
                            {c.status === "issued" ? "Verified" : c.status === "draft" ? "Draft" : "Revoked"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(c.issue_date).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {hasMore && !search && (
                  <div className="flex justify-center py-4 border-t">
                    <Button variant="ghost" size="sm" onClick={loadMore}>Load more</Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

