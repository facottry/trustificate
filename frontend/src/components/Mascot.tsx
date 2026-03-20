import mascotIdle from "@/assets/mascot-idle.png";
import mascotWorking from "@/assets/mascot-working.png";
import mascotSuccess from "@/assets/mascot-success.png";
import mascotError from "@/assets/mascot-error.png";
import mascotVerified from "@/assets/mascot-verified.png";
import mascotSearch from "@/assets/mascot-search.png";
import mascotImg from "@/assets/mascot.png";
import { cn } from "@/lib/utils";

const moodImages: Record<MascotMood, string> = {
  idle: mascotIdle,
  working: mascotWorking,
  success: mascotSuccess,
  error: mascotError,
  empty: mascotIdle,
  loading: mascotWorking,
  verified: mascotVerified,
  notFound: mascotError,
  proud: mascotSuccess,
  greeting: mascotIdle,
  search: mascotSearch,
  warning: mascotError,
};

export type MascotMood =
  | "idle"
  | "working"
  | "success"
  | "error"
  | "empty"
  | "loading"
  | "verified"
  | "notFound"
  | "proud"
  | "greeting"
  | "search"
  | "warning";

interface MascotProps {
  mood?: MascotMood;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  message?: string;
  className?: string;
  showMessage?: boolean;
}

const sizeMap = {
  xs: "h-6 w-6",
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-24 w-24",
  xl: "h-32 w-32",
};

const moodAnimations: Record<MascotMood, string> = {
  idle: "hover:scale-105 transition-transform duration-300",
  working: "animate-[bounce_2s_ease-in-out_infinite]",
  success: "animate-[bounce_0.6s_ease-in-out_2]",
  error: "animate-[shake_0.5s_ease-in-out_2]",
  empty: "opacity-80 hover:opacity-100 transition-opacity duration-300",
  loading: "animate-[pulse_1.5s_ease-in-out_infinite]",
  verified: "animate-[bounce_0.8s_ease-in-out_1]",
  notFound: "animate-[shake_0.6s_ease-in-out_1]",
  proud: "animate-[bounce_0.8s_ease-in-out_1]",
  greeting: "animate-[wave_1s_ease-in-out_2]",
  search: "hover:scale-105 transition-transform duration-300",
  warning: "animate-[shake_0.4s_ease-in-out_1]",
};

const defaultMessages: Record<MascotMood, string> = {
  idle: "",
  working: "Working on it…",
  success: "All done! 🎉",
  error: "Oops, something went wrong.",
  empty: "Nothing here yet!",
  loading: "Preparing your document…",
  verified: "This credential is authentic! ✔",
  notFound: "We couldn't find that.",
  proud: "Great work!",
  greeting: "Welcome to TRUSTIFICATE!",
  search: "Enter a certificate ID to verify.",
  warning: "Heads up!",
};

export function Mascot({ mood = "idle", size = "md", message, className, showMessage = true }: MascotProps) {
  const displayMessage = message || defaultMessages[mood];

  const moodImg = moodImages[mood];

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <img
        src={moodImg}
        alt="Minty TRUSTIFICATE mascot"
        className={cn(
          sizeMap[size],
          moodAnimations[mood],
          "object-contain select-none dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]"
        )}
        draggable={false}
      />
      {showMessage && displayMessage && (
        <p className="text-xs text-muted-foreground text-center max-w-[200px] leading-relaxed animate-fade-in">
          {displayMessage}
        </p>
      )}
    </div>
  );
}

/** Small inline mascot for nav / badges */
export function MascotInline({ className }: { className?: string }) {
  return (
    <img
      src={mascotIdle}
      alt="Minty"
      className={cn(
        "h-5 w-5 object-contain select-none hover:scale-110 transition-transform duration-200 dark:drop-shadow-[0_0_4px_rgba(255,255,255,0.15)]",
        className
      )}
      draggable={false}
    />
  );
}

/** Mascot watermark for certificates */
export function MascotWatermark() {
  return (
    <div className="flex items-center gap-1 opacity-60">
      <img src={mascotImg} alt="TRUSTIFICATE" className="h-4 w-4 object-contain" draggable={false} />
      <span className="text-[8px] tracking-wider uppercase font-medium">Verified by TRUSTIFICATE</span>
    </div>
  );
}

/** Verification badge with mascot */
export function VerificationBadge({ status = "verified", className }: { status?: "verified" | "revoked" | "pending"; className?: string }) {
  const labels = { verified: "Verified by TRUSTIFICATE", revoked: "Revoked", pending: "Pending Verification" };
  const colors = {
    verified: "border-success/30 bg-success/5 text-success",
    revoked: "border-destructive/30 bg-destructive/5 text-destructive",
    pending: "border-warning/30 bg-warning/5 text-warning",
  };
  return (
    <div className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1", colors[status], className)}>
      <img src={mascotImg} alt="" className="h-4 w-4 object-contain" draggable={false} />
      <span className="text-xs font-medium">{labels[status]}</span>
    </div>
  );
}

/** Floating tips widget for dashboard */
const tips = [
  "Use templates to issue certificates faster.",
  "You can verify certificates using the search tool.",
  "Bulk upload via CSV to issue hundreds at once.",
  "Every certificate includes a QR code for verification.",
  "Register external certificates in the unified registry.",
  "AI can pre-fill your certificate forms.",
];

export function MascotTipWidget() {
  const tipIndex = Math.floor(Date.now() / 60000) % tips.length;
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3 shadow-sm">
      <img
        src={mascotImg}
        alt="Minty"
        className="h-8 w-8 object-contain shrink-0 mt-0.5 dark:drop-shadow-[0_0_4px_rgba(255,255,255,0.15)]"
        draggable={false}
      />
      <div>
        <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-0.5">Tip from Minty</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{tips[tipIndex]}</p>
      </div>
    </div>
  );
}

/** Mascot loader replaces boring spinners */
export function MascotLoader({ message = "Preparing your document…" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <img
        src={mascotImg}
        alt="Loading…"
        className="h-16 w-16 object-contain animate-[bounce_1.5s_ease-in-out_infinite] dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]"
        draggable={false}
      />
      <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}

