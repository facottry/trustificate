import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Check } from "lucide-react";
import { toast } from "sonner";

export default function SuperAdminPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPlan, setEditPlan] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadPlans() {
    const { data } = await supabase.from("plans").select("*").order("display_order");
    setPlans(data || []);
    setLoading(false);
  }

  useEffect(() => { loadPlans(); }, []);

  async function handleSave() {
    if (!editPlan) return;
    setSaving(true);
    const { id, created_at, ...updateData } = editPlan;
    const { error } = await supabase.from("plans").update(updateData).eq("id", id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${editPlan.name} plan updated`);
    await supabase.rpc("log_admin_action", {
      _action: "plan_updated",
      _target_type: "plan",
      _target_id: id,
      _details: `Updated ${editPlan.name}`,
    });
    setEditPlan(null);
    loadPlans();
  }

  return (
    <SuperAdminLayout title="Plans" subtitle="Manage subscription plans and limits">
      <div className="space-y-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-4"><Skeleton className="h-40 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="relative">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditPlan({ ...plan })}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-2xl font-bold">₹{plan.price_monthly.toLocaleString("en-IN")}<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Certificates/mo</span><span className="font-medium">{plan.max_certificates_per_month.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Templates</span><span className="font-medium">{plan.max_templates}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Team Members</span><span className="font-medium">{plan.team_members}</span></div>
                  <div className="flex flex-wrap gap-1 pt-2">
                    {plan.api_access && <Badge variant="secondary" className="text-[9px]">API</Badge>}
                    {plan.bulk_import && <Badge variant="secondary" className="text-[9px]">Bulk</Badge>}
                    {plan.webhook_access && <Badge variant="secondary" className="text-[9px]">Webhooks</Badge>}
                    {plan.analytics_access && <Badge variant="secondary" className="text-[9px]">Analytics</Badge>}
                    {plan.audit_exports && <Badge variant="secondary" className="text-[9px]">Audit</Badge>}
                    {plan.priority_support && <Badge variant="secondary" className="text-[9px]">Priority</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editPlan} onOpenChange={(open) => !open && setEditPlan(null)}>
          <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit {editPlan?.name} Plan</DialogTitle>
              <DialogDescription>Update plan limits and features</DialogDescription>
            </DialogHeader>
            {editPlan && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Plan Name</Label>
                    <Input value={editPlan.name} onChange={(e) => setEditPlan({ ...editPlan, name: e.target.value })} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Monthly Price (₹)</Label>
                    <Input type="number" value={editPlan.price_monthly} onChange={(e) => setEditPlan({ ...editPlan, price_monthly: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Max Certificates/mo</Label>
                    <Input type="number" value={editPlan.max_certificates_per_month} onChange={(e) => setEditPlan({ ...editPlan, max_certificates_per_month: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Max Templates</Label>
                    <Input type="number" value={editPlan.max_templates} onChange={(e) => setEditPlan({ ...editPlan, max_templates: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Team Members</Label>
                    <Input type="number" value={editPlan.team_members} onChange={(e) => setEditPlan({ ...editPlan, team_members: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Display Order</Label>
                    <Input type="number" value={editPlan.display_order} onChange={(e) => setEditPlan({ ...editPlan, display_order: parseInt(e.target.value) || 0 })} className="h-8 text-sm" />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    { key: "api_access", label: "API Access" },
                    { key: "bulk_import", label: "Bulk Import" },
                    { key: "webhook_access", label: "Webhooks" },
                    { key: "analytics_access", label: "Analytics" },
                    { key: "audit_exports", label: "Audit Exports" },
                    { key: "priority_support", label: "Priority Support" },
                  ].map((feat) => (
                    <div key={feat.key} className="flex items-center justify-between">
                      <Label className="text-xs">{feat.label}</Label>
                      <Switch
                        checked={editPlan[feat.key]}
                        onCheckedChange={(checked) => setEditPlan({ ...editPlan, [feat.key]: checked })}
                      />
                    </div>
                  ))}
                </div>

                <Button className="w-full" onClick={handleSave} disabled={saving}>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
}
