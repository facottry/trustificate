import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/PasswordInput";
import { SocialLoginButtons } from "@/components/SocialLoginButtons";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Mascot } from "@/components/Mascot";

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite") || "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await apiClient('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ displayName: name, email, password }),
      });
      toast.success('Account created! Please check your email for verification.');
      localStorage.setItem('TRUSTIFICATE:pendingVerificationEmail', email);
      if (inviteToken) {
        localStorage.setItem('TRUSTIFICATE:pendingInviteToken', inviteToken);
      }
      navigate('/verify-email-link', { state: { email, displayName: name, inviteToken: inviteToken || undefined } });
    } catch (err: any) {
      toast.error(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Mascot mood="greeting" size="lg" message="Let's get you started!" className="mb-4" />
          <Link to="/" className="inline-block">
            <Logo size="md" />
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Create your account</CardTitle>
            <CardDescription>
              {inviteToken
                ? "Create an account to accept your team invite"
                : "Start issuing verifiable credentials in minutes"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SocialLoginButtons mode="signup" />

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput id="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
