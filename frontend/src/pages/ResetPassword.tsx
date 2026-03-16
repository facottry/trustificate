import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiClient, setAuthToken } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/PasswordInput";
import { toast } from "sonner";
import logoImg from "@/assets/logo.png";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [otpValidated, setOtpValidated] = useState(false);
  const [step, setStep] = useState<"otp" | "reset">("otp");

  useEffect(() => {
    const urlToken = searchParams.get("token");
    const urlEmail = searchParams.get("email");

    if (urlToken && urlEmail) {
      setToken(urlToken);
      setEmail(urlEmail);
      setStep("reset");
    }
  }, [searchParams]);

  const handleValidateOtp = async () => {
    if (!email) {
      toast.error("Email is required");
      return;
    }
    if (otp.length !== 6 && !token) {
      toast.error("Please enter a 6-digit PIN");
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient<{ token: string; user: any }>("/api/auth/login-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp, token }),
      });

      setAuthToken(data.token);
      setOtpValidated(true);
      setStep("reset");
      toast.success("PIN validated. You can now proceed to reset your password or continue to the dashboard.");
    } catch (error: any) {
      toast.error(error?.message || "Invalid PIN");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await apiClient("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, newPassword: password, otp, token }),
      });
      toast.success("Password updated successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src={logoImg} alt="TRUSTIFICATE" className="h-9 w-9" />
            <span className="text-xl font-bold">TRUSTIFICATE</span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Reset Your Password</CardTitle>
            <CardDescription>
              {step === "otp"
                ? "Enter the PIN you received via email"
                : "Optionally update your password"
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === "otp" ? (
              <form onSubmit={(e) => { e.preventDefault(); handleValidateOtp(); }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp">PIN</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Validating..." : "Validate PIN"}
                </Button>
                {otpValidated && (
                  <Button type="button" className="w-full" variant="secondary" onClick={() => navigate("/dashboard") }>
                    Continue to Dashboard
                  </Button>
                )}
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <PasswordInput id="password" placeholder="Min 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm Password</Label>
                  <PasswordInput id="confirm" placeholder="Repeat password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
                <Button type="button" className="w-full" variant="secondary" onClick={() => navigate("/dashboard") }>
                  Skip and Go to Dashboard
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {step === "otp" && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            If you already have a PIN, validate it to continue. You can reset your password once validated.
          </div>
        )}
      </div>
    </div>
  );
}

