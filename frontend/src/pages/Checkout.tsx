import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Tag, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PlanData {
  id: string; name: string; price: number; originalPrice: number;
  description: string; featureList: string[]; cta: string; ctaVariant: string;
  popular: boolean; discount: string | null;
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const planSlug = searchParams.get("plan");
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [tier, setTier] = useState<PlanData | null>(null);
  const [plansLoading, setPlansLoading] = useState(true);

  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [validating, setValidating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  // Fetch plan data from API
  useEffect(() => {
    if (!planSlug) { setPlansLoading(false); return; }
    apiClient<PlanData[]>("/api/public/plans")
      .then(({ data }) => {
        const found = (data || []).find((p: PlanData) => p.id === planSlug || p.name.toLowerCase() === planSlug);
        setTier(found || null);
      })
      .catch(() => {})
      .finally(() => setPlansLoading(false));
  }, [planSlug]);

  const originalPrice = tier?.originalPrice || 0;
  const discountedPrice = tier?.price || 0;
  const couponAmount = couponApplied ? Math.round(discountedPrice * (couponDiscount / 100)) : 0;
  const finalAmount = discountedPrice - couponAmount;

  // Pre-fill FREE_100 coupon for starter plan and auto-apply
  useEffect(() => {
    if (tier && tier.name.toLowerCase() === "starter") {
      setCouponCode("FREE_100");
    }
  }, [tier]);

  useEffect(() => {
    if (couponCode === "FREE_100" && !couponApplied && tier) {
      handleApplyCoupon();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponCode]);

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setValidating(true);
    setCouponError("");

    try {
      const res = await apiClient<{ valid: boolean; discount_percent?: number; code?: string; error?: string }>(
        "/api/coupons/validate",
        { method: "POST", body: JSON.stringify({ code: couponCode.trim() }) }
      );

      const result = res.data;
      if (result?.valid) {
        setCouponApplied(true);
        setCouponDiscount(result.discount_percent || 0);
        toast.success(`Coupon ${result.code} applied — ${result.discount_percent}% off!`);
      } else {
        setCouponError(result?.error || "Invalid coupon");
        setCouponApplied(false);
      }
    } catch (err: any) {
      setCouponError(err.message || "Failed to validate coupon");
    } finally {
      setValidating(false);
    }
  }

  async function handleCompleteOrder() {
    const orgId = user?.organizationId || profile?.organization_id;
    if (!user || !orgId || !tier) {
      toast.error("Please log in to complete your purchase.");
      navigate("/login");
      return;
    }

    setProcessing(true);
    try {
      const res = await apiClient<any>(
        `/api/organizations/${orgId}/plan`,
        {
          method: "POST",
          body: JSON.stringify({
            plan: tier.id || tier.name.toLowerCase(),
            couponCode: couponApplied ? couponCode.toUpperCase() : undefined,
          }),
        }
      );

      setOrderData(res.data);
      setOrderComplete(true);
      toast.success("Order completed successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to process order");
    } finally {
      setProcessing(false);
    }
  }

  // Enterprise plan — show contact sales screen
  if (planSlug === "enterprise" || tier?.id === "enterprise" || tier?.name === "Enterprise") {
    return (
      <PublicLayout>
        <section className="py-20 lg:py-28 bg-brand-hero">
          <div className="container">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Enterprise Plan</h1>
              <p className="text-muted-foreground mb-6">
                Enterprise pricing is custom. Get unlimited certificates, dedicated support, SSO, and a tailored onboarding experience.
              </p>
              <Card className="text-left mb-6">
                <CardContent className="pt-4 space-y-2 text-sm">
                  {[
                    "Unlimited certificates & templates",
                    "Team collaboration (unlimited members)",
                    "Priority support & SLA",
                    "Custom branding & white-label",
                    "API access & webhooks",
                    "Audit logs & compliance exports",
                  ].map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <div className="flex flex-col gap-3">
                <Button className="w-full h-11" asChild>
                  <a href="mailto:sales@trustificate.com?subject=Enterprise Plan Inquiry">Contact Sales</a>
                </Button>
                <Button variant="outline" onClick={() => navigate("/pricing")}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back to Pricing
                </Button>
              </div>
            </div>
          </div>
        </section>
      </PublicLayout>
    );
  }

  // Redirect if plan param is missing or invalid (Free plan has no checkout)
  if (!plansLoading && (!planSlug || !tier || tier.id === "free" || tier.name === "Free")) {
    navigate("/pricing");
    return null;
  }

  if (plansLoading) {
    return (
      <PublicLayout>
        <section className="py-20 lg:py-28 bg-brand-hero">
          <div className="container flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </section>
      </PublicLayout>
    );
  }

  if (orderComplete) {
    const displayOrderId = orderData?._id
      ? String(orderData._id).slice(0, 8).toUpperCase()
      : "—";

    return (
      <PublicLayout>
        <section className="py-20 lg:py-28 bg-brand-hero">
          <div className="container">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
              <p className="text-muted-foreground mb-2">
                Your <span className="font-semibold text-foreground">{tier.name}</span> plan is now active.
              </p>
              <p className="text-xs text-muted-foreground mb-6 font-mono">
                Order ID: {displayOrderId}
              </p>

              <Card className="text-left mb-6">
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium">{tier.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original Price</span>
                    <span className="line-through text-muted-foreground">₹{originalPrice.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Launch Discount (50%)</span>
                    <span className="text-green-600">-₹{(originalPrice - discountedPrice).toLocaleString("en-IN")}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coupon ({couponCode})</span>
                      <span className="text-green-600">-₹{couponAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total Paid</span>
                    <span>₹{finalAmount.toLocaleString("en-IN")}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
                <Button variant="outline" onClick={() => navigate("/documents/new")}>Issue First Certificate</Button>
              </div>
            </div>
          </div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <section className="py-20 lg:py-28 bg-brand-hero">
        <div className="container">
          <div className="mx-auto max-w-lg">
            <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate("/pricing")}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Pricing
            </Button>

            <h1 className="text-2xl font-bold mb-1">Checkout</h1>
            <p className="text-sm text-muted-foreground mb-8">Complete your subscription to the {tier.name} plan.</p>

            {/* Plan Summary */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Order Summary
                  <Badge variant="secondary" className="text-xs">{tier.name} Plan</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{tier.name} Plan (monthly)</span>
                  <span className="line-through text-muted-foreground">₹{originalPrice.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Launch Discount (50% off)</span>
                  <span>-₹{(originalPrice - discountedPrice).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{discountedPrice.toLocaleString("en-IN")}</span>
                </div>

                <Separator />

                {/* Coupon */}
                <div className="space-y-2">
                  <label className="text-xs font-medium flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponApplied(false);
                        setCouponError("");
                      }}
                      placeholder="Enter coupon code"
                      className="font-mono text-sm h-9"
                      disabled={couponApplied}
                    />
                    {couponApplied ? (
                      <Badge variant="outline" className="shrink-0 text-green-600 border-green-300 bg-green-50 dark:bg-green-950/20 h-9 px-3 flex items-center">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Applied
                      </Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="h-9 shrink-0" onClick={handleApplyCoupon} disabled={validating}>
                        {validating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Apply"}
                      </Button>
                    )}
                  </div>
                  {couponError && <p className="text-xs text-destructive">{couponError}</p>}
                  {couponApplied && (
                    <p className="text-xs text-green-600">🎉 {couponDiscount}% off applied with {couponCode}</p>
                  )}
                  {tier.name.toLowerCase() === "starter" && !couponApplied && !couponError && (
                    <p className="text-xs text-muted-foreground">💡 Tip: Use coupon <span className="font-mono font-semibold">FREE_100</span> to get this plan for free!</p>
                  )}
                </div>

                {couponApplied && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount ({couponDiscount}%)</span>
                    <span>-₹{couponAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>₹{finalAmount.toLocaleString("en-IN")}</span>
                </div>
                {finalAmount === 0 && (
                  <p className="text-xs text-green-600 text-center">🎉 Your total is ₹0 — no payment required!</p>
                )}
              </CardContent>
            </Card>

            {/* Security note */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Your transaction is recorded securely. All plan features activate immediately.</span>
            </div>

            {/* Complete Order */}
            <Button
              className="w-full h-12 text-base"
              onClick={handleCompleteOrder}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : finalAmount === 0 ? (
                "Activate Plan — Free"
              ) : (
                `Pay ₹${finalAmount.toLocaleString("en-IN")}`
              )}
            </Button>

            {!user && (
              <p className="text-xs text-center text-muted-foreground mt-4">
                You'll need to{" "}
                <Button variant="link" className="p-0 h-auto text-xs" onClick={() => navigate("/login")}>
                  log in
                </Button>{" "}
                or{" "}
                <Button variant="link" className="p-0 h-auto text-xs" onClick={() => navigate("/signup")}>
                  create an account
                </Button>{" "}
                to complete checkout.
              </p>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
