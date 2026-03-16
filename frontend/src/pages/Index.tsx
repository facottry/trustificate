import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { Mascot, MascotInline } from "@/components/Mascot";
import {
  Search, Shield, FileText, Globe, Users,
  ArrowRight, Building2, GraduationCap, Briefcase, Lock, Zap, BarChart3
} from "lucide-react";
import { LaunchMarquee } from "@/components/LaunchMarquee";
import { AnnouncementModal } from "@/components/AnnouncementModal";

const features = [
  { icon: FileText, title: "Template-Driven Issuance", description: "Design branded credential blueprints with custom fields. Issue thousands of verifiable documents in minutes, not days." },
  { icon: Shield, title: "Instant Public Verification", description: "Anyone can verify a credential's authenticity in under 3 seconds. No account needed. No phone calls. No waiting." },
  { icon: Globe, title: "Unified Credential Registry", description: "Register and verify credentials from any source â€” internal or external â€” in a single, searchable registry." },
  { icon: Lock, title: "Tamper-Proof by Design", description: "Every credential carries a cryptographic identifier, QR code, and verification URL. Forgery becomes impossible." },
  { icon: Zap, title: "AI-Powered Workflows", description: "Smart form filling, template suggestions, and automated issuance powered by AI. Reduce manual work by 80%." },
  { icon: BarChart3, title: "Compliance & Audit Trails", description: "Track every credential event â€” issuance, verification, revocation. Export audit reports for regulatory requirements." },
];

const useCases = [
  { icon: GraduationCap, title: "Education", desc: "Universities and training institutes issuing diplomas, transcripts, and course certificates at scale." },
  { icon: Building2, title: "Enterprise", desc: "Corporations managing employee certifications, compliance documents, and training completion records." },
  { icon: Briefcase, title: "Professional Bodies", desc: "Industry associations issuing licenses, memberships, accreditations, and continuing education credits." },
  { icon: Users, title: "Government", desc: "Public institutions issuing permits, registrations, and official documents with full traceability." },
];

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const stats = usePlatformStats();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/verify?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const fmt = (val: number) => val === 0 ? "â€”" : val.toLocaleString("en-IN");

  return (
    <PublicLayout>
      <LaunchMarquee />
      <AnnouncementModal />
      {/* Hero */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/20 pointer-events-none" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <Mascot mood="proud" size="xl" showMessage={false} className="mb-6" />
            <Badge variant="secondary" className="mb-6 text-xs font-medium tracking-wide border border-primary/20 bg-primary/5 text-primary">
              Enterprise-Grade Infrastructure
            </Badge>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground leading-[1.1]">
              The trust layer for
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">digital credentials.</span>
            </h1>
            <p className="mb-10 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Issue, manage, and verify credentials at scale. Trusted by universities, certification bodies, and enterprises to eliminate document fraud.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Button size="lg" onClick={() => navigate("/signup")} className="h-12 px-8 text-base shadow-lg shadow-primary/25">
                Start Issuing Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/contact")} className="h-12 px-8 text-base">
                Talk to Sales
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              No credit card required Â· SOC 2 compliant Â· 99.9% uptime SLA
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 border-t border-b bg-card/50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: fmt(stats.credentialsIssued), label: "Credentials Issued" },
              { value: fmt(stats.organizations), label: "Organizations" },
              { value: "99.9%", label: "Uptime SLA" },
              { value: fmt(stats.verifications), label: "Verifications" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-foreground">
                  {stats.loading ? <span className="inline-block h-8 w-16 rounded bg-muted animate-pulse" /> : s.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verify */}
      <section className="py-16 bg-gradient-to-r from-primary/5 to-accent/10">
        <div className="container">
          <div className="mx-auto max-w-xl text-center">
            <MascotInline className="h-8 w-8 mx-auto mb-3" />
            <h2 className="text-2xl font-bold mb-3">Verify a Credential</h2>
            <p className="text-sm text-muted-foreground mb-6">Enter a certificate number to instantly check its authenticity.</p>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="e.g. CERT-2026-A3F8B1C2-9D4E" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-11" />
              </div>
              <Button type="submit" className="h-11">Verify</Button>
            </form>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-24">
        <div className="container">
          <div className="mb-14 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Everything you need for credential trust</h2>
            <p className="text-muted-foreground leading-relaxed">From template design to public verification â€” TRUSTIFICATE is the complete infrastructure for credential management.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {features.map((f) => (
              <div key={f.title} className="group p-6 rounded-xl border bg-card hover:shadow-md hover:border-primary/30 transition-all duration-200">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 border-t bg-card/30">
        <div className="container">
          <div className="mb-14 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Built for institutions that matter</h2>
            <p className="text-muted-foreground leading-relaxed">From universities to government agencies, TRUSTIFICATE serves organizations where credential authenticity is mission-critical.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {useCases.map((uc) => (
              <div key={uc.title} className="p-6 rounded-xl border bg-card text-center hover:shadow-md transition-all duration-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
                  <uc.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-sm font-semibold mb-2">{uc.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container">
          <div className="mb-14 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Three steps to trusted credentials</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Design Your Template", desc: "Create branded credential blueprints with your logo, colors, and required fields. AI helps write professional body text." },
              { step: "2", title: "Issue Credentials", desc: "Generate verifiable credentials with cryptographic IDs, QR codes, and public verification URLs. AI pre-fills forms for speed." },
              { step: "3", title: "Verify Anywhere", desc: "Anyone can verify authenticity instantly via your public verification portal. No account needed. Works globally, 24/7." },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-sm mx-auto mb-4 shadow-md shadow-primary/20">
                  {s.step}
                </div>
                <h3 className="text-base font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mascot + CTA */}
      <section className="py-20 border-t bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <Mascot mood="proud" size="xl" showMessage={false} className="mb-6" />
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Ready to make your credentials unforgeable?
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Join organizations using TRUSTIFICATE to issue, manage, and verify credentials. Free during beta â€” start now.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate("/signup")} className="h-12 px-8 text-base shadow-lg shadow-primary/25">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/pricing")} className="h-12 px-8 text-base">
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

