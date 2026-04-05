import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, setAuthToken, getAuthToken } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { markGsiInitialized, isGsiInitialized } from "@/components/SocialLoginButtons";

const GOOGLE_ENABLED = import.meta.env.VITE_ENABLE_GOOGLE_LOGIN === "true";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

/**
 * Fires Google One Tap prompt for unauthenticated visitors on ALL pages.
 * Mount once in App.tsx inside BrowserRouter + AuthProvider.
 */
export function GoogleOneTap() {
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const prompted = useRef(false);

  const handleCredential = useCallback(
    async (response: any) => {
      if (!response.credential) return;
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
    if (!GOOGLE_ENABLED || !GOOGLE_CLIENT_ID) return;
    if (loading) return;
    if (user || getAuthToken()) return;
    if (prompted.current) return;

    prompted.current = true;

    function run() {
      const g = (window as any).google;
      if (!g?.accounts?.id) return;

      if (!isGsiInitialized()) {
        g.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredential,
          auto_select: true,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false,
          itp_support: true,
        });
        markGsiInitialized();
      }

      try { g.accounts.id.prompt(); } catch { /* silent */ }
    }

    const existing = document.getElementById("google-gsi-script");
    if (existing && (window as any).google?.accounts?.id) {
      run();
    } else if (!existing) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => setTimeout(run, 50);
      document.head.appendChild(script);
    } else {
      const check = setInterval(() => {
        if ((window as any).google?.accounts?.id) { clearInterval(check); run(); }
      }, 100);
      setTimeout(() => clearInterval(check), 5000);
    }
  }, [user, loading, handleCredential]);

  return null;
}
