import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Zap, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan?: string;
  metric?: string;
  usage?: number;
  limit?: number;
}

const PLAN_HIGHLIGHTS: Record<string, { price: string; features: string[] }> = {
  Starter: {
    price: "₹999/mo",
    features: [
      "500 credentials per month",
      "10 templates",
      "Custom branding",
      "CSV bulk import",
      "REST API access",
    ],
  },
  Pro: {
    price: "₹3,499/mo",
    features: [
      "10,000+ credentials/month",
      "10,000+ templates",
      "AI-powered assistance",
      "Webhook integrations",
      "Priority support",
    ],
  },
  Enterprise: {
    price: "Custom",
    features: [
      "Everything in Pro",
      "SSO / SAML authentication",
      "Dedicated account manager",
      "Custom SLA guarantee",
      "SOC 2 Type II report",
    ],
  },
};

function getNextPlan(current?: string): string {
  if (!current || current === "Free") return "Starter";
  if (current === "Starter") return "Pro";
  return "Enterprise";
}

export function UpgradeModal({ open, onOpenChange, currentPlan, metric, usage, limit }: UpgradeModalProps) {
  const next = getNextPlan(currentPlan);
  const info = PLAN_HIGHLIGHTS[next];
  const navigate = useNavigate();

  const hasUsageInfo = metric && usage !== undefined && limit !== undefined && limit > 0;
  const usagePercent = hasUsageInfo ? Math.min(Math.round((usage / limit) * 100), 100) : 0;
  const remaining = hasUsageInfo ? Math.max(limit - usage, 0) : 0;
  const atLimit = hasUsageInfo && usage >= limit;
  const metricLabel = metric?.replace(/_/g, " ") ?? "";
  const showFreeCoupon = (!currentPlan || currentPlan === "Free") && next === "Starter";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {atLimit ? (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <Zap className="h-5 w-5 text-primary" />
            )}
            {atLimit ? "You've reached your limit" : `Upgrade to ${next}`}
          </DialogTitle>
          <DialogDescription>
            {hasUsageInfo
              ? atLimit
                ? `You've used all ${limit} ${metricLabel} available on the ${currentPlan ?? "Free"} plan this month.`
                : `You've used ${usage} of ${limit} ${metricLabel} this month — ${remaining} remaining.`
              : "Unlock more capacity and features for your team."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {hasUsageInfo && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{metricLabel}</span>
                <span>{usage} / {limit}</span>
              </div>
              <Progress
                value={usagePercent}
                className={`h-2 ${atLimit ? "[&>div]:bg-destructive" : usagePercent >= 80 ? "[&>div]:bg-yellow-500" : ""}`}
              />
            </div>
          )}

          <div className="flex items-baseline justify-between">
            <div>
              <Badge variant="secondary" className="text-xs mb-1">
                {next} Plan
              </Badge>
              <p className="text-2xl font-bold">{info?.price}</p>
              {showFreeCoupon && (
                <p className="text-xs text-green-600">Use code FREE_100 to get Starter for free</p>
              )}
            </div>
            {currentPlan && (
              <span className="text-xs text-muted-foreground">
                Current: {currentPlan}
              </span>
            )}
          </div>

          <ul className="space-y-2">
            {info?.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={() => {
              onOpenChange(false);
              navigate(`/checkout?plan=${next.toLowerCase()}`);
            }}>
              {atLimit ? "Upgrade Now — Unlock More" : "Upgrade Now"}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
