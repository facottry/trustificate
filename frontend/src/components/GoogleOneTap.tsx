import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, setAuthToken, getAuthToken } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const GOOGLE_ENABLED = import.meta.env.VITE_ENABLE_GOOGLE_LOGIN === "true";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

/**
 * Renders nothing visible. Loads Google Identity Services and fires
 * One Tap prompt automatically for unauthenticated visitors.
 * Mount once in App.tsx (inside BrowserRouter + AuthProvider).
 */
export function GoogleOneTap() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const prompted = useRef(false);

  const handleCredential = useCallback(
    async (response: any) => {
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
        toast.error(err?.message || "Google sign-in failed");
      }
    },
    [refresh, navigate]
  );

  useEffect(() => {
    // Skip if: feature disabled, no client ID, user already logged in,
    // auth still loading, or we already prompted this session
    if (!GOOGLE_ENABLED || !GOOGLE_CLIENT_ID) return;
    if (loading) return;
    if (user || getAuthToken()) return;
    if (prompted.current) return;

    function initOneTap() {
      const g = (window as any).google;
      if (!g?.accounts?.id) return;

      prompted.current = true;

      g.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
        auto_select: true,       // auto-login if only one Google session
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
      });

      g.accounts.id.prompt();
    }

    // Load GSI script if not already present
    const existing = document.getElementById("google-gsi-script");
    if (!existing) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => initOneTap();
      document.head.appendChild(script);
    } else {
      // Script already loaded (e.g. from login page), just prompt
      setTimeout(initOneTap, 300);
    }
  }, [user, loading, handleCredential]);

  return null;
}
