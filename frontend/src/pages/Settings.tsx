import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { usePlanGuard } from "@/hooks/usePlanGuard";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { Shield, Building2, User, Save, KeyRound, Users, CreditCard, Zap } from "lucide-react";
import { PasswordInput } from "@/components/PasswordInput";

function getNextPlan(current?: string): string {
  const lower = current?.toLowerCase();
  if (!lower || lower === "free") return "starter";
  if (lower === "starter") return "pro";
  return "enterprise";
}

export default function SettingsPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { orgUsage, loading: usageLoading } = usePlanGuard();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);

  // Org
  const [orgName, setOrgName] = useState("");
  const [orgLogo, setOrgLogo] = useState("");
  const [savingOrg, setSavingOrg] = useState(false);
  const [members, setMembers] = useState<any[]>([]);

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  useEffect(() => {
    if (!user?.organizationId) return;
    // Fetch org details
    apiClient<any>(`/api/organizations/${user.organizationId}`)
      .then(({ data }) => {
        if (data) {
          setOrgName(data.name || "");
          setOrgLogo(data.logoUrl || "");
        }
      })
      .catch(() => {});
  }, [user?.organizationId]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await apiClient(`/api/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({ displayName: displayName.trim(), avatarUrl: avatarUrl.trim() || null }),
      });
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save profile");
    }
    setSaving(false);
  };

  const handleSaveOrg = async () => {
    if (!orgName.trim()) {
      toast.error("Organization name is required");
      return;
    }
    setSavingOrg(true);
    try {
      if (user?.organizationId) {
        // Update existing organization
        await apiClient(`/api/organizations/${user.organizationId}`, {
          method: "PUT",
          body: JSON.stringify({ name: orgName.trim(), logoUrl: orgLogo.trim() || null }),
        });
        toast.success("Organization updated!");
      } else {
        // Create new organization
        const slug = orgName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        await apiClient(`/api/organizations`, {
          method: "POST",
          body: JSON.stringify({ name: orgName.trim(), slug, logoUrl: orgLogo.trim() || null }),
        });
        toast.success("Organization created!");
        // Refresh auth to pick up the new organizationId
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save organization");
    }
    setSavingOrg(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error("Min 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setChangingPw(true);
    try {
      await apiClient(`/api/users/change-password`, {
        method: "PUT",
        body: JSON.stringify({ newPassword }),
      });
      toast.success("Password changed!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to change password");
    }
    setChangingPw(false);
  };

  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user?.email?.[0] || "U").toUpperCase();

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and organization</p>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" /> Profile
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-14 w-14 rounded-full object-cover" />
                ) : initials}
              </div>
              <div>
                <p className="font-medium">{displayName || "Unnamed"}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label>Avatar URL</Label>
                <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} size="sm">
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        {/* Organization */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Organization
            </CardTitle>
            <CardDescription>Manage your organization details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!user?.organizationId && (
              <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
                You don't have an organization yet. Create one to start issuing certificates.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="My Organization" />
              </div>
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input value={orgLogo} onChange={(e) => setOrgLogo(e.target.value)} placeholder="https://..." />
              </div>
            </div>
            <Button onClick={handleSaveOrg} disabled={savingOrg} size="sm">
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {savingOrg ? "Saving..." : user?.organizationId ? "Save Organization" : "Create Organization"}
            </Button>
          </CardContent>
        </Card>

        {/* Plan & Billing */}
        {user?.organizationId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Plan & Billing
              </CardTitle>
              <CardDescription>Your current plan and usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {usageLoading || !orgUsage ? (
                <p className="text-sm text-muted-foreground">Loading plan details…</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">{orgUsage.plan_name}</Badge>
                      {orgUsage.billing_cycle_end && (
                        <span className="text-sm text-muted-foreground">
                          Renews {new Date(orgUsage.billing_cycle_end).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                    <Button size="sm" onClick={() => navigate(`/checkout?plan=${getNextPlan(orgUsage.plan_name)}`)}>
                      <Zap className="mr-1.5 h-3.5 w-3.5" />
                      Upgrade Plan
                    </Button>
                  </div>

                  <Separator />

                  {/* Certificates usage */}
                  {orgUsage.limits.certificates_created === -1 ? (
                    <div className="flex justify-between text-sm">
                      <span>Certificates</span>
                      <span className="text-muted-foreground">{orgUsage.usage.certificates_created ?? 0} used · Unlimited</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span>Certificates</span>
                        <span className="text-muted-foreground">
                          {orgUsage.usage.certificates_created ?? 0} / {orgUsage.limits.certificates_created}
                        </span>
                      </div>
                      <Progress
                        value={orgUsage.limits.certificates_created > 0
                          ? Math.min(Math.round(((orgUsage.usage.certificates_created ?? 0) / orgUsage.limits.certificates_created) * 100), 100)
                          : 0}
                        className="h-2"
                      />
                    </div>
                  )}

                  {/* Templates usage */}
                  {orgUsage.limits.templates_created === -1 ? (
                    <div className="flex justify-between text-sm">
                      <span>Templates</span>
                      <span className="text-muted-foreground">{orgUsage.usage.templates_created ?? 0} used · Unlimited</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span>Templates</span>
                        <span className="text-muted-foreground">
                          {orgUsage.usage.templates_created ?? 0} / {orgUsage.limits.templates_created}
                        </span>
                      </div>
                      <Progress
                        value={orgUsage.limits.templates_created > 0
                          ? Math.min(Math.round(((orgUsage.usage.templates_created ?? 0) / orgUsage.limits.templates_created) * 100), 100)
                          : 0}
                        className="h-2"
                      />
                    </div>
                  )}

                  {/* Free plan promotional banner */}
                  {orgUsage.plan_name?.toLowerCase() === "free" && (
                    <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                      🎉 Use code <span className="font-semibold">FREE_100</span> to unlock Starter features for free!
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Team Members
            </CardTitle>
            <CardDescription>People in your organization</CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No team members found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id || m._id}>
                      <TableCell className="font-mono text-xs">
                        {(m.userId || m.user_id) === user?.id ? (
                          <span className="text-primary">You</span>
                        ) : (
                          (m.userId || m.user_id || "").toString().slice(0, 8) + "..."
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{m.role}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> Change Password
            </CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <PasswordInput placeholder="Min 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <PasswordInput placeholder="Repeat new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" disabled={changingPw} size="sm" variant="outline">
                <Shield className="mr-1.5 h-3.5 w-3.5" />
                {changingPw ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
