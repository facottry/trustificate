import { useEffect, useState } from "react";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { Search, MoreHorizontal, Download, ShieldX, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function SuperAdminCertificates() {
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<any | null>(null);

  async function loadCerts() {
    const { data } = await supabase
      .from("certificates")
      .select("id, certificate_number, recipient_name, recipient_email, status, issue_date, is_external, created_at, organizations(name), certificate_templates(title)")
      .order("created_at", { ascending: false })
      .limit(500);
    setCerts(data || []);
    setLoading(false);
  }

  useEffect(() => { loadCerts(); }, []);

  const filtered = certs.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.certificate_number?.toLowerCase().includes(q) ||
      c.recipient_name?.toLowerCase().includes(q) ||
      c.recipient_email?.toLowerCase().includes(q) ||
      (c.organizations as any)?.name?.toLowerCase().includes(q)
    );
  });

  async function handleRevoke(cert: any) {
    const { error } = await supabase
      .from("certificates")
      .update({ status: "revoked" })
      .eq("id", cert.id);
    if (error) { toast.error(error.message); return; }

    // Log event
    await supabase.from("certificate_events").insert({
      certificate_id: cert.id,
      event_type: "revoked",
      actor_id: (await supabase.auth.getUser()).data.user?.id,
    } as any);

    await supabase.rpc("log_admin_action", {
      _action: "certificate_revoked",
      _target_type: "certificate",
      _target_id: cert.id,
      _details: `Revoked ${cert.certificate_number}`,
    });

    toast.success(`Certificate ${cert.certificate_number} revoked`);
    setRevokeTarget(null);
    loadCerts();
  }

  async function handleRestore(cert: any) {
    const { error } = await supabase
      .from("certificates")
      .update({ status: "issued" })
      .eq("id", cert.id);
    if (error) { toast.error(error.message); return; }

    await supabase.rpc("log_admin_action", {
      _action: "certificate_restored",
      _target_type: "certificate",
      _target_id: cert.id,
      _details: `Restored ${cert.certificate_number}`,
    });

    toast.success(`Certificate ${cert.certificate_number} restored`);
    loadCerts();
  }

  function exportCSV() {
    const rows = filtered.map((c) => ({
      number: c.certificate_number,
      recipient: c.recipient_name,
      email: c.recipient_email || "",
      issuer: (c.organizations as any)?.name || "",
      template: (c.certificate_templates as any)?.title || "",
      status: c.status,
      issue_date: c.issue_date,
      type: c.is_external ? "External" : "Internal",
    }));
    const header = Object.keys(rows[0] || {}).join(",");
    const csv = [header, ...rows.map((r) => Object.values(r).map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "certificates-export.csv";
    a.click();
  }

  const issuedCount = certs.filter((c) => c.status === "issued").length;
  const revokedCount = certs.filter((c) => c.status === "revoked").length;

  return (
    <SuperAdminLayout
      title="Certificates"
      subtitle={`${certs.length} total · ${issuedCount} active · ${revokedCount} revoked`}
      actions={
        <Button variant="outline" size="sm" className="text-xs" onClick={exportCSV}>
          <Download className="mr-1 h-3.5 w-3.5" /> Export CSV
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by number, name, email, or org..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No certificates found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Certificate #</TableHead>
                      <TableHead className="text-xs">Recipient</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Issuer</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">Template</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Type</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Issue Date</TableHead>
                      <TableHead className="text-xs w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">{c.certificate_number?.slice(0, 20)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-xs font-medium">{c.recipient_name}</p>
                            {c.recipient_email && <p className="text-[10px] text-muted-foreground">{c.recipient_email}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{(c.organizations as any)?.name || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{(c.certificate_templates as any)?.title || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={c.status === "issued" ? "default" : c.status === "revoked" ? "destructive" : "secondary"} className="text-[10px]">
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-[10px]">{c.is_external ? "External" : "Internal"}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{new Date(c.issue_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {c.status === "issued" ? (
                                <DropdownMenuItem className="text-destructive" onClick={() => setRevokeTarget(c)}>
                                  <ShieldX className="mr-2 h-3.5 w-3.5" /> Revoke Certificate
                                </DropdownMenuItem>
                              ) : c.status === "revoked" ? (
                                <DropdownMenuItem onClick={() => handleRestore(c)}>
                                  <ShieldCheck className="mr-2 h-3.5 w-3.5" /> Restore Certificate
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revoke Confirmation */}
        <AlertDialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke Certificate?</AlertDialogTitle>
              <AlertDialogDescription>
                This will revoke certificate <span className="font-mono font-semibold">{revokeTarget?.certificate_number}</span> issued to <span className="font-semibold">{revokeTarget?.recipient_name}</span>. This action is logged and can be reversed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => revokeTarget && handleRevoke(revokeTarget)}>
                Revoke
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SuperAdminLayout>
  );
}
