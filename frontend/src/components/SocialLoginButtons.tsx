import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, setAuthToken } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const GOOGLE_ENABLED = import.meta.env.VITE_ENABLE_GOOGLE_LOGIN === "true";
const GITHUB_ENABLED = import.meta.env.VITE_ENABLE_GITHUB_LOGIN === "true";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || "";

const ANY_SOCIAL_ENABLED = GOOGLE_ENABLED || GITHUB_ENABLED;

function GitHubIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

interface SocialLoginButtonsProps {
  mode: "login" | "signup";
}

export function SocialLoginButtons({ mode }: SocialLoginButtonsProps) {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleInitialized = useRef(false);

  const handleSuccess = useCallback(async (data: any) => {
    if (data.token) {
      setAuthToken(data.token);
      await refresh();
      navigate("/dashboard");
    }
  }, [refresh, navigate]);

  // ── Google: render the official GSI button ──────────────
  const handleGoogleCredential = useCallback(
    async (response: any) => {
      setGoogleLoading(true);
      try {
        const { data } = await apiClient<any>("/api/auth/social/google", {
          method: "POST",
          body: JSON.stringify({ credential: response.credential }),
        });
        await handleSuccess(data);
      } catch (err: any) {
        toast.error(err?.message || "Google authentication failed");
      } finally {
        setGoogleLoading(false);
      }
    },
    [handleSuccess]
  );

  useEffect(() => {
    if (!GOOGLE_ENABLED || !GOOGLE_CLIENT_ID || googleInitialized.current) return;

    function initGoogle() {
      const g = (window as any).google;
      if (!g?.accounts?.id || !googleBtnRef.current) return;
      googleInitialized.current = true;

      g.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        use_fedcm_for_prompt: false,
      });

      // Render the official Google button inside our hidden div
      g.accounts.id.renderButton(googleBtnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        width: "100%",
        text: mode === "login" ? "signin_with" : "signup_with",
      });
    }

    const existing = document.getElementById("google-gsi-script");
    if (!existing) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogle();
      document.head.appendChild(script);
    } else {
      // Script already loaded, try init (may need a small delay for re-renders)
      setTimeout(initGoogle, 100);
    }
  }, [handleGoogleCredential, mode]);

  // ── GitHub: OAuth redirect ──────────────────────────────
  const handleGithubClick = () => {
    if (!GITHUB_CLIENT_ID) {
      toast.error("GitHub login is not configured.");
      return;
    }
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const scope = "read:user user:email";
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
  };

  if (!ANY_SOCIAL_ENABLED) return null;

  return (
    <>
      <div className="space-y-2">
        {GOOGLE_ENABLED && (
          <div className="relative">
            {/* Google's rendered button */}
            <div
              ref={googleBtnRef}
              className="flex justify-center [&>div]:!w-full"
            />
            {googleLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded">
                <span className="text-sm text-muted-foreground">Signing in...</span>
              </div>
            )}
          </div>
        )}
        {GITHUB_ENABLED && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGithubClick}
          >
            <GitHubIcon />
            Continue with GitHub
          </Button>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><Separator /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
        </div>
      </div>
    </>
  );
}

/** Hook for handling GitHub OAuth callback */
export function useGithubCallback() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCallback = useCallback(async (code: string) => {
    setLoading(true);
    try {
      const { data } = await apiClient<any>("/api/auth/social/github", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      if (data?.token) {
        setAuthToken(data.token);
        await refresh();
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err?.message || "GitHub authentication failed");
      navigate("/login");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { handleCallback, loading };
}
