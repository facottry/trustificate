import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Award } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function CertificatesPage() {
  const { profile } = useAuth();
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!profile?.organization_id) return;
    supabase
      .from("certificates")
      .select("*, certificate_templates(title)")
      .eq("organization_id", profile.organization_id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setCerts(data || []);
        setLoading(false);
      });
  }, [profile?.organization_id]);

  const filteredCerts = certs.filter((c) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      c.certificate_number?.toLowerCase().includes(q) ||
      c.recipient_name?.toLowerCase().includes(q) ||
      c.recipient_email?.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Certificates</h1>
            <p className="text-muted-foreground">{certs.length} certificates issued</p>
          </div>
          <Button asChild>
            <Link to="/certificates/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Issue Certificate
            </Link>
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by number, name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-6">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredCerts.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <Mascot mood="empty" size="lg" message={search ? "No matching certificates found." : "No certificates yet. Issue your first one!"} />
                {!search && (
                  <Button size="sm" asChild>
                    <Link to="/certificates/new">Issue your first certificate</Link>
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Certificate #</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCerts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link to={`/certificates/${c.id}`} className="font-mono text-sm text-primary hover:underline">
                          {c.certificate_number}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">{c.recipient_name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{c.recipient_email || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {(c.certificate_templates as any)?.title || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.status === "issued" ? "default" : "destructive"} className="text-xs">
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(c.issue_date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
