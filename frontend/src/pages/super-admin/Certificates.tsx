import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SuperAdminLayout } from "@/components/SuperAdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { apiClient } from "@/lib/apiClient";
import { Search, MoreHorizontal, Download, ShieldX, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function SuperAdminCertificates() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<any | null>(null);

  const { data: certs = [], isLoading } = useQuery({
    queryKey: ["sa-certs"],
    queryFn: () => apiClient<any[]>("/api/admin/super/certificates").then((r) => r.data ?? []),
  });

  const filtered = certs.filter((c: any) => {
    const q = search.toLowerCase();
    return !q || c.certificate_number?.toLowerCase().includes(q) || c.recipient_name?.toLowerCase().includes(q) || c.recipient_email?.toLowerCase().includes(q) || c.org_name?.toLowerCase().includes(q);
  });

  async function setCertStatus(certId: string, status: string) {
    try {
      await apiClient(`/api/admin/super/certificates/${certId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast.success(`Certificate ${status}`);
      qc.invalidateQueries({ queryKey: ["sa-certs"] });
      qc.invalidateQueries({ queryKey: ["sa-certs-recent"] });
      qc.invalidateQueries({ queryKey: ["sa-stats"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    }
  }

  function exportCSV() {
    const rows = filtered.map((c: any) => ({
      number: c.certificate_number, recipient: c.recipient_name, email: c.recipient_email || "",
      issuer: c.org_name || "", template: c.template_title || "", status: c.status,
      issue_date: c.issue_date, type: c.is_external ? "External" : "Internal",
    }));
    const header = Object.keys(rows[0] || {}).join(",");
    const csv = [header, ...rows.map((r: any) => Object.values(r).map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "certificates-export.csv";
    a.click();
  }

  const issuedCount = certs.filter((c: any) => c.status === "issued").length;
  const revokedCount = certs.filter((c: any) => c.status === "revoked").length;

  return (
    <SuperAdminLayout
      title="Certificates"
      subtitle={`${certs.length} total · ${issuedCount} active · ${revokedCount} revoked`}
      actions={<Button variant="outline" size="sm" className="text-xs" onClick={exportCSV}><Download className="mr-1 h-3.5 w-3.5" /> Export CSV</Button>}
    >
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by number, name, email, or org..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
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
                    {filtered.map((c: any) => (
                      <TableRow key={String(c.id)}>
                        <TableCell className="font-mono text-xs">{c.certificate_number?.slice(0, 20)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-xs font-medium">{c.recipient_name}</p>
                            {c.recipient_email && <p className="text-[10px] text-muted-foreground">{c.recipient_email}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{c.org_name || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">{c.template_title || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={c.status === "issued" ? "default" : c.status === "revoked" ? "destructive" : "secondary"} className="text-[10px]">{c.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="text-[10px]">{c.is_external ? "External" : "Internal"}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                          {c.issue_date ? new Date(c.issue_date).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {c.status === "issued" ? (
                                <DropdownMenuItem className="text-destructive" onClick={() => setRevokeTarget(c)}>
                                  <ShieldX className="mr-2 h-3.5 w-3.5" /> Revoke
                                </DropdownMenuItem>
                              ) : c.status === "revoked" ? (
                                <DropdownMenuItem onClick={() => setCertStatus(String(c.id), "issued")}>
                                  <ShieldCheck className="mr-2 h-3.5 w-3.5" /> Restore
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

        <AlertDialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke Certificate?</AlertDialogTitle>
              <AlertDialogDescription>
                This will revoke <span className="font-mono font-semibold">{revokeTarget?.certificate_number}</span> issued to <span className="font-semibold">{revokeTarget?.recipient_name}</span>. This can be reversed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { setCertStatus(String(revokeTarget?.id), "revoked"); setRevokeTarget(null); }}>
                Revoke
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SuperAdminLayout>
  );
}
