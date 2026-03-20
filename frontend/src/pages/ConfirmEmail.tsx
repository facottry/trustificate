import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { apiClient, setAuthToken } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import logoImg from "@/assets/logo.png";

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const confirmEmail = async () => {
      if (!token) {
        setError("No verification token provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await apiClient<{ token: string; user: any }>(`/api/auth/confirm-email/${token}`, {
          method: "GET",
        });

        if (response.success) {
          // Store the JWT if returned
          if (response.data?.token) {
            setAuthToken(response.data.token);
          }
          localStorage.removeItem('TRUSTIFICATE:pendingVerificationEmail');
          setVerified(true);
          toast.success("Email verified successfully! Redirecting...");
          setTimeout(() => navigate("/"), 2500);
        } else {
          setError("Verification failed. Please try again.");
        }
      } catch (error: any) {
        const errorMessage = error?.message || "Failed to verify email";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    confirmEmail();
  }, [token, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src={logoImg} alt="TRUSTIFICATE" className="h-9 w-9" />
            <span className="text-xl font-bold">TRUSTIFICATE</span>
          </Link>
        </div>

        <Card>
          {loading && (
            <CardHeader className="text-center pt-8">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-4">
                  <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
              </div>
              <CardTitle>Verifying Email...</CardTitle>
              <CardDescription>Please wait while we confirm your email address</CardDescription>
            </CardHeader>
          )}

          {verified && !loading && (
            <>
              <CardHeader className="text-center pt-8">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-green-100 dark:bg-green-900 p-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Email Verified!</CardTitle>
                <CardDescription className="text-base mt-2">
                  Your email has been confirmed successfully.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pb-8">
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-700 dark:text-green-200">
                    Your email has been verified and your account is fully activated!
                  </p>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Redirecting to home page...
                </p>
                <Button onClick={() => navigate("/")} className="w-full">
                  Go to Home
                </Button>
              </CardContent>
            </>
          )}

          {error && !loading && (
            <>
              <CardHeader className="text-center pt-8">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-red-100 dark:bg-red-900 p-4">
                    <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Verification Failed</CardTitle>
                <CardDescription className="text-base mt-2">
                  We couldn't verify your email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pb-8">
                <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4">
                  <p className="text-sm text-red-700 dark:text-red-200">
                    {error}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  This could happen if the link has expired or was already used.
                </p>
                <Button onClick={() => navigate("/signup")} className="w-full">
                  Request New Link
                </Button>
                <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                  Back to Home
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
