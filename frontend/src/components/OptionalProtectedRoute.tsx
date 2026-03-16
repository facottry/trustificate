import { useAuth } from "@/hooks/useAuth";

/**
 * OptionalProtectedRoute allows both authenticated and unauthenticated users
 * to access a page. Useful for pages like docs, blog, etc. that work for everyone.
 * 
 * Usage: <OptionalProtectedRoute><Docs /></OptionalProtectedRoute>
 */
export function OptionalProtectedRoute({ children }: { children: React.ReactNode }) {
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

  // Both authenticated and unauthenticated users can access this page
  // The page component can use useAuth() to check user status if needed
  return <>{children}</>;
}
