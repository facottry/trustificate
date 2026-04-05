import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useGithubCallback } from "@/components/SocialLoginButtons";

export default function GitHubCallback() {
  const [searchParams] = useSearchParams();
  const { handleCallback, loading } = useGithubCallback();
  const called = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code && !called.current) {
      called.current = true;
      handleCallback(code);
    }
  }, [searchParams, handleCallback]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">
          {loading ? "Completing GitHub sign-in..." : "Redirecting..."}
        </p>
      </div>
    </div>
  );
}
