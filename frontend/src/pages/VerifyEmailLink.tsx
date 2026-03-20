import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { apiClient } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Clock, RotateCw, CheckCircle2 } from "lucide-react";
import logoImg from "@/assets/logo.png";

export default function VerifyEmailLinkPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const storedEmail = localStorage.getItem('TRUSTIFICATE:pendingVerificationEmail');
  const email = location.state?.email || new URLSearchParams(location.search).get("email") || storedEmail || "";
  const displayName = location.state?.displayName || "";
  
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); // 24 hours in seconds
  const [isVerified, setIsVerified] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Check email verification status periodically
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setCheckingStatus(true);
        const response = await apiClient(`/api/auth/email-status?email=${encodeURIComponent(email)}`, {
          method: "GET",
        });
        if (response.data?.isEmailVerified) {
          setIsVerified(true);
          toast.success("Email verified! Redirecting to login...");
          setTimeout(() => navigate("/login"), 2000);
        }
      } catch (error) {
        // User might not be authenticated yet, that's ok
      } finally {
        setCheckingStatus(false);
      }
    };

    // Check every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleResendLink = async () => {
    if (!email) {
      toast.error("Email not found. Please sign up again.");
      return;
    }

    setLoading(true);
    try {
      await apiClient("/api/auth/resend-verification-link", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      toast.success("Verification link sent! Check your email.");
      setResendCooldown(60); // 60 second cooldown
      setTimeLeft(24 * 60 * 60); // Reset timer
    } catch (error: any) {
      toast.error(error?.message || "Failed to resend link");
    } finally {
      setLoading(false);
    }
  };

  if (isVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center pt-8">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-4">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <CardTitle>Email Verified!</CardTitle>
              <CardDescription>Your email has been confirmed successfully</CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <p className="text-sm text-muted-foreground mb-4">
                You can now log in to your account.
              </p>
              <Button onClick={() => navigate("/login")} className="w-full">
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          <CardHeader className="text-center pt-8">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-4">
                <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <CardDescription className="text-base mt-2">
              We've sent a verification link to:
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            {/* Email Display */}
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="font-semibold text-sm">{email}</p>
              {displayName && <p className="text-xs text-muted-foreground mt-1">{displayName}</p>}
            </div>

            {/* Welcome Message */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Please click the verification link in the email to confirm your account.
              </p>
              <p className="text-xs text-muted-foreground">
                The link will remain valid for 24 hours.
              </p>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-950 rounded-lg p-3">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-200">
                  Expires in: {formatTime(timeLeft)}
                </p>
                {timeLeft < 3600 && (
                  <p className="text-xs text-amber-600 dark:text-amber-300">
                    Link expiring soon. Request a new one if needed.
                  </p>
                )}
              </div>
            </div>

            {/* Resend Button */}
            <Button
              onClick={handleResendLink}
              disabled={loading || resendCooldown > 0}
              variant="outline"
              className="w-full"
            >
              {resendCooldown > 0 ? (
                <>
                  <RotateCw className="h-4 w-4 mr-2" />
                  Resend in {resendCooldown}s
                </>
              ) : (
                <>
                  <RotateCw className="h-4 w-4 mr-2" />
                  {loading ? "Sending..." : "Resend Verification Link"}
                </>
              )}
            </Button>

            {/* Didn't receive email */}
            <div className="text-center space-y-2 border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Didn't receive the email?
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Check your spam folder</li>
                <li>• Make sure the email is correct</li>
                <li>• Try resending the link above</li>
              </ul>
            </div>

            {/* Help */}
            <Button variant="ghost" className="w-full text-xs" asChild>
              <Link to="/contact">Need help? Contact support</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Status indicator */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          {checkingStatus ? "Checking verification status..." : "Checking status every 5 seconds"}
        </p>
      </div>
    </div>
  );
}
