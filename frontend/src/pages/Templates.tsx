import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Copy, ToggleLeft, ToggleRight, Trash2, Palette } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const CATEGORIES = [
  { key: "All", label: "All", emoji: "📋" },
  { key: "Professional", label: "Professional", emoji: "💼" },
  { key: "Academic", label: "Academic", emoji: "🎓" },
  { key: "Sports", label: "Sports", emoji: "🏆" },
  { key: "Participation", label: "Participation", emoji: "🤝" },
  { key: "Achievement", label: "Achievement", emoji: "⭐" },
  { key: "Corporate", label: "Corporate", emoji: "🏢" },
  { key: "Creative", label: "Creative", emoji: "🎨" },
  { key: "Government", label: "Government", emoji: "🏛️" },
];

const COLOR_MAP: Record<string, { bg: string; border: string; dot: string }> = {
  blue:    { bg: "bg-blue-50 dark:bg-blue-950/20",     border: "border-blue-200 dark:border-blue-800",    dot: "bg-blue-500" },
  purple:  { bg: "bg-purple-50 dark:bg-purple-950/20",  border: "border-purple-200 dark:border-purple-800", dot: "bg-purple-500" },
  green:   { bg: "bg-green-50 dark:bg-green-950/20",    border: "border-green-200 dark:border-green-800",  dot: "bg-green-500" },
  amber:   { bg: "bg-amber-50 dark:bg-amber-950/20",    border: "border-amber-200 dark:border-amber-800",  dot: "bg-amber-500" },
  cyan:    { bg: "bg-cyan-50 dark:bg-cyan-950/20",      border: "border-cyan-200 dark:border-cyan-800",    dot: "bg-cyan-500" },
  rose:    { bg: "bg-rose-50 dark:bg-rose-950/20",      border: "border-rose-200 dark:border-rose-800",    dot: "bg-rose-500" },
  slate:   { bg: "bg-slate-50 dark:bg-slate-950/20",    border: "border-slate-200 dark:border-slate-800",  dot: "bg-slate-500" },
  violet:  { bg: "bg-violet-50 dark:bg-violet-950/20",  border: "border-violet-200 dark:border-violet-800", dot: "bg-violet-500" },
  red:     { bg: "bg-red-50 dark:bg-red-950/20",        border: "border-red-200 dark:border-red-800",      dot: "bg-red-500" },
  indigo:  { bg: "bg-indigo-50 dark:bg-indigo-950/20",  border: "border-indigo-200 dark:border-indigo-800", dot: "bg-indigo-500" },
  orange:  { bg: "bg-orange-50 dark:bg-orange-950/20",  border: "border-orange-200 dark:border-orange-800", dot: "bg-orange-500" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" },
};

export default function TemplatesPage() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [certCounts, setCertCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data: templatesData } = await apiClient<any[]>('/api/templates');
      setTemplates(templatesData || []);
      const { data: certsData } = await apiClient<any[]>('/api/certificates?limit=1000');
      const counts: Record<string, number> = {};
      (certsData || []).forEach((c: any) => {
        if (c.templateId) counts[c.templateId] = (counts[c.templateId] || 0) + 1;
      });
      setCertCounts(counts);
    } catch {
      setTemplates([]);
      setCertCounts({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, [profile?.organization_id]);

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
          categories: t.categories || [],
          description: t.description || "",
          colorTheme: t.colorTheme || null,
          configuration: t.configuration,
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

  const filtered = activeCategory === "All"
    ? templates
    : templates.filter((t) => (t.categories || []).includes(activeCategory));

  const sorted = [...filtered].sort((a, b) => {
    if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Templates</h1>
            <p className="text-muted-foreground">Document blueprints for certificate generation</p>
          </div>
          <Button asChild>
            <Link to="/templates/new"><Plus className="mr-1.5 h-4 w-4" /> New Template</Link>
          </Button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const count = cat.key === "All"
              ? templates.length
              : templates.filter((t) => (t.categories || []).includes(cat.key)).length;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                <span className={`text-xs ${activeCategory === cat.key ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><Skeleton className="h-48 w-full rounded-lg" /></CardContent></Card>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Mascot mood="empty" size="xl" message={activeCategory === "All" ? "No templates yet. Create your first!" : `No ${activeCategory} templates found.`} />
              {activeCategory === "All" && (
                <Button asChild className="mt-2"><Link to="/templates/new">Create Template</Link></Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((t) => <TemplateCard key={t.id || t._id} t={t} certCounts={certCounts} onDuplicate={handleDuplicate} onToggle={handleToggleActive} onDelete={handleDelete} />)}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function TemplateCard({ t, certCounts, onDuplicate, onToggle, onDelete }: {
  t: any; certCounts: Record<string, number>;
  onDuplicate: (t: any) => void; onToggle: (t: any) => void; onDelete: (t: any) => void;
}) {
  const theme = (t.configuration?.color_theme as any) || {};
  const count = certCounts[t.id || t._id] || 0;
  const isSystem = Boolean(t.isSystem);
  const color = COLOR_MAP[t.colorTheme] || COLOR_MAP.slate;
  const categories: string[] = t.categories || [];

  return (
    <Card className={`group transition-all hover:shadow-lg hover:-translate-y-0.5 overflow-hidden ${!t.isActive ? "opacity-70" : ""}`}>
      {/* Color banner / preview area */}
      <div className={`relative h-28 ${color.bg} ${color.border} border-b flex items-center justify-center overflow-hidden`}>
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)`,
        }} />
        {/* Color swatch dots */}
        <div className="flex items-center gap-2 relative z-10">
          <div className={`h-4 w-4 rounded-full ${color.dot} ring-2 ring-white shadow-sm`} />
          {theme.secondary && <div className="h-3 w-3 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: theme.secondary }} />}
          {theme.accent && <div className="h-2.5 w-2.5 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: theme.accent }} />}
        </div>
        {/* Layout label */}
        <div className="absolute bottom-2 left-3">
          <Badge variant="secondary" className="text-[10px] bg-white/80 dark:bg-black/40 backdrop-blur-sm">
            <Palette className="h-2.5 w-2.5 mr-1" />{t.layout}
          </Badge>
        </div>
        {/* System badge */}
        {isSystem && (
          <Badge variant="outline" className="absolute top-2 right-2 text-[10px] bg-white/80 dark:bg-black/40 backdrop-blur-sm">
            Built-in
          </Badge>
        )}
        {!t.isActive && (
          <Badge className="absolute top-2 left-2 text-[10px] bg-amber-500/90 text-white border-0">Draft</Badge>
        )}
      </div>

      <CardHeader className="pb-2 pt-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{t.name || t.title}</CardTitle>
            {t.configuration?.subtitle && (
              <CardDescription className="text-xs truncate">{t.configuration.subtitle}</CardDescription>
            )}
          </div>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDuplicate(t)} title="Clone">
              <Copy className="h-3 w-3" />
            </Button>
            {!isSystem && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="Edit">
                  <Link to={`/templates/${t.id || t._id}/edit`}><Edit className="h-3 w-3" /></Link>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggle(t)} title={t.isActive ? "Deactivate" : "Activate"}>
                  {t.isActive ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Delete">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{t.name || t.title}". Existing certificates won't be affected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(t)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Description */}
        {t.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{t.description}</p>
        )}

        {/* Category tags */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {categories.map((cat: string) => (
              <Badge key={cat} variant="outline" className="text-[10px] px-1.5 py-0">
                {CATEGORIES.find((c) => c.key === cat)?.emoji} {cat}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer: prefix + date + count */}
        <div className="flex items-center justify-between pt-1 border-t">
          <Badge variant="secondary" className="text-[10px]">{t.numberPrefix}</Badge>
          <span className="text-[10px] text-muted-foreground">
            {t.createdAt ? new Date(t.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : ""}
            {" · "}{count} issued
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
