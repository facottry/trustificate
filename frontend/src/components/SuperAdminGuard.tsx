import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "authorized" | "denied">("loading");

  useEffect(() => {
    if (!user) {
      setStatus("denied");
      return;
    }
    // In this app, users with role "admin" are considered super admins.
    setStatus(user.role === "admin" ? "authorized" : "denied");
  }, [user]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (status === "denied") return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
