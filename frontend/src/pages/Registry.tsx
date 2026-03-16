import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, BookOpen, Globe, Plus, ExternalLink, Copy, Download } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const PAGE_SIZE = 20;

export default function RegistryPage() {
  const { profile } = useAuth();
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
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
    if (q && !(
      c.certificate_number?.toLowerCase().includes(q) ||
      c.recipient_name?.toLowerCase().includes(q) ||
      c.recipient_email?.toLowerCase().includes(q)
    )) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (typeFilter === "external" && !c.is_external) return false;
    if (typeFilter === "platform" && c.is_external) return false;
    return true;
  });

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/certificate/${slug}`);
    toast.success("Verification link copied!");
  };

  const exportCSV = () => {
    const headers = ["Certificate #", "Recipient", "Email", "Type", "Status", "Issue Date"];
    const rows = filtered.map((c) => [
      c.certificate_number,
      c.recipient_name,
      c.recipient_email || "",
      c.is_external ? "External" : ((c.certificate_templates as any)?.title || "Platform"),
      c.status,
      c.issue_date,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v: string) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TRUSTIFICATE-registry-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Registry</h1>
            <p className="text-muted-foreground">Complete document registry â€” platform & external certificates</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline" asChild>
              <Link to="/registry/external/new">
                <Globe className="mr-1.5 h-4 w-4" /> Add External
              </Link>
            </Button>
            <Button asChild>
              <Link to="/documents/new">
                <Plus className="mr-1.5 h-4 w-4" /> Issue Document
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="issued">Verified</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="platform">Platform Issued</SelectItem>
              <SelectItem value="external">External</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-6">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <Mascot mood="empty" size="lg" message="No documents in registry yet." />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certificate #</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <Link
                            to={c.is_external ? `/registry/${c.id}` : `/documents/${c.id}`}
                            className="font-mono text-sm text-primary hover:underline"
                          >
                            {c.certificate_number}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">{c.recipient_name}</TableCell>
                        <TableCell>
                          {c.is_external ? (
                            <Badge variant="outline" className="text-xs">
                              <Globe className="mr-1 h-3 w-3" /> External
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {(c.certificate_templates as any)?.title || "â€”"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(c.issue_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={c.status === "issued" ? "default" : "destructive"} className="text-xs">
                            {c.status === "issued" ? "Verified" : "Revoked"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <a
                            href={`/certificate/${c.slug}`}
                            target="_blank"
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" /> View
                          </a>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyLink(c.slug)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
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

