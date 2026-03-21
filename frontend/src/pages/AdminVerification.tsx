import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ShieldCheck, ShieldX, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function AdminVerificationPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const { data } = await apiClient<any[]>(`/api/certificates?search=${encodeURIComponent(query.trim())}&limit=20`);
      setResults(data || []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Verification Lookup</h1>
          <p className="text-muted-foreground">Search and verify any certificate across the platform</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by certificate #, name, or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" disabled={loading}>Search</Button>
        </form>

        {searched && (
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="space-y-3 p-6">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-muted-foreground">No certificates found matching your search</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certificate #</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((c) => (
                      <TableRow key={c._id || c.id}>
                        <TableCell>
                          <Link to={`/certificate/${c.slug}`} target="_blank" className="font-mono text-sm text-primary hover:underline">
                            {c.certificateNumber || c.certificate_number}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">{c.recipientName || c.recipient_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {c.status === "issued" ? (
                              <ShieldCheck className="h-4 w-4 text-success" />
                            ) : (
                              <ShieldX className="h-4 w-4 text-destructive" />
                            )}
                            <Badge variant={c.status === "issued" ? "default" : "destructive"} className="text-xs">
                              {c.status === "issued" ? "Verified" : "Revoked"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {(c.isExternal || c.is_external) ? "External" : (c.templateId?.title || "Platform")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(c.issueDate || c.issue_date).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
