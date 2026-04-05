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

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

// Shared: load GSI script once, resolve when ready
let gsiReady: Promise<void> | null = null;
let gsiInitDone = false;

function loadGsi(): Promise<void> {
  if (gsiReady) return gsiReady;
  gsiReady = new Promise((resolve) => {
    const existing = document.getElementById("google-gsi-script");
    if (existing) {
      if ((window as any).google?.accounts?.id) resolve();
      else existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
  return gsiReady;
}

/** Mark GSI as initialized (called by GoogleOneTap) */
export function markGsiInitialized() { gsiInitDone = true; }

/** Check if GSI was already initialized */
export function isGsiInitialized() { return gsiInitDone; }

interface SocialLoginButtonsProps {
  mode: "login" | "signup";
}

export function SocialLoginButtons({ mode }: SocialLoginButtonsProps) {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const initialized = useRef(false);

  const handleGoogleCredential = useCallback(
    async (response: any) => {
      setGoogleLoading(true);
      try {
        const { data } = await apiClient<any>("/api/auth/social/google", {
          method: "POST",
          body: JSON.stringify({ credential: response.credential }),
        });
        if (data?.token) {
          setAuthToken(data.token);
          await refresh();
          navigate("/dashboard");
        }
      } catch (err: any) {
        toast.error(err?.message || "Google authentication failed");
      } finally {
        setGoogleLoading(false);
      }
    },
    [refresh, navigate]
  );

  // Load GSI script (no initialize — GoogleOneTap handles that)
  useEffect(() => {
    if (!GOOGLE_ENABLED || !GOOGLE_CLIENT_ID) return;
    loadGsi();
  }, []);

  const handleGoogleClick = async () => {
    if (googleLoading) return;
    await loadGsi();
    const g = (window as any).google;
    if (!g?.accounts?.oauth2) {
      toast.error("Google Sign-In is not ready yet. Please try again.");
      return;
    }
    // Use the token client (popup) flow — works reliably everywhere
    const client = g.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "email profile",
      callback: async (tokenResponse: any) => {
        if (tokenResponse.error) {
          if (tokenResponse.error !== "user_cancelled") {
            toast.error("Google sign-in was cancelled");
          }
          return;
        }
        // We have an access token — fetch user info, then send to our backend
        // But our backend expects a credential (ID token), not an access token.
        // So instead, use the ID token flow via prompt as fallback.
        setGoogleLoading(true);
        try {
          // Fetch user info from Google using the access token
          const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          });
          const profile = await res.json();
          // Send profile directly to a dedicated endpoint
          const { data } = await apiClient<any>("/api/auth/social/google", {
            method: "POST",
            body: JSON.stringify({
              accessToken: tokenResponse.access_token,
              profile: {
                email: profile.email,
                name: profile.name,
                sub: profile.sub,
                picture: profile.picture,
              },
            }),
          });
          if (data?.token) {
            setAuthToken(data.token);
            await refresh();
            navigate("/dashboard");
          }
        } catch (err: any) {
          toast.error(err?.message || "Google authentication failed");
        } finally {
          setGoogleLoading(false);
        }
      },
    });
    client.requestAccessToken();
  };

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
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleClick}
            disabled={googleLoading}
          >
            <GoogleIcon />
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </Button>
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
