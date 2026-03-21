import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Building2, CreditCard, Package,
  Award, ScrollText, Shield, Menu, ChevronLeft, FileText, Mail
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/super-admin", icon: LayoutDashboard },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Users", url: "/super-admin/users", icon: Users },
      { title: "Organizations", url: "/super-admin/organizations", icon: Building2 },
      { title: "Certificates", url: "/super-admin/certificates", icon: Award },
      { title: "Templates", url: "/super-admin/templates", icon: FileText },
      { title: "Newsletter", url: "/super-admin/newsletter", icon: Mail },
    ],
  },
  {
    label: "Revenue",
    items: [
      { title: "Billing", url: "/super-admin/billing", icon: CreditCard },
      { title: "Plans", url: "/super-admin/plans", icon: Package },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Audit Logs", url: "/super-admin/audit-logs", icon: ScrollText },
    ],
  },
];

interface SuperAdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function SuperAdminLayout({ children, title, subtitle, actions }: SuperAdminLayoutProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (url: string) => {
    if (url === "/super-admin") return location.pathname === "/super-admin";
    return location.pathname.startsWith(url);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200 shrink-0",
          collapsed ? "w-14" : "w-56"
        )}
      >
        {/* Brand */}
        <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
          <Shield className="h-5 w-5 text-destructive shrink-0" />
          {!collapsed && (
            <span className="font-bold text-sm tracking-tight">Super Admin</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-3 mb-1.5 text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-semibold">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.url}
                    to={item.url}
                    title={collapsed ? item.title : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      isActive(item.url)
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-2 space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span>Back to App</span>}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="flex h-14 items-center justify-between border-b px-6 shrink-0 bg-background">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCollapsed(!collapsed)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div>
              {title && <h1 className="text-sm font-semibold leading-tight">{title}</h1>}
              {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <Badge variant="destructive" className="text-[10px] font-mono tracking-wider">
              SUPER ADMIN
            </Badge>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
