import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { testimonialPages, testimonialOverview } from "@/data/testimonialData";
import { ArrowRight, Award, CheckCircle, Globe, Users } from "lucide-react";
import { useEffect } from "react";

export default function Testimonials() {
  useEffect(() => {
    document.title = testimonialOverview.metaTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", testimonialOverview.metaDescription);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = testimonialOverview.metaDescription;
      document.head.appendChild(m);
    }
  }, []);

  const stats = [
    { label: "Certificates Issued", value: testimonialOverview.stats.totalCertificates, icon: Award },
    { label: "Organizations", value: testimonialOverview.stats.organizations, icon: Users },
    { label: "Verification Rate", value: testimonialOverview.stats.verificationRate, icon: CheckCircle },
    { label: "Countries Served", value: testimonialOverview.stats.countriesServed, icon: Globe },
  ];

  return (
    <PublicLayout>
      <section className="py-16 md:py-24 bg-gradient-to-b from-accent to-background">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">Customer Stories</Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {testimonialOverview.heroHeading}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            {testimonialOverview.heroSubheading}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <s.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl md:text-3xl font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 container mx-auto px-4">
        <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Stories by Industry</h2>
        <p className="text-muted-foreground text-center mb-10">Click on an industry to read detailed customer stories</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonialPages.map((page) => (
            <Link key={page.slug} to={`/testimonials/${page.slug}`}>
              <Card className="h-full hover:shadow-lg transition-shadow border-border hover:border-primary/30">
                <CardContent className="p-6">
                  <Badge variant="outline" className="mb-3 text-xs">{page.industry}</Badge>
                  <h3 className="font-semibold text-foreground mb-2">{page.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {page.testimonials[0].quote.slice(0, 120)}...
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{page.testimonials.length} stories</span>
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Join Them?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Start generating professional, verifiable certificates in minutes.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link to="/signup">Get Started Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: testimonialOverview.metaTitle,
            description: testimonialOverview.metaDescription,
            url: "https://trustificate.clicktory.in/testimonials",
          }),
        }}
      />
    </PublicLayout>
  );
}

