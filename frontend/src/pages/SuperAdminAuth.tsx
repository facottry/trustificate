import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient, setAuthToken } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PasswordInput } from "@/components/PasswordInput";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Shield } from "lucide-react";

export default function SuperAdminAuth() {
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const { data } = await apiClient<{
        token?: string;
        user: { isEmailVerified: boolean; email: string; displayName: string; role: string };
        emailVerificationPending?: boolean;
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      if (data.emailVerificationPending || !data.user.isEmailVerified) {
        localStorage.setItem("TRUSTIFICATE:pendingVerificationEmail", data.user.email);
        toast.info("Please verify your email to complete login");
        navigate("/verify-email-link", { state: { email: data.user.email, displayName: data.user.displayName } });
        return;
      }

      if (data.user.role !== "admin") {
        toast.error("Access denied. This portal is for super admins only.");
        return;
      }

      if (data.token) {
        setAuthToken(data.token);
        await refresh();
        navigate("/super-admin");
      }
    } catch (err: any) {
      toast.error(err?.message || "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSignupLoading(true);
    try {
      await apiClient("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ displayName: signupName, email: signupEmail, password: signupPassword }),
      });
      toast.success("Account created! Please check your email for verification.");
      localStorage.setItem("TRUSTIFICATE:pendingVerificationEmail", signupEmail);
      navigate("/verify-email-link", { state: { email: signupEmail, displayName: signupName } });
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Shield className="h-10 w-10 text-primary" />
            </div>
          </div>
          <Link to="/" className="inline-block">
            <Logo size="md" />
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">Super Admin Portal</p>
        </div>

        <Card>
          <Tabs defaultValue="signin">
            <CardHeader className="pb-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="signin" className="mt-0 space-y-4">
                <CardDescription className="text-center">Sign in to the admin dashboard</CardDescription>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="admin@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Password</Label>
                      <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
                    </div>
                    <PasswordInput id="login-password" placeholder="Enter your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loginLoading}>
                    {loginLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0 space-y-4">
                <CardDescription className="text-center">Create a new admin account</CardDescription>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input id="signup-name" placeholder="Your name" value={signupName} onChange={(e) => setSignupName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" placeholder="admin@example.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <PasswordInput id="signup-password" placeholder="Min 6 characters" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full" disabled={signupLoading}>
                    {signupLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Not a super admin?{" "}
          <Link to="/login" className="text-primary hover:underline">Go to regular login</Link>
        </p>
      </div>
    </div>
  );
}
