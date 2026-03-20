import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, AlertCircle, Shield, ShieldCheck, QrCode, FileText, Clock, HelpCircle, ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { Link } from "react-router-dom";
import { Mascot } from "@/components/Mascot";

export default function VerifyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [recentVerifications, setRecentVerifications] = useState<any[]>([]);

  useEffect(() => {
    document.title = "Verify Certificate Online | TRUSTIFICATE";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Instantly verify any TRUSTIFICATE certificate. Enter a certificate number or scan the QR code to check authenticity, status, and issuer details.");

    // Load recent public verifications
    apiClient("/api/certificates?status=issued&limit=5&sort=-createdAt")
      .then((response) => setRecentVerifications(response.data || []))
      .catch(() => setRecentVerifications([]));
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) handleSearch(q);
  }, []);

  const handleSearch = async (q?: string) => {
    const searchTerm = (q || query).trim().toUpperCase();
    if (!searchTerm) return;
    setSearching(true);
    setNotFound(false);

    try {
      const response = await apiClient(`/api/public/verify/${encodeURIComponent(searchTerm)}`);
      if (response.data) {
        navigate(`/certificate/${response.data.slug}`);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const features = [
    { icon: ShieldCheck, title: "Tamper-Proof", desc: "Every certificate is cryptographically secured and linked to its issuing organization." },
    { icon: QrCode, title: "QR Code Scanning", desc: "Scan the QR code on any certificate to instantly open its verification page." },
    { icon: Clock, title: "Real-Time Status", desc: "Check if a certificate is active, revoked, or expired status updates in real time." },
    { icon: FileText, title: "Full Details", desc: "View recipient name, course, issuer, date, and organization details on verification." },
  ];

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-accent to-background">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Mascot mood="idle" size="lg" showMessage={false} className="mb-4" />
            <Badge variant="secondary" className="mb-4">
              <Shield className="h-3 w-3 mr-1" /> Verification Portal
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Verify a Certificate
            </h1>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Enter the certificate number printed on the document to instantly verify its authenticity and view full details.
            </p>

            <form onSubmit={handleSubmit} className="flex gap-2 max-w-lg mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="e.g., CC-2026-A1B2C3D4-E5F6"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setNotFound(false); }}
                  className="pl-9 h-11 font-mono text-sm"
                />
              </div>
              <Button type="submit" className="h-11 px-6" disabled={searching}>
                {searching ? "Searching..." : "Verify"}
              </Button>
            </form>

            {notFound && (
              <Card className="mt-6 border-destructive/20 max-w-lg mx-auto">
                <CardContent className="flex items-center gap-3 py-3">
                  <Mascot mood="notFound" size="sm" showMessage={false} />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Certificate Not Found</p>
                    <p className="text-xs text-muted-foreground">
                      No certificate matches <strong className="font-mono">{query.toUpperCase()}</strong>. Double-check the number and try again.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <p className="mt-6 text-xs text-muted-foreground">
              Certificate numbers follow the format: <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">PREFIX-YEAR-HEXCODE-CHECK</code>
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 container mx-auto px-4">
        <h2 className="text-2xl font-bold text-foreground text-center mb-2">How Verification Works</h2>
        <p className="text-muted-foreground text-center mb-10 max-w-lg mx-auto">
          Our verification system ensures every certificate is authentic, traceable, and tamper-proof.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {features.map((f) => (
            <Card key={f.title} className="border-border">
              <CardContent className="p-5 text-center">
                <f.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1 text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recently Issued (Public Showcase) */}
      {recentVerifications.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground text-center mb-2">Recently Issued Certificates</h2>
            <p className="text-muted-foreground text-center mb-8">
              Browse recently issued and publicly verifiable credentials.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {recentVerifications.map((cert) => (
                <Link key={cert.certificate_number} to={`/certificate/${cert.slug}`}>
                  <Card className="hover:shadow-md transition-shadow border-border hover:border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                          <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-foreground text-sm">{cert.recipient_name}</p>
                      <p className="text-xs text-muted-foreground mb-2">{cert.course_name || cert.training_name || "Certificate"}</p>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="font-mono">{cert.certificate_number.slice(0, 18)}...</span>
                        <span>{new Date(cert.issue_date).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-16 container mx-auto px-4">
        <h2 className="text-2xl font-bold text-foreground text-center mb-8">Verification FAQ</h2>
        <div className="max-w-2xl mx-auto space-y-4">
          {[
            { q: "Where do I find the certificate number?", a: "The certificate number is printed on the certificate document, typically at the top or bottom. It follows the format PREFIX-YEAR-CODE (e.g., CC-2026-A1B2C3D4-E5F6)." },
            { q: "Can I verify using a QR code?", a: "Yes! Every TRUSTIFICATE certificate includes a QR code. Scan it with your phone camera to open the verification page directly." },
            { q: "What if a certificate shows as 'Revoked'?", a: "A revoked certificate means the issuing organization has invalidated it. Contact the issuer for more information." },
            { q: "Is verification free?", a: "Yes, certificate verification is always free and requires no account or login." },
          ].map((item) => (
            <Card key={item.q} className="border-border">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground text-sm mb-1">{item.q}</p>
                    <p className="text-xs text-muted-foreground">{item.a}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Want to Issue Verifiable Certificates?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Start generating professional, tamper-proof certificates with built-in verification in minutes.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg" variant="secondary">
              <Link to="/signup">Get Started Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/docs">API Documentation</Link>
            </Button>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "TRUSTIFICATE Certificate Verification",
            description: "Instantly verify the authenticity of any TRUSTIFICATE certificate online.",
            url: "https://TRUSTIFICATEapp.lovable.app/verify",
            applicationCategory: "BusinessApplication",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          }),
        }}
      />
    </PublicLayout>
  );
}

