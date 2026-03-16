import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowRight, Search, Shield, Globe, QrCode,
  Clock, Lock, CheckCircle2, FileText, Users
} from "lucide-react";

const benefits = [
  { icon: Clock, title: "Instant Results", desc: "Verification completes in under 3 seconds. No waiting, no phone calls, no manual checks." },
  { icon: Globe, title: "No Account Required", desc: "Anyone â€” employers, universities, regulators â€” can verify a credential without creating an account." },
  { icon: QrCode, title: "QR Code Scanning", desc: "Scan the QR code on any TRUSTIFICATE certificate to instantly open its verification page." },
  { icon: Shield, title: "Tamper-Proof", desc: "Cryptographic identifiers make forgery impossible. If it's been altered, verification will fail." },
  { icon: Lock, title: "Revocation Aware", desc: "If a certificate has been revoked, the verification page shows it immediately. No stale data." },
  { icon: FileText, title: "Full Details", desc: "Verification shows recipient name, course, issuer, date, and status â€” everything needed for due diligence." },
];

const audiences = [
  { icon: Users, title: "HR & Recruiters", desc: "Verify candidate certifications before making hiring decisions. Eliminate resume fraud." },
  { icon: Shield, title: "Compliance Officers", desc: "Confirm employee training certifications are genuine and current for audit readiness." },
  { icon: Globe, title: "Universities", desc: "Allow other institutions to verify your graduates' credentials without manual requests." },
  { icon: FileText, title: "Background Check Firms", desc: "Integrate credential verification into your screening workflows via API." },
];

export default function VerifyCertificateOnlinePage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Verify Certificate Online â€” Instant Credential Authentication | TRUSTIFICATE";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Verify any certificate online in seconds. Enter a certificate number or scan a QR code to instantly authenticate credentials. Free, no account needed.");
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) navigate(`/verify?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "TRUSTIFICATE Certificate Verification",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
        description: "Verify any certificate online in seconds. Free, no account needed.",
        url: "https://TRUSTIFICATEapp.lovable.app/verify-certificate-online",
      }) }} />

      {/* Hero */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/20 pointer-events-none" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 text-xs border border-primary/20 bg-primary/5 text-primary">
              ðŸ” Free Â· No account needed Â· Instant results
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground leading-[1.1] mb-6">
              Verify Any Certificate
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Online in Seconds</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              Enter a certificate number or scan a QR code to instantly verify the authenticity of any TRUSTIFICATE credential.
              No account required. Results in under 3 seconds.
            </p>

            {/* Verification search */}
            <form onSubmit={handleVerify} className="flex gap-2 max-w-lg mx-auto mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Enter certificate number (e.g. CERT-2026-A3F8B1C2)" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 h-12" />
              </div>
              <Button type="submit" className="h-12 px-6">Verify Now</Button>
            </form>
            <p className="text-xs text-muted-foreground">Or scan the QR code on any TRUSTIFICATE certificate</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 border-t bg-card/50">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-12">How online verification works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { num: "1", title: "Enter or Scan", desc: "Type the certificate number into the search box, or scan the QR code with your phone camera." },
              { num: "2", title: "Instant Lookup", desc: "We check the credential against our cryptographic registry in real time." },
              { num: "3", title: "See Full Details", desc: "View recipient, issuer, date, status, and whether it's been revoked â€” all instantly." },
            ].map((s) => (
              <div key={s.num} className="text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold mx-auto mb-4 shadow-md shadow-primary/20">
                  {s.num}
                </div>
                <h3 className="text-base font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Why trust TRUSTIFICATE verification?</h2>
            <p className="text-muted-foreground">Credentials verified through TRUSTIFICATE are cryptographically signed and tamper-proof.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {benefits.map((b) => (
              <div key={b.title} className="group p-6 rounded-xl border bg-card hover:shadow-md hover:border-primary/30 transition-all">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who uses this */}
      <section className="py-16 border-t bg-card/30">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-10">Who verifies credentials online?</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {audiences.map((a) => (
              <div key={a.title} className="flex gap-4 p-6 rounded-xl border bg-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <a.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">{a.title}</h3>
                  <p className="text-sm text-muted-foreground">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="container text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Want to issue verifiable credentials?</h2>
          <p className="text-muted-foreground mb-8">Start issuing tamper-proof certificates that anyone can verify online. Free during beta.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate("/signup")} className="h-12 px-8 text-base shadow-lg shadow-primary/25">
              Start Issuing Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/certificate-generator")} className="h-12 px-8 text-base">
              Certificate Generator â†’
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

