import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { Mascot } from "@/components/Mascot";
import { toast } from "sonner";
import { Building2, CheckCircle2, XCircle, Clock, UserPlus } from "lucide-react";

type InviteInfo = {
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  organizationId: { name: string; slug: string; logoUrl?: string };
  invitedBy: { displayName: string; email: string };
};

type State = "loading" | "ready" | "accepting" | "success" | "error";

export default function AcceptInvitePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = params.get("token") || localStorage.getItem("TRUSTIFICATE:pendingInviteToken") || "";

  const [state, setState] = useState<State>("loading");
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setErrorMsg("No invite token provided.");
      setState("error");
      return;
    }
    apiClient<InviteInfo>(`/api/invites/${token}`)
      .then(({ data }) => {
        setInvite(data ?? null);
        setState("ready");
      })
      .catch((err: any) => {
        setErrorMsg(err?.message || "Invite not found or has expired.");
        setState("error");
      });
  }, [token]);

  // Auto-accept if user is already logged in
  useEffect(() => {
    if (state !== "ready" || !user || !token) return;
    setState("accepting");
    apiClient("/api/invites/accept", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
      .then(() => {
        setState("success");
        localStorage.removeItem("TRUSTIFICATE:pendingInviteToken");
        toast.success("You've joined the organization!");
        setTimeout(() => navigate("/dashboard"), 1500);
      })
      .catch((err: any) => {
        setErrorMsg(err?.message || "Failed to accept invite.");
        setState("error");
      });
  }, [state, user, token]);

  const orgName = invite?.organizationId?.name ?? "the organization";
  const inviterName = invite?.invitedBy?.displayName ?? "Someone";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-block mb-4">
            <Logo size="md" />
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center pb-2">
            {state === "loading" && (
              <>
                <Mascot mood="loading" size="md" className="mx-auto mb-2" />
                <CardTitle>Loading invite…</CardTitle>
              </>
            )}
            {state === "ready" && (
              <>
                <Mascot mood="greeting" size="md" className="mx-auto mb-2" />
                <CardTitle>You're invited!</CardTitle>
                <CardDescription>
                  <span className="font-medium">{inviterName}</span> invited you to join{" "}
                  <span className="font-medium">{orgName}</span> on Trustificate.
                </CardDescription>
              </>
            )}
            {state === "accepting" && (
              <>
                <Mascot mood="loading" size="md" className="mx-auto mb-2" />
                <CardTitle>Joining {orgName}…</CardTitle>
              </>
            )}
            {state === "success" && (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <CardTitle>Welcome aboard!</CardTitle>
                <CardDescription>You've joined <span className="font-medium">{orgName}</span>. Redirecting to dashboard…</CardDescription>
              </>
            )}
            {state === "error" && (
              <>
                <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
                <CardTitle>Invite unavailable</CardTitle>
                <CardDescription>{errorMsg}</CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="pt-2 space-y-3">
            {state === "ready" && !user && (
              <>
                <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{orgName}</span>
                  </div>
                  <p className="text-muted-foreground pl-6">Role: <span className="capitalize">{invite?.role}</span></p>
                </div>
                <Button className="w-full" asChild>
                  <Link to={`/signup?invite=${token}`}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create account to join
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/login?redirect=/accept-invite?token=${token}`}>
                    Already have an account? Sign in
                  </Link>
                </Button>
              </>
            )}

            {state === "error" && (
              <Button variant="outline" className="w-full" asChild>
                <Link to="/">Go to homepage</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
