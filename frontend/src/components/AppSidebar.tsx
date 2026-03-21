import { LayoutDashboard, FileText, Award, LogOut, ShieldCheck, Settings, BookOpen, AlertTriangle } from "lucide-react";
import { Logo, LogoIcon } from "@/components/Logo";
import { MascotInline } from "@/components/Mascot";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getBackendVersion } from "@/lib/apiClient";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Templates", url: "/templates", icon: FileText },
  { title: "Documents", url: "/documents", icon: Award },
  { title: "Registry", url: "/registry", icon: BookOpen },
];

const secondaryNav = [
  { title: "Verification", url: "/admin/verification", icon: ShieldCheck },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const [backendVersion, setBackendVersion] = useState<string | null>(null);

  useEffect(() => {
    // Poll sessionStorage for backend version (set by apiClient after first request)
    const check = () => setBackendVersion(getBackendVersion());
    check();
    const id = setInterval(check, 2000);
    return () => clearInterval(id);
  }, []);

  const frontendVersion = __APP_VERSION__;
  const versionMismatch = backendVersion !== null && backendVersion !== frontendVersion;

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const renderItems = (items: typeof mainNav) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={isActive(item.url)}>
          <NavLink
            to={item.url}
            className="hover:bg-sidebar-accent"
            activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
          >
            <item.icon className="mr-2 h-4 w-4" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-2">
          {collapsed ? (
            <div className="relative flex shrink-0 items-center justify-center">
              <LogoIcon className="h-7 w-7" />
              <MascotInline className="absolute -bottom-1 -right-1.5 h-3.5 w-3.5" />
            </div>
          ) : (
            <>
              <Logo size="sm" />
              <MascotInline className="h-3.5 w-3.5" />
            </>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-medium">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(secondaryNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={signOut}
                className="flex w-full items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && <span>Sign Out</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && profile?.display_name && (
          <p className="mt-1 truncate px-2 text-xs text-muted-foreground">
            {profile.display_name}
          </p>
        )}
        {!collapsed && (
          <div className="mt-1.5 px-2 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/50">Frontend</span>
              <span className="text-[10px] tabular-nums text-muted-foreground/50">v{frontendVersion}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/50">Backend</span>
              <span className="text-[10px] tabular-nums text-muted-foreground/50">
                {backendVersion ? `v${backendVersion}` : "—"}
              </span>
            </div>
            {versionMismatch && (
              <div className="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-1 mt-1">
                <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                <span className="text-[10px] text-amber-600 dark:text-amber-400 leading-tight">
                  Version mismatch
                </span>
              </div>
            )}
          </div>
        )}
        {collapsed && versionMismatch && (
          <div className="flex justify-center mt-1" title={`Frontend v${frontendVersion} · Backend v${backendVersion}`}>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
