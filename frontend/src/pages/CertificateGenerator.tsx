import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowRight, CheckCircle2, FileText, Shield, Zap, Globe,
  Palette, QrCode, Download, Lock
} from "lucide-react";

const benefits = [
  { icon: Palette, title: "Template-Driven Design", desc: "Choose from professionally designed templates or create your own with custom branding, logos, and color schemes." },
  { icon: Shield, title: "Tamper-Proof Verification", desc: "Every certificate includes a unique cryptographic ID, QR code, and public verification URL." },
  { icon: Zap, title: "AI-Powered Filling", desc: "AI pre-fills recipient details, body text, and formatting. Issue certificates 10Ã— faster than manual methods." },
  { icon: QrCode, title: "QR Code & Unique URL", desc: "Each certificate gets a scannable QR code and a permanent verification link anyone can check." },
  { icon: Download, title: "PDF Export", desc: "Download high-quality PDFs for printing or email distribution. Branded and professional." },
  { icon: Lock, title: "Audit Trail", desc: "Every issuance, view, and download is logged. Full compliance-ready audit trail." },
];

const steps = [
  { num: "1", title: "Pick a Template", desc: "Select from pre-built certificate designs or create a custom template with your branding." },
  { num: "2", title: "Fill in Details", desc: "Enter recipient name, course, date, and issuer info. AI helps auto-complete fields." },
  { num: "3", title: "Generate & Share", desc: "Click generate. Your certificate gets a unique ID, QR code, and public verification page instantly." },
];

const comparisons = [
  { feature: "Verifiable QR code", us: true, others: false },
  { feature: "Public verification URL", us: true, others: false },
  { feature: "AI-powered form filling", us: true, others: false },
  { feature: "Audit trail & compliance", us: true, others: false },
  { feature: "Bulk issuance (CSV)", us: true, others: false },
  { feature: "Custom branding", us: true, others: true },
  { feature: "PDF export", us: true, others: true },
  { feature: "Free tier available", us: true, others: true },
];

export default function CertificateGeneratorPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Free Certificate Generator â€” Create Verifiable Credentials | TRUSTIFICATE";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Generate tamper-proof, verifiable certificates with QR codes and public verification URLs. Free certificate maker for courses, training, and compliance. No design skills needed.");
  }, []);

  return (
    <PublicLayout>
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "TRUSTIFICATE Certificate Generator",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
        description: "Generate tamper-proof, verifiable certificates with QR codes and public verification URLs.",
        url: "https://trustificate.clicktory.in/certificate-generator",
      }) }} />

      {/* Hero */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/20 pointer-events-none" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 text-xs border border-primary/20 bg-primary/5 text-primary">
              ðŸš€ Free during beta â€” No credit card required
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground leading-[1.1] mb-6">
              Free Certificate Generator
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">with Instant Verification</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              Create professional, tamper-proof certificates in under 60 seconds. Each credential comes with a unique QR code, 
              verification URL, and full audit trail. Used by universities, HR teams, and training providers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <Button size="lg" onClick={() => navigate("/signup")} className="h-12 px-8 text-base shadow-lg shadow-primary/25">
                Create Your First Certificate <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/verify")} className="h-12 px-8 text-base">
                See Live Example
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">No signup needed to verify Â· 50 free certificates/month on Free plan</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 border-t bg-card/50">
        <div className="container">
          <h2 className="text-2xl font-bold text-center mb-12">Generate a certificate in 3 steps</h2>
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {steps.map((s) => (
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
            <h2 className="text-3xl font-bold mb-4">Why TRUSTIFICATE beats Canva & PDF templates</h2>
            <p className="text-muted-foreground">Static PDFs can be forged. TRUSTIFICATE certificates are cryptographically verifiable.</p>
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

      {/* Comparison */}
      <section className="py-16 border-t bg-card/30">
        <div className="container max-w-2xl">
          <h2 className="text-2xl font-bold text-center mb-10">TRUSTIFICATE vs. traditional certificate makers</h2>
          <div className="rounded-xl border overflow-hidden">
            <div className="grid grid-cols-3 bg-muted/50 px-4 py-3 text-xs font-semibold">
              <span>Feature</span>
              <span className="text-center text-primary">TRUSTIFICATE</span>
              <span className="text-center">Others</span>
            </div>
            {comparisons.map((c) => (
              <div key={c.feature} className="grid grid-cols-3 px-4 py-3 border-t text-sm">
                <span>{c.feature}</span>
                <span className="text-center">{c.us ? <CheckCircle2 className="h-4 w-4 text-primary inline" /> : "â€”"}</span>
                <span className="text-center">{c.others ? <CheckCircle2 className="h-4 w-4 text-muted-foreground inline" /> : "â€”"}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="container text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Start generating verifiable certificates today</h2>
          <p className="text-muted-foreground mb-8">Free forever plan available. No credit card. No design skills needed.</p>
          <Button size="lg" onClick={() => navigate("/signup")} className="h-12 px-8 text-base shadow-lg shadow-primary/25">
            Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}

