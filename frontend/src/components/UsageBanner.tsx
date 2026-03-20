import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UsageBannerProps {
  metric: string;
  usage: number;
  limit: number;
  planName?: string;
}

function getNextPlanId(current?: string): string {
  const lower = (current ?? "free").toLowerCase();
  if (lower === "free") return "starter";
  if (lower === "starter") return "pro";
  return "enterprise";
}

export function UsageBanner({ metric, usage, limit, planName }: UsageBannerProps) {
  const navigate = useNavigate();

  // Don't show for unlimited plans or zero/negative limits
  if (limit <= 0) return null;

  const percent = Math.round((usage / limit) * 100);
  const label = metric.replace(/_/g, " ");

  if (percent < 80) return null;

  const isAtLimit = percent >= 100;
  const nextPlan = getNextPlanId(planName);

  if (isAtLimit) {
    return (
      <Alert variant="destructive" className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 shrink-0" />
          <AlertDescription className="text-sm">
            You've reached your {label} limit ({usage}/{limit}). Upgrade now to continue issuing certificates.
          </AlertDescription>
        </div>
        <Button
          size="sm"
          variant="default"
          className="ml-3 shrink-0"
          onClick={() => navigate(`/checkout?plan=${nextPlan}`)}
        >
          Upgrade
        </Button>
      </Alert>
    );
  }

  return (
    <Alert
      variant="default"
      className="flex items-center justify-between border-yellow-500/50 bg-yellow-50 text-yellow-900 dark:bg-yellow-950/20 dark:text-yellow-200"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
        <AlertDescription className="text-sm">
          You've used {usage} of {limit} {label} this month. Consider upgrading for more capacity.
        </AlertDescription>
      </div>
    </Alert>
  );
}
