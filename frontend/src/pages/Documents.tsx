import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, Download, Upload, Trash2 } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const PAGE_SIZE = 20;

export default function DocumentsPage() {
  const { profile } = useAuth();
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input — 400ms
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(0);
    }, 400);
  };

  const fetchPage = useCallback(async (pageNum: number, searchTerm: string, append = false) => {
    if (!profile?.organization_id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        page: String(pageNum + 1),
        sort: "-createdAt",
      });
      if (searchTerm.trim()) params.set("search", searchTerm.trim());

      const { data } = await apiClient<any[]>(`/api/certificates?${params}`);
      const results = data || [];
      setCerts((prev) => (append ? [...prev, ...results] : results));
      setHasMore(results.length === PAGE_SIZE);
    } catch {
      if (!append) setCerts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id]);

  // Re-fetch when org or debounced search changes
  useEffect(() => {
    setPage(0);
    fetchPage(0, debouncedSearch);
  }, [profile?.organization_id, debouncedSearch]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPage(next, debouncedSearch, true);
  };

  const handleDelete = async (c: any) => {
    try {
      await apiClient(`/api/certificates/${c._id || c.id}`, { method: "DELETE" });
      toast.success("Certificate deleted");
      setCerts((prev) => prev.filter((cert) => (cert._id || cert.id) !== (c._id || c.id)));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete certificate");
    }
  };

  const exportCSV = () => {
    const headers = ["Certificate #", "Recipient", "Email", "Template", "Status", "Issue Date"];
    const rows = certs.map((c) => [
      c.certificateNumber,
      c.recipientName,
      c.recipientEmail || "",
      c.templateId?.title || "",
      c.status,
      c.issueDate,
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
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={certs.length === 0}>
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
          <Input
            placeholder="Search by number, name, or email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-6">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : certs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <Mascot mood="empty" size="lg" message={debouncedSearch ? "No matching documents found." : "No documents yet. Issue your first one!"} />
                {!debouncedSearch && (
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
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certs.map((c) => (
                      <TableRow key={c._id || c.id} className={c.status === "draft" ? "bg-amber-50/40 dark:bg-amber-950/10" : ""}>
                        <TableCell>
                          <Link to={`/documents/${c._id || c.id}`} className="font-mono text-sm text-primary hover:underline">
                            {c.certificateNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">{c.recipientName}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {c.templateId?.title || "—"}
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
                          {new Date(c.issueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {c.pdfUrl ? (
                            <a href={c.pdfUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary">
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </a>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Certificate?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete certificate {c.certificateNumber}. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(c)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {hasMore && (
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
