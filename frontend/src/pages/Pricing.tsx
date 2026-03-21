import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { pricingTiers } from "@/data/siteData";

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <section className="py-20 lg:py-28 bg-brand-hero">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <Badge variant="secondary" className="mb-4 border border-primary/20 bg-primary/5 text-primary text-xs">
              🎉 Launch Offer — 50% off all paid plans
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Start free forever. Upgrade when you need more power. Use coupon <span className="font-mono font-semibold text-foreground">FREE_100</span> at checkout for an additional 100% off during our launch period.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-xl border bg-card p-6 hover:shadow-md transition-all duration-200 ${
                  tier.popular ? "border-primary ring-1 ring-primary shadow-lg shadow-primary/10" : ""
                }`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs">Most Popular</Badge>
                )}
                {tier.discount && (
                  <Badge variant="outline" className="absolute -top-3 right-3 text-[10px] border-green-500/30 text-green-600 bg-green-50 dark:bg-green-950/20">
                    {tier.discount}
                  </Badge>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold">{tier.name}</h3>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">{tier.priceINR}</span>
                    {tier.period && <span className="text-sm text-muted-foreground">{tier.period}</span>}
                  </div>
                  {tier.originalPriceINR && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Regular price: <span className="line-through">{tier.originalPriceINR}/month</span>
                    </p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>
                </div>
                <ul className="mb-8 space-y-3 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={tier.ctaVariant}
                  className="w-full"
                  onClick={() => {
                    if (tier.name === "Enterprise") navigate("/contact");
                    else if (tier.name === "Free") navigate("/signup");
                    else navigate(`/checkout?plan=${tier.name.toLowerCase()}`);
                  }}
                >
                  {tier.cta}
                </Button>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10">Frequently asked questions</h2>
            <div className="space-y-6">
              {[
                { q: "What is the FREE_100 coupon?", a: "During our launch period, we're offering a coupon code FREE_100 that gives you 100% off at checkout. This is automatically applied when you select a paid plan. You complete the full transaction flow — the coupon brings your total to ₹0." },
                { q: "Why not just make plans free?", a: "We believe in running a full transaction flow so you experience the real product. The 50% launch discount is our standard offer, and the FREE_100 coupon is an additional launch gift that won't last forever." },
                { q: "When will the coupon expire?", a: "We'll give at least 30 days notice before deactivating the FREE_100 coupon. Lock in your plan now to get early-adopter benefits." },
                { q: "Can I switch plans later?", a: "Yes. You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle." },
                { q: "What payment methods will you accept?", a: "We'll accept UPI, net banking, debit/credit cards, and wire transfers for Enterprise plans. All prices are in INR (₹)." },
              ].map((faq) => (
                <div key={faq.q} className="border-b pb-6">
                  <h3 className="text-sm font-semibold mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
