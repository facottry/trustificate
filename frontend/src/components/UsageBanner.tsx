import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Zap } from "lucide-react";

interface UsageBannerProps {
  metric: string;
  usage: number;
  limit: number;
  onUpgrade: () => void;
}

export function UsageBanner({ metric, usage, limit, onUpgrade }: UsageBannerProps) {
  const percent = limit > 0 ? Math.round((usage / limit) * 100) : 0;
  const label = metric.replace(/_/g, " ");

  if (percent < 80) return null;

  const isAtLimit = percent >= 100;

  return (
    <Alert variant={isAtLimit ? "destructive" : "default"} className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {isAtLimit ? (
          <Zap className="h-4 w-4" />
        ) : (
          <AlertTriangle className="h-4 w-4" />
        )}
        <AlertDescription className="text-sm">
          {isAtLimit
            ? `You've reached your monthly limit for ${label}. Upgrade to continue.`
            : `You're nearing your plan limit — ${usage} of ${limit} ${label} used this month.`}
        </AlertDescription>
      </div>
      <Button size="sm" variant={isAtLimit ? "default" : "outline"} onClick={onUpgrade} className="ml-3 shrink-0">
        Upgrade
      </Button>
    </Alert>
  );
}
