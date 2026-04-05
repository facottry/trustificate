import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { Check, X, Pencil } from "lucide-react";

const FEATURE_KEYS = [
  { key: "api_access", label: "API Access" },
  { key: "bulk_import", label: "Bulk Import" },
  { key: "webhook_access", label: "Webhooks" },
  { key: "analytics_access", label: "Analytics" },
  { key: "audit_exports", label: "Audit Exports" },
  { key: "priority_support", label: "Priority Support" },
];

export default function SuperAdminPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const fetchPlans = () => {
    setLoading(true);
    apiClient("/api/admin/super/plans")
      .then((res) => setPlans((res.data as any[]) || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleEdit = (plan: any) => {
    setEditing({
      ...plan,
      _price: String(plan.price_monthly),
      _originalPrice: String(plan.original_price ?? plan.price_monthly),
      _certs: String(plan.max_certificates_per_month),
      _templates: String(plan.max_templates),
      _team: String(plan.team_members),
      _description: plan.description || "",
      _featureList: (plan.feature_list || []).join("\n"),
      _cta: plan.cta || "Get Started",
      _ctaVariant: plan.cta_variant || "outline",
      _popular: !!plan.popular,
      _discount: plan.discount_label || "",
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await apiClient(`/api/admin/super/plans/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editing.name,
          price: Number(editing._price),
          originalPrice: Number(editing._originalPrice),
          limits: {
            certificates_created: Number(editing._certs),
            templates_created: Number(editing._templates),
            team_members: Number(editing._team),
          },
          features: {
            api_access: editing.api_access,
            bulk_import: editing.bulk_import,
            webhook_access: editing.webhook_access,
            analytics_access: editing.analytics_access,
            audit_exports: editing.audit_exports,
            priority_support: editing.priority_support,
          },
          description: editing._description || "",
          featureList: (editing._featureList || "").split("\n").map((s: string) => s.trim()).filter(Boolean),
          cta: editing._cta || "Get Started",
          ctaVariant: editing._ctaVariant || "outline",
          popular: !!editing._popular,
          discount: editing._discount || null,
        }),
      });
      toast.success("Plan updated!");
      setEditing(null);
      fetchPlans();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update plan");
    }
    setSaving(false);
  };

  const fmt = (v: number) => v === -1 ? "Unlimited" : v >= 10000 ? "10,000+" : v.toLocaleString();

  return (
    <SuperAdminLayout title="Plans" subtitle="Manage subscription plans (stored in database)">
      <div className="space-y-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-4"><Skeleton className="h-48 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="relative group">
                <Button variant="ghost" size="icon"
                  className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={() => handleEdit(plan)} title="Edit plan">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base capitalize">{plan.name}</CardTitle>
                    {!plan.is_active && <Badge variant="secondary" className="text-[9px]">Inactive</Badge>}
                  </div>
                  <p className="text-2xl font-bold">
                    {plan.price_monthly === 0 ? "Free" : plan.price_monthly === -1 ? "Custom" : `₹${plan.price_monthly.toLocaleString("en-IN")}`}
                    {plan.price_monthly > 0 && <span className="text-xs text-muted-foreground font-normal">/mo</span>}
                  </p>
                  {plan.original_price > 0 && plan.original_price !== plan.price_monthly && (
                    <p className="text-xs text-muted-foreground line-through">₹{plan.original_price.toLocaleString("en-IN")}/mo</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Certificates/mo</span><span className="font-medium">{fmt(plan.max_certificates_per_month)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Templates</span><span className="font-medium">{fmt(plan.max_templates)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Team Members</span><span className="font-medium">{fmt(plan.team_members)}</span></div>
                  <div className="pt-2 space-y-1.5 border-t">
                    {FEATURE_KEYS.map((f) => (
                      <div key={f.key} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{f.label}</span>
                        {plan[f.key] ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-muted-foreground/40" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground text-center">
          Plans are stored in the database. Changes take effect immediately — no deployment needed.
        </p>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Plan: {editing?.name}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Price (₹/mo)</Label>
                  <Input type="number" value={editing._price} onChange={(e) => setEditing({ ...editing, _price: e.target.value })} />
                  <p className="text-[10px] text-muted-foreground">Use -1 for custom/contact-us</p>
                </div>
                <div className="space-y-2">
                  <Label>Original Price (₹/mo)</Label>
                  <Input type="number" value={editing._originalPrice} onChange={(e) => setEditing({ ...editing, _originalPrice: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Certs/mo</Label>
                  <Input type="number" value={editing._certs} onChange={(e) => setEditing({ ...editing, _certs: e.target.value })} />
                  <p className="text-[10px] text-muted-foreground">-1 = unlimited</p>
                </div>
                <div className="space-y-2">
                  <Label>Templates</Label>
                  <Input type="number" value={editing._templates} onChange={(e) => setEditing({ ...editing, _templates: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Team</Label>
                  <Input type="number" value={editing._team} onChange={(e) => setEditing({ ...editing, _team: e.target.value })} />
                </div>
              </div>
              <div className="space-y-3 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">Features</p>
                {FEATURE_KEYS.map((f) => (
                  <div key={f.key} className="flex items-center justify-between">
                    <Label className="text-sm font-normal">{f.label}</Label>
                    <Switch checked={!!editing[f.key]} onCheckedChange={(v) => setEditing({ ...editing, [f.key]: v })} />
                  </div>
                ))}
              </div>
              <div className="space-y-3 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">Display (Pricing Page)</p>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={editing._description} onChange={(e) => setEditing({ ...editing, _description: e.target.value })} placeholder="Short plan description" />
                </div>
                <div className="space-y-2">
                  <Label>Feature List (one per line)</Label>
                  <textarea className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={editing._featureList} onChange={(e) => setEditing({ ...editing, _featureList: e.target.value })}
                    placeholder={"Up to 500 credentials/month\n10 templates\nCustom branding"} rows={5} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>CTA Button Text</Label>
                    <Input value={editing._cta} onChange={(e) => setEditing({ ...editing, _cta: e.target.value })} placeholder="Choose Starter" />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Variant</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editing._ctaVariant} onChange={(e) => setEditing({ ...editing, _ctaVariant: e.target.value })}>
                      <option value="outline">Outline</option>
                      <option value="default">Filled (primary)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Discount Badge</Label>
                    <Input value={editing._discount} onChange={(e) => setEditing({ ...editing, _discount: e.target.value })} placeholder="50% OFF" />
                  </div>
                  <div className="flex items-center justify-between pt-5">
                    <Label className="text-sm font-normal">Most Popular</Label>
                    <Switch checked={!!editing._popular} onCheckedChange={(v) => setEditing({ ...editing, _popular: v })} />
                  </div>
                </div>
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
