import { useParams, Link, Navigate } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { testimonialPages } from "@/data/testimonialData";
import { ArrowLeft, Award, CheckCircle, Quote, Star } from "lucide-react";
import { useEffect } from "react";

export default function TestimonialDetail() {
  const { slug } = useParams<{ slug: string }>();
  const page = testimonialPages.find((p) => p.slug === slug);

  useEffect(() => {
    if (page) {
      document.title = page.metaTitle;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", page.metaDescription);
      else {
        const m = document.createElement("meta");
        m.name = "description";
        m.content = page.metaDescription;
        document.head.appendChild(m);
      }
    }
  }, [page]);

  if (!page) return <Navigate to="/testimonials" replace />;

  return (
    <PublicLayout>
      <section className="py-16 md:py-24 bg-gradient-to-b from-accent to-background">
        <div className="container mx-auto px-4">
          <Link to="/testimonials" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeft className="h-4 w-4" /> All Testimonials
          </Link>
          <Badge variant="secondary" className="mb-4">{page.industry}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{page.heroHeading}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">{page.heroSubheading}</p>
        </div>
      </section>

      <section className="py-16 container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {page.testimonials.map((t, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}, {t.company}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  <Quote className="h-5 w-5 text-primary/40 shrink-0 mt-1" />
                  <p className="text-foreground leading-relaxed">{t.quote}</p>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Key Result</p>
                      <p className="text-sm font-medium text-foreground">{t.result}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Certificates Issued</p>
                      <p className="text-sm font-medium text-foreground">{t.certificatesIssued}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Verification Rate</p>
                      <p className="text-sm font-medium text-foreground">{t.verificationRate}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-12 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-4">Common Use Cases for {page.title}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {page.useCases.map((uc) => (
              <div key={uc} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                <span className="text-foreground">{uc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{page.ctaHeading}</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">{page.ctaDescription}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg" variant="secondary">
              <Link to="/signup">Get Started Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/verify">Verify a Certificate</Link>
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
            name: page.metaTitle,
            description: page.metaDescription,
            url: `https://TRUSTIFICATEapp.lovable.app/testimonials/${page.slug}`,
            review: page.testimonials.map((t) => ({
              "@type": "Review",
              author: { "@type": "Person", name: t.name },
              reviewBody: t.quote,
              reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
            })),
          }),
        }}
      />
    </PublicLayout>
  );
}

