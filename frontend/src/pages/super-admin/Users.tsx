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
import { supabase } from "@/integrations/supabase/client";
import { Search, MoreHorizontal, Shield, ShieldAlert, Download } from "lucide-react";
import { toast } from "sonner";

export default function SuperAdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadUsers() {
    const { data } = await supabase.rpc("get_admin_users");
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.display_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.org_name?.toLowerCase().includes(q)
    );
  });

  async function handleRoleChange(userId: string, role: string) {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role } as any);
    if (error) {
      if (error.message.includes("duplicate")) toast.info("User already has this role");
      else toast.error(error.message);
      return;
    }
    toast.success(`Role "${role}" granted`);
    await supabase.rpc("log_admin_action", {
      _action: "grant_role",
      _target_type: "user",
      _target_id: userId,
      _details: `Granted ${role}`,
    });
    loadUsers();
  }

  async function handleRemoveRole(userId: string, role: string) {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role as any);
    if (error) { toast.error(error.message); return; }
    toast.success(`Role "${role}" removed`);
    await supabase.rpc("log_admin_action", {
      _action: "remove_role",
      _target_type: "user",
      _target_id: userId,
      _details: `Removed ${role}`,
    });
    loadUsers();
  }

  function exportCSV() {
    const rows = filtered.map((u) => ({
      name: u.display_name || "",
      email: u.email || "",
      organization: u.org_name || "",
      roles: (u.roles || []).join(", "),
      last_sign_in: u.last_sign_in_at || "",
      created: u.created_at || "",
    }));
    const header = Object.keys(rows[0] || {}).join(",");
    const csv = [header, ...rows.map((r) => Object.values(r).map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "users-export.csv";
    a.click();
  }

  return (
    <SuperAdminLayout
      title="Users"
      subtitle={`${users.length} total users`}
      actions={
        <Button variant="outline" size="sm" className="text-xs" onClick={exportCSV}>
          <Download className="mr-1 h-3.5 w-3.5" /> Export CSV
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No users found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Email</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Organization</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Roles</TableHead>
                      <TableHead className="text-xs hidden lg:table-cell">Last Sign In</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Joined</TableHead>
                      <TableHead className="text-xs w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="text-sm font-medium">
                          {u.display_name || "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {u.email}
                        </TableCell>
                        <TableCell className="text-xs hidden md:table-cell">
                          {u.org_name || "—"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex gap-1 flex-wrap">
                            {(u.roles || []).map((r: string) => (
                              <Badge
                                key={r}
                                variant={
                                  r === "super_admin"
                                    ? "destructive"
                                    : r === "admin"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-[10px]"
                              >
                                {r}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                          {u.last_sign_in_at
                            ? new Date(u.last_sign_in_at).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRoleChange(u.user_id, "admin")}>
                                <Shield className="mr-2 h-3.5 w-3.5" /> Grant Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRoleChange(u.user_id, "super_admin")}>
                                <ShieldAlert className="mr-2 h-3.5 w-3.5" /> Grant Super Admin
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {(u.roles || []).map((r: string) => (
                                <DropdownMenuItem
                                  key={r}
                                  className="text-destructive"
                                  onClick={() => handleRemoveRole(u.user_id, r)}
                                >
                                  Remove "{r}" role
                                </DropdownMenuItem>
                              ))}
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
      </div>
    </SuperAdminLayout>
  );
}
