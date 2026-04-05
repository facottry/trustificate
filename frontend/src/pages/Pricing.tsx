import { useEffect, useState } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/apiClient";

interface PlanData {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  description: string;
  featureList: string[];
  cta: string;
  ctaVariant: "default" | "outline";
  popular: boolean;
  discount: string | null;
}

export default function Pricing() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient<PlanData[]>("/api/public/plans")
      .then(({ data }) => setPlans(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmtPrice = (p: number) => {
    if (p === 0) return "₹0";
    if (p === -1) return "Custom";
    return `₹${p.toLocaleString("en-IN")}`;
  };

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
              Start free forever. Upgrade when you need more power. Use coupon{" "}
              <span className="font-mono font-semibold text-foreground">FREE_100</span> at checkout for an
              additional 100% off during our launch period.
            </p>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-6">
                  <Skeleton className="h-6 w-24 mb-3" />
                  <Skeleton className="h-10 w-32 mb-4" />
                  <div className="space-y-2">
                    {[...Array(5)].map((_, j) => <Skeleton key={j} className="h-4 w-full" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
              {plans.map((tier) => (
                <div
                  key={tier.id}
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
                      <span className="text-3xl font-bold text-foreground">{fmtPrice(tier.price)}</span>
                      {tier.price > 0 && <span className="text-sm text-muted-foreground">/month</span>}
                      {tier.price === 0 && <span className="text-sm text-muted-foreground">forever</span>}
                    </div>
                    {tier.originalPrice > 0 && tier.originalPrice !== tier.price && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Regular price: <span className="line-through">₹{tier.originalPrice.toLocaleString("en-IN")}/month</span>
                      </p>
                    )}
                    <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>
                  </div>
                  <ul className="mb-8 space-y-3 flex-1">
                    {tier.featureList.map((f) => (
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
                      if (tier.id === "enterprise") navigate("/contact");
                      else if (tier.id === "free") navigate("/signup");
                      else navigate(`/checkout?plan=${tier.id}`);
                    }}
                  >
                    {tier.cta}
                  </Button>
                </div>
              ))}
            </div>
          )}

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
