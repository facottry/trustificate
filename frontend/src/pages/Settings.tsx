import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { usePlanGuard } from "@/hooks/usePlanGuard";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import {
  Shield, Building2, User, Save, KeyRound, Users, CreditCard, Zap,
  Upload, X, Mail, UserPlus, Trash2, Clock, CheckCircle2, XCircle,
} from "lucide-react";
import { PasswordInput } from "@/components/PasswordInput";

function getNextPlan(current?: string): string {
  const lower = current?.toLowerCase();
  if (!lower || lower === "free") return "starter";
  if (lower === "starter") return "pro";
  return "enterprise";
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  accepted: { label: "Accepted", variant: "default" },
  expired: { label: "Expired", variant: "outline" },
  revoked: { label: "Revoked", variant: "destructive" },
};

export default function SettingsPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { orgUsage, loading: usageLoading } = usePlanGuard();

  // Profile state
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);

  // Org state
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgIndustry, setOrgIndustry] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [orgContactEmail, setOrgContactEmail] = useState("");
  const [orgLogo, setOrgLogo] = useState("");
  const [savingOrg, setSavingOrg] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [sendingInvite, setSendingInvite] = useState(false);

  const isEnterprise = orgUsage?.plan_id === "enterprise";
  const orgId = user?.organizationId;

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  useEffect(() => {
    if (!orgId) return;
    apiClient<any>(`/api/organizations/${orgId}`)
      .then(({ data }) => {
        if (data) {
          setOrgName(data.name || "");
          setOrgSlug(data.slug || "");
          setOrgWebsite(data.website || "");
          setOrgIndustry(data.industry || "");
          setOrgDescription(data.description || "");
          setOrgContactEmail(data.contactEmail || "");
          setOrgLogo(data.logoUrl || "");
        }
      })
      .catch(() => {});
  }, [orgId]);

  // Team members query
  const { data: membersData } = useQuery({
    queryKey: ["team-members", orgId],
    queryFn: () => apiClient<any[]>(`/api/organizations/${orgId}/members`).then((r) => r.data ?? []),
    enabled: !!orgId,
  });
  const members = membersData ?? [];

  // Invites query
  const { data: invitesData, refetch: refetchInvites } = useQuery({
    queryKey: ["org-invites", orgId],
    queryFn: () => apiClient<any[]>(`/api/organizations/${orgId}/invites`).then((r) => r.data ?? []),
    enabled: !!orgId && isEnterprise,
  });
  const invites = invitesData ?? [];

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
    if (!orgName.trim()) { toast.error("Organization name is required"); return; }
    if (orgSlug && !/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/.test(orgSlug)) {
      toast.error("Slug must be 3–60 chars, lowercase alphanumeric and hyphens, no leading/trailing hyphens");
      return;
    }
    setSavingOrg(true);
    try {
      const body: Record<string, any> = {
        name: orgName.trim(),
        logoUrl: orgLogo.trim() || null,
        website: orgWebsite.trim() || null,
        industry: orgIndustry.trim() || null,
        description: orgDescription.trim() || null,
        contactEmail: orgContactEmail.trim() || null,
      };
      if (orgSlug.trim()) body.slug = orgSlug.trim();

      if (orgId) {
        await apiClient(`/api/organizations/${orgId}`, { method: "PUT", body: JSON.stringify(body) });
        toast.success("Organization updated!");
      } else {
        const slug = orgName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        await apiClient(`/api/organizations`, { method: "POST", body: JSON.stringify({ ...body, slug }) });
        toast.success("Organization created!");
        window.location.reload();
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save organization");
    }
    setSavingOrg(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File too large. Max 5 MB."); return; }
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const token = localStorage.getItem("TRUSTIFICATE:token");
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${baseUrl}/api/organizations/${orgId}/logo`, {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Upload failed");
      setOrgLogo(json.data?.logoUrl || "");
      toast.success("Logo uploaded!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload logo");
    }
    setUploadingLogo(false);
    e.target.value = "";
  };

  const handleRemoveLogo = async () => {
    if (!orgId) return;
    setSavingOrg(true);
    try {
      await apiClient(`/api/organizations/${orgId}`, { method: "PUT", body: JSON.stringify({ logoUrl: null }) });
      setOrgLogo("");
      toast.success("Logo removed");
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove logo");
    }
    setSavingOrg(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error("Min 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setChangingPw(true);
    try {
      await apiClient(`/api/users/change-password`, { method: "PUT", body: JSON.stringify({ newPassword }) });
      toast.success("Password changed!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to change password");
    }
    setChangingPw(false);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) { toast.error("Email is required"); return; }
    if (!orgId) return;
    setSendingInvite(true);
    try {
      await apiClient(`/api/organizations/${orgId}/invites`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteRole("user");
      refetchInvites();
    } catch (err: any) {
      toast.error(err?.message || "Failed to send invite");
    }
    setSendingInvite(false);
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!orgId) return;
    try {
      await apiClient(`/api/organizations/${orgId}/invites/${inviteId}/revoke`, { method: "PATCH" });
      toast.success("Invite revoked");
      refetchInvites();
    } catch (err: any) {
      toast.error(err?.message || "Failed to revoke invite");
    }
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
            {!orgId && (
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
                <Label>
                  Slug
                  <span className="ml-1 text-xs text-muted-foreground">(unique identifier)</span>
                </Label>
                <Input
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="my-organization"
                />
                <p className="text-xs text-muted-foreground">3–60 chars, lowercase, hyphens allowed</p>
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={orgWebsite} onChange={(e) => setOrgWebsite(e.target.value)} placeholder="https://example.com" type="url" />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input value={orgIndustry} onChange={(e) => setOrgIndustry(e.target.value)} placeholder="e.g. Education, Technology" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Contact Email</Label>
                <Input value={orgContactEmail} onChange={(e) => setOrgContactEmail(e.target.value)} placeholder="contact@example.com" type="email" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  placeholder="Brief description of your organization"
                  maxLength={500}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">{orgDescription.length}/500</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Organization Logo</Label>
                {orgLogo ? (
                  <div className="flex items-center gap-3">
                    <img src={orgLogo} alt="Org logo" className="h-10 w-10 rounded object-contain border" />
                    <Button type="button" variant="ghost" size="sm" onClick={handleRemoveLogo} disabled={savingOrg}>
                      <X className="h-3.5 w-3.5 mr-1" /> Remove
                    </Button>
                  </div>
                ) : (
                  <div>
                    <label className={`inline-flex items-center gap-2 cursor-pointer rounded-md border border-dashed px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors ${uploadingLogo ? "opacity-50 pointer-events-none" : ""}`}>
                      <Upload className="h-4 w-4" />
                      {uploadingLogo ? "Uploading..." : "Upload logo"}
                      <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPEG, WebP or SVG. Max 5 MB.</p>
                  </div>
                )}
              </div>
            </div>
            <Button onClick={handleSaveOrg} disabled={savingOrg} size="sm">
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {savingOrg ? "Saving..." : orgId ? "Save Organization" : "Create Organization"}
            </Button>
          </CardContent>
        </Card>

        {/* Plan & Billing */}
        {orgId && (
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
                      <Zap className="mr-1.5 h-3.5 w-3.5" /> Upgrade Plan
                    </Button>
                  </div>
                  <Separator />
                  {orgUsage.limits.certificates_created === -1 ? (
                    <div className="flex justify-between text-sm">
                      <span>Certificates</span>
                      <span className="text-muted-foreground">{orgUsage.usage.certificates_created ?? 0} used · 10,000+ Per Month</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span>Certificates</span>
                        <span className="text-muted-foreground">{orgUsage.usage.certificates_created ?? 0} / {orgUsage.limits.certificates_created}</span>
                      </div>
                      <Progress value={orgUsage.limits.certificates_created > 0 ? Math.min(Math.round(((orgUsage.usage.certificates_created ?? 0) / orgUsage.limits.certificates_created) * 100), 100) : 0} className="h-2" />
                    </div>
                  )}
                  {orgUsage.limits.templates_created === -1 ? (
                    <div className="flex justify-between text-sm">
                      <span>Templates</span>
                      <span className="text-muted-foreground">{orgUsage.usage.templates_created ?? 0} used · 10,000+ Per Month</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span>Templates</span>
                        <span className="text-muted-foreground">{orgUsage.usage.templates_created ?? 0} / {orgUsage.limits.templates_created}</span>
                      </div>
                      <Progress value={orgUsage.limits.templates_created > 0 ? Math.min(Math.round(((orgUsage.usage.templates_created ?? 0) / orgUsage.limits.templates_created) * 100), 100) : 0} className="h-2" />
                    </div>
                  )}
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
            <CardDescription>Manage your organization's team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isEnterprise ? (
              <div className="rounded-md border border-dashed p-6 text-center space-y-3">
                <Users className="h-8 w-8 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Team invites require the Enterprise plan</p>
                  <p className="text-xs text-muted-foreground mt-1">Invite your HR team and employees to share the same organization account.</p>
                </div>
                <Button size="sm" onClick={() => navigate("/checkout?plan=enterprise")}>
                  <Zap className="mr-1.5 h-3.5 w-3.5" /> Upgrade to Enterprise
                </Button>
              </div>
            ) : (
              <>
                {/* Invite form */}
                <form onSubmit={handleSendInvite} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Email address</Label>
                    <Input
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-28 space-y-1">
                    <Label className="text-xs">Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" size="sm" disabled={sendingInvite}>
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                    {sendingInvite ? "Sending..." : "Invite"}
                  </Button>
                </form>

                {/* Pending invites */}
                {invites.length > 0 && (
                  <>
                    <Separator />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending Invites</p>
                    <div className="space-y-2">
                      {invites.filter((inv) => inv.status === "pending").map((inv) => (
                        <div key={inv._id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{inv.email}</span>
                            <Badge variant="outline" className="text-xs capitalize">{inv.role}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(inv.createdAt).toLocaleDateString()}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-destructive hover:text-destructive"
                              onClick={() => handleRevokeInvite(inv._id)}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* All invites history */}
                {invites.filter((inv) => inv.status !== "pending").length > 0 && (
                  <>
                    <Separator />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Invite History</p>
                    <div className="space-y-1">
                      {invites.filter((inv) => inv.status !== "pending").map((inv) => {
                        const s = STATUS_BADGE[inv.status] ?? { label: inv.status, variant: "outline" as const };
                        return (
                          <div key={inv._id} className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm text-muted-foreground">
                            <span>{inv.email}</span>
                            <Badge variant={s.variant} className="text-xs">{s.label}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Members list — always shown */}
            {members.length > 0 && (
              <>
                <Separator />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Members</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((m: any) => {
                      const uid = m.userId?.toString() || m.userId;
                      const isMe = uid === user?.id;
                      return (
                        <TableRow key={uid}>
                          <TableCell className="font-medium text-sm">
                            {m.displayName || "—"}
                            {isMe && <span className="ml-1.5 text-xs text-primary font-normal">(You)</span>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{m.email || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">{m.role}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </>
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
