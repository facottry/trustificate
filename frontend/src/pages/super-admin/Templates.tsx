import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { Search, Download, Pencil, Image, FileText } from "lucide-react";

export default function SuperAdminTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const fetchTemplates = () => {
    setLoading(true);
    apiClient("/api/admin/super/templates")
      .then((res) => setTemplates(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTemplates(); }, []);

  const filtered = templates.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.title?.toLowerCase().includes(q) || t.org_name?.toLowerCase().includes(q);
  });

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await apiClient(`/api/admin/super/templates/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          description: editing.description,
          categories: editing.categories,
          colorTheme: editing.colorTheme,
          samplePdfUrl: editing.samplePdfUrl,
          sampleImageUrl: editing.sampleImageUrl,
        }),
      });
      toast.success("Template updated!");
      setEditing(null);
      fetchTemplates();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update");
    }
    setSaving(false);
  };

  function exportCSV() {
    const rows = filtered.map((t) => ({
      title: t.title, subtitle: t.subtitle || "", prefix: t.number_prefix || "",
      layout: t.layout || "", active: t.is_active ? "Yes" : "No",
      system: t.is_system ? "Yes" : "No", organization: t.org_name || "",
      categories: (t.categories || []).join("; "), created: t.created_at,
    }));
    const header = Object.keys(rows[0] || {}).join(",");
    const csv = [header, ...rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "templates-export.csv"; a.click();
  }

  return (
    <SuperAdminLayout title="Templates" subtitle={`${templates.length} total templates`}
      actions={<Button variant="outline" size="sm" className="text-xs" onClick={exportCSV}><Download className="mr-1 h-3.5 w-3.5" /> Export CSV</Button>}>
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
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Sample</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((t) => (
                      <TableRow key={t.id || t._id}>
                        <TableCell className="text-sm font-medium">{t.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{t.subtitle || "—"}</TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{t.org_name || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{t.number_prefix || "—"}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-[10px] capitalize">{t.layout || "—"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={t.is_system ? "secondary" : "outline"} className="text-[10px]">
                            {t.is_system ? "Built-in" : "Custom"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {t.sampleImageUrl && <Badge variant="outline" className="text-[9px] text-green-600 border-green-300"><Image className="h-2.5 w-2.5 mr-0.5" />Img</Badge>}
                            {t.samplePdfUrl && <Badge variant="outline" className="text-[9px] text-blue-600 border-blue-300"><FileText className="h-2.5 w-2.5 mr-0.5" />PDF</Badge>}
                            {!t.sampleImageUrl && !t.samplePdfUrl && <span className="text-[10px] text-muted-foreground">—</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={t.is_active ? "default" : "secondary"} className="text-[10px]">
                            {t.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing({ ...t })} title="Edit sample URLs">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
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

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Template: {editing?.title}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Brief description of this template" maxLength={300} rows={3} />
                <p className="text-[10px] text-muted-foreground">{(editing.description || "").length}/300</p>
              </div>
              <div className="space-y-2">
                <Label>Categories (comma-separated)</Label>
                <Input value={(editing.categories || []).join(", ")}
                  onChange={(e) => setEditing({ ...editing, categories: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })}
                  placeholder="Professional, Academic, Sports" />
                <p className="text-[10px] text-muted-foreground">Available: Professional, Academic, Sports, Participation, Achievement, Corporate, Creative, Government</p>
              </div>
              <div className="space-y-2">
                <Label>Color Theme</Label>
                <Input value={editing.colorTheme || ""} onChange={(e) => setEditing({ ...editing, colorTheme: e.target.value })}
                  placeholder="blue, purple, green, amber, cyan, rose, etc." />
              </div>
              <div className="space-y-2">
                <Label>Sample Image URL (CDN)</Label>
                <Input value={editing.sampleImageUrl || ""} onChange={(e) => setEditing({ ...editing, sampleImageUrl: e.target.value })}
                  placeholder="https://cdn.clicktory.in/templates/sample-modern.png" />
                {editing.sampleImageUrl && (
                  <img src={editing.sampleImageUrl} alt="Preview" className="h-24 rounded border object-contain bg-muted" />
                )}
              </div>
              <div className="space-y-2">
                <Label>Sample PDF URL (CDN)</Label>
                <Input value={editing.samplePdfUrl || ""} onChange={(e) => setEditing({ ...editing, samplePdfUrl: e.target.value })}
                  placeholder="https://cdn.clicktory.in/templates/sample-modern.pdf" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperAdminLayout>
  );
}
