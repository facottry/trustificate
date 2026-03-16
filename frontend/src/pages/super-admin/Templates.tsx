import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Search, Download } from "lucide-react";

export default function SuperAdminTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase
      .from("certificate_templates")
      .select("id, title, subtitle, number_prefix, layout, is_active, created_at, organizations(name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTemplates(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = templates.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.title?.toLowerCase().includes(q) || (t.organizations as any)?.name?.toLowerCase().includes(q);
  });

  function exportCSV() {
    const rows = filtered.map((t) => ({
      title: t.title,
      prefix: t.number_prefix,
      layout: t.layout,
      active: t.is_active ? "Yes" : "No",
      organization: (t.organizations as any)?.name || "",
      created: t.created_at,
    }));
    const header = Object.keys(rows[0] || {}).join(",");
    const csv = [header, ...rows.map((r) => Object.values(r).map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "templates-export.csv";
    a.click();
  }

  return (
    <SuperAdminLayout
      title="Templates"
      subtitle={`${templates.length} total templates`}
      actions={
        <Button variant="outline" size="sm" className="text-xs" onClick={exportCSV}>
          <Download className="mr-1 h-3.5 w-3.5" /> Export CSV
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No templates found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Subtitle</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Organization</TableHead>
                      <TableHead className="text-xs">Prefix</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Layout</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm font-medium">{t.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{t.subtitle || "—"}</TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{(t.organizations as any)?.name || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{t.number_prefix}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-[10px] capitalize">{t.layout}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={t.is_active ? "default" : "secondary"} className="text-[10px]">
                            {t.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{new Date(t.created_at).toLocaleDateString()}</TableCell>
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
