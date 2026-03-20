import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, CheckCircle2, Upload, FileSpreadsheet, Shield,
  Clock, Zap, BarChart3, AlertCircle
} from "lucide-react";

const benefits = [
  { icon: FileSpreadsheet, title: "CSV Upload", desc: "Upload a spreadsheet with recipient names, emails, courses, and dates. We handle the rest." },
  { icon: Zap, title: "1,000+ in Minutes", desc: "Issue hundreds or thousands of certificates in a single batch. No manual entry needed." },
  { icon: Shield, title: "Each One Verifiable", desc: "Every bulk-issued certificate gets its own unique ID, QR code, and public verification page." },
  { icon: Clock, title: "Template-Locked", desc: "Select a template once. All certificates in the batch inherit the same design and branding." },
  { icon: BarChart3, title: "Success Report", desc: "Get a detailed report showing which certificates were issued, which failed, and why." },
  { icon: AlertCircle, title: "Validation Pre-Check", desc: "We validate every row before issuing missing names, bad emails, and duplicates are flagged upfront." },
];

const steps = [
  { num: "1", title: "Choose Template", desc: "Pick from your existing templates or create a new branded design." },
  { num: "2", title: "Upload CSV", desc: "Download our sample CSV, fill in your data, and upload. We validate instantly." },
  { num: "3", title: "Review & Issue", desc: "Preview the parsed data, fix any warnings, and click 'Issue All'. Done." },
];

const useCases = [
  { title: "Universities", desc: "Issue graduation certificates for entire batches of students at once." },
  { title: "HR & Training", desc: "Certify employees who completed compliance or professional development programs." },
  { title: "Bootcamps", desc: "Issue completion certificates to cohorts of 50500 graduates." },
  { title: "Conferences", desc: "Generate attendance or speaker certificates for all event participants." },
];

export default function BulkCertificateGeneratorPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Bulk Certificate Generator Issue 1000s of Credentials via CSV | TRUSTIFICATE";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Bulk issue verifiable certificates from a CSV file. Upload a spreadsheet, select a template, and generate thousands of tamper-proof credentials in minutes.");
  }, []);

  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "TRUSTIFICATE Bulk Certificate Generator",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
        description: "Bulk issue verifiable certificates from a CSV file.",
        url: "https://trustificate.clicktory.in/bulk-certificate-generator",
      }) }} />

      {/* Hero */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/20 pointer-events-none" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 text-xs border border-primary/20 bg-primary/5 text-primary">
              ðŸ“Š CSV Upload → Instant Issuance
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground leading-[1.1] mb-6">
              Bulk Certificate Generator
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Issue Thousands via CSV</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              Upload a spreadsheet, select a template, and generate thousands of individually verifiable certificates in minutes.
              Each one gets its own QR code, unique ID, and public verification page.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <Button size="lg" onClick={() => navigate("/signup")} className="h-12 px-8 text-base shadow-lg shadow-primary/25">
                Try Bulk Issuance Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/certificate-generator")} className="h-12 px-8 text-base">
                Single Certificate →
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Free during beta · Unlimited bulk issuance on Pro plan</p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 border-t bg-card/50">
        <div className="container">
          <h2 className="text-2xl font-bold text-center mb-12">How bulk issuance works</h2>
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
            <h2 className="text-3xl font-bold mb-4">Built for scale, designed for trust</h2>
            <p className="text-muted-foreground">Every certificate in a bulk batch is individually verifiable not just a pretty PDF.</p>
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

      {/* Use Cases */}
      <section className="py-16 border-t bg-card/30">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-10">Who uses bulk issuance?</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {useCases.map((uc) => (
              <div key={uc.title} className="p-6 rounded-xl border bg-card">
                <h3 className="text-sm font-semibold mb-1">{uc.title}</h3>
                <p className="text-sm text-muted-foreground">{uc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="container text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Issue your first bulk batch today</h2>
          <p className="text-muted-foreground mb-8">Upload a CSV. Get verified certificates. It's that simple.</p>
          <Button size="lg" onClick={() => navigate("/signup")} className="h-12 px-8 text-base shadow-lg shadow-primary/25">
            Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}

