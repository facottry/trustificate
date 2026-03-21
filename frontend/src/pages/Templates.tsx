import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, FileText, Edit, Copy, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function TemplatesPage() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [certCounts, setCertCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data: templatesData } = await apiClient<any[]>('/api/templates');
      setTemplates(templatesData || []);

      const { data: certsData } = await apiClient<any[]>(`/api/certificates?limit=1000`);
      const counts: Record<string, number> = {};
      (certsData || []).forEach((c) => {
        if (c.templateId) counts[c.templateId] = (counts[c.templateId] || 0) + 1;
      });
      setCertCounts(counts);
    } catch (err) {
      setTemplates([]);
      setCertCounts({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [profile?.organization_id]);

  const handleDuplicate = async (t: any) => {
    try {
      await apiClient('/api/templates', {
        method: 'POST',
        body: JSON.stringify({
          name: `${t.name || t.title} (Copy)`,
          title: `${t.title} (Copy)`,
          placeholders: t.placeholders,
          isActive: t.isActive,
          layout: t.layout,
          configuration: {
            subtitle: t.configuration?.subtitle,
            body_text: t.configuration?.body_text,
            color_theme: t.configuration?.color_theme,
            background_style: t.configuration?.background_style,
            signature_config: t.configuration?.signature_config,
            seal_config: t.configuration?.seal_config,
            logo_url: t.configuration?.logo_url,
          },
          numberPrefix: t.numberPrefix,
        }),
      });
      toast.success("Template duplicated");
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Failed to duplicate template");
    }
  };

  const handleToggleActive = async (t: any) => {
    try {
      await apiClient(`/api/templates/${t.id || t._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !t.isActive }),
      });
      toast.success(t.isActive ? "Template deactivated" : "Template activated");
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Failed to update template status");
    }
  };

  const handleDelete = async (t: any) => {
    try {
      await apiClient(`/api/templates/${t.id || t._id}`, { method: 'DELETE' });
      toast.success("Template deleted");
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete template");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Templates</h1>
            <p className="text-muted-foreground">Document blueprints for certificate generation</p>
          </div>
          <Button asChild>
            <Link to="/templates/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New Template
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Mascot mood="empty" size="xl" message="No templates yet. Create your first to start issuing certificates." />
              <Button asChild className="mt-2">
                <Link to="/templates/new">Create Template</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...templates]
              .sort((a, b) => {
                if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              })
              .map((t) => {
              const theme = (t.configuration?.color_theme as any) || {};
              const placeholders = Array.isArray(t.placeholders) ? t.placeholders : [];
              const count = certCounts[t.id || t._id] || 0;
              const isSystem = Boolean(t.isSystem);
              return (
                <Card
                  key={t.id || t._id}
                  className={`group transition-shadow hover:shadow-md ${!t.isActive ? "border-amber-400/50 bg-amber-50/30 dark:bg-amber-950/10" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold text-sm"
                        style={{ backgroundColor: theme.primary || "hsl(192, 85%, 22%)" }}
                      >
                        {t.numberPrefix?.charAt(0) || "C"}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDuplicate(t)}
                          title={isSystem ? "Clone template" : "Duplicate"}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {!isSystem && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Edit">
                            <Link to={`/templates/${t.id || t._id}/edit`}>
                              <Edit className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                        {!isSystem && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleActive(t)}
                            title={t.isActive ? "Deactivate" : "Activate"}
                          >
                            {t.isActive ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                        {!isSystem && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{t.name || t.title}". Existing certificates using this template will not be affected.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(t)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base mt-2">{t.name || t.title}</CardTitle>
                        <CardDescription className="text-xs">{t.title}</CardDescription>
                        {t.configuration?.subtitle && <CardDescription className="text-xs text-muted-foreground/70">{t.configuration.subtitle}</CardDescription>}
                      </div>
                      {isSystem && (
                        <Badge variant="outline" className="text-xs h-6">
                          Built-in
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {t.layout}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {t.numberPrefix}
                        </Badge>
                        {!t.isActive && (
                          <Badge className="text-xs bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-400/30">
                            Draft
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : ""}
                        {" · "}
                        {count} issued
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
