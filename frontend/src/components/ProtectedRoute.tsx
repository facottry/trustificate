import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export interface AuthUser {
  id: string;
  displayName: string;
  email: string;
  role: string;
  organizationId?: string | null;
  isEmailVerified?: boolean;
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    return <Navigate to="/verify-email-link" state={{ email: user.email, displayName: user.displayName }} replace />;
  }

  return <>{children}</>;
}
