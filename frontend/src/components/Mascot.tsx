import { useState, useEffect, useCallback, useRef } from "react";
import mascotIdle from "@/assets/mascot-idle.png";
import mascotWorking from "@/assets/mascot-working.png";
import mascotSuccess from "@/assets/mascot-success.png";
import mascotError from "@/assets/mascot-error.png";
import mascotVerified from "@/assets/mascot-verified.png";
import mascotSearch from "@/assets/mascot-search.png";
import mascotImg from "@/assets/mascot.png";
import { cn } from "@/lib/utils";

// ─── Mood → image mapping ───────────────────────────────────────────
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

// ─── Emotion-driven animation classes ───────────────────────────────
// Each mood gets a primary animation + a subtle secondary layer
const moodAnimations: Record<MascotMood, string> = {
  idle: "animate-tifi-breathe",
  working: "animate-tifi-float",
  success: "animate-tifi-celebrate",
  error: "animate-tifi-sad-droop",
  empty: "animate-tifi-curious-tilt opacity-80",
  loading: "animate-tifi-float",
  verified: "animate-tifi-heartbeat",
  notFound: "animate-tifi-sad-droop",
  proud: "animate-tifi-celebrate",
  greeting: "animate-tifi-entrance",
  search: "animate-tifi-curious-tilt",
  warning: "animate-tifi-squish",
};

// Hover reactions — Ti-Fi responds when you interact
const moodHoverAnimations: Record<MascotMood, string> = {
  idle: "group-hover:animate-tifi-wiggle group-hover:scale-110",
  working: "group-hover:animate-tifi-nod",
  success: "group-hover:animate-tifi-spin-pop",
  error: "group-hover:animate-tifi-wiggle group-hover:brightness-110",
  empty: "group-hover:animate-tifi-peek group-hover:opacity-100",
  loading: "group-hover:animate-tifi-nod",
  verified: "group-hover:animate-tifi-celebrate",
  notFound: "group-hover:animate-tifi-wiggle group-hover:brightness-110",
  proud: "group-hover:animate-tifi-spin-pop",
  greeting: "group-hover:animate-tifi-wiggle",
  search: "group-hover:animate-tifi-wiggle group-hover:scale-110",
  warning: "group-hover:animate-tifi-wiggle",
};

// Glow/shadow effects per mood — gives Ti-Fi an emotional aura
const moodGlow: Record<MascotMood, string> = {
  idle: "",
  working: "drop-shadow-[0_0_6px_rgba(59,130,246,0.3)]",
  success: "drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]",
  error: "drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]",
  empty: "",
  loading: "drop-shadow-[0_0_6px_rgba(59,130,246,0.25)]",
  verified: "drop-shadow-[0_0_12px_rgba(34,197,94,0.5)]",
  notFound: "drop-shadow-[0_0_6px_rgba(239,68,68,0.25)]",
  proud: "drop-shadow-[0_0_10px_rgba(234,179,8,0.4)]",
  greeting: "drop-shadow-[0_0_8px_hsl(var(--primary)/0.3)]",
  search: "drop-shadow-[0_0_6px_hsl(var(--primary)/0.2)]",
  warning: "drop-shadow-[0_0_8px_rgba(234,179,8,0.35)]",
};

const defaultMessages: Record<MascotMood, string> = {
  idle: "",
  working: "Working on it\u2026",
  success: "All done! \ud83c\udf89",
  error: "Oops, something went wrong.",
  empty: "Nothing here yet!",
  loading: "Preparing your document\u2026",
  verified: "This credential is authentic! \u2714",
  notFound: "We couldn\u2019t find that.",
  proud: "Great work!",
  greeting: "Welcome to TRUSTIFICATE!",
  search: "Enter a certificate ID to verify.",
  warning: "Heads up!",
};

// ─── Size map ───────────────────────────────────────────────────────
interface MascotProps {
  mood?: MascotMood;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  message?: string;
  className?: string;
  showMessage?: boolean;
  /** Disable all animations (for print/PDF contexts) */
  static?: boolean;
}

const sizeMap = {
  xs: "h-6 w-6",
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-24 w-24",
  xl: "h-32 w-32",
};

// Emoji thought bubbles that appear randomly on idle hover
const idleThoughts = ["\ud83d\udcad", "\u2728", "\ud83e\udd14", "\ud83d\ude0a", "\ud83d\udc4b", "\ud83c\udf1f"];

// ─── Main Mascot component ──────────────────────────────────────────
export function Mascot({
  mood = "idle",
  size = "md",
  message,
  className,
  showMessage = true,
  static: isStatic = false,
}: MascotProps) {
  const displayMessage = message || defaultMessages[mood];
  const moodImg = moodImages[mood];
  const [thought, setThought] = useState<string | null>(null);
  const thoughtTimer = useRef<ReturnType<typeof setTimeout>>();

  // Random idle thought bubble on hover
  const showThought = useCallback(() => {
    if (mood !== "idle" && mood !== "greeting") return;
    setThought(idleThoughts[Math.floor(Math.random() * idleThoughts.length)]);
    clearTimeout(thoughtTimer.current);
    thoughtTimer.current = setTimeout(() => setThought(null), 1800);
  }, [mood]);

  useEffect(() => () => clearTimeout(thoughtTimer.current), []);

  const animClass = isStatic
    ? ""
    : cn(moodAnimations[mood], moodHoverAnimations[mood], moodGlow[mood]);

  return (
    <div
      className={cn("group relative flex flex-col items-center gap-2 select-none", className)}
      onMouseEnter={showThought}
      role="img"
      aria-label={`Ti-Fi the seal mascot is feeling ${mood}`}
    >
      {/* Thought bubble */}
      {thought && !isStatic && (
        <span
          className="absolute -top-3 -right-1 text-sm animate-tifi-peek pointer-events-none z-10"
          aria-hidden="true"
        >
          {thought}
        </span>
      )}

      {/* Shadow/reflection beneath Ti-Fi */}
      {!isStatic && (size === "lg" || size === "xl") && (
        <div
          className={cn(
            "absolute bottom-0 rounded-full bg-foreground/5 blur-sm",
            size === "xl" ? "h-3 w-20" : "h-2 w-14",
            mood === "working" || mood === "loading"
              ? "animate-pulse"
              : ""
          )}
          aria-hidden="true"
        />
      )}

      <img
        src={moodImg}
        alt={`Ti-Fi, the TRUSTIFICATE seal mascot`}
        className={cn(
          sizeMap[size],
          "object-contain cursor-pointer transition-all duration-300",
          animClass,
          "dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]"
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

// ─── MascotInline — small nav/badge mascot with micro-interactions ──
export function MascotInline({ className }: { className?: string }) {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    setTimeout(() => setClicked(false), 600);
  };

  return (
    <img
      src={mascotIdle}
      alt="Ti-Fi"
      className={cn(
        "h-5 w-5 object-contain select-none cursor-pointer",
        "animate-tifi-breathe",
        "hover:animate-tifi-wiggle hover:scale-125",
        "transition-transform duration-200",
        "dark:drop-shadow-[0_0_4px_rgba(255,255,255,0.15)]",
        clicked && "animate-tifi-spin-pop",
        className
      )}
      draggable={false}
      onClick={handleClick}
    />
  );
}

// ─── MascotWatermark — certificate watermark ────────────────────────
export function MascotWatermark() {
  return (
    <div className="flex items-center gap-1 opacity-60">
      <img src={mascotImg} alt="TRUSTIFICATE" className="h-4 w-4 object-contain" draggable={false} />
      <span className="text-[8px] tracking-wider uppercase font-medium">Verified by TRUSTIFICATE</span>
    </div>
  );
}

// ─── VerificationBadge — animated verification status ───────────────
export function VerificationBadge({
  status = "verified",
  className,
}: {
  status?: "verified" | "revoked" | "pending";
  className?: string;
}) {
  const labels = {
    verified: "Verified by TRUSTIFICATE",
    revoked: "Revoked",
    pending: "Pending Verification",
  };
  const colors = {
    verified: "border-success/30 bg-success/5 text-success",
    revoked: "border-destructive/30 bg-destructive/5 text-destructive",
    pending: "border-warning/30 bg-warning/5 text-warning",
  };
  const badgeAnim = {
    verified: "animate-tifi-peek",
    revoked: "",
    pending: "animate-pulse",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1",
        colors[status],
        badgeAnim[status],
        className
      )}
    >
      <img
        src={status === "verified" ? mascotVerified : mascotError}
        alt=""
        className={cn(
          "h-4 w-4 object-contain",
          status === "verified" && "animate-tifi-heartbeat"
        )}
        draggable={false}
      />
      <span className="text-xs font-medium">{labels[status]}</span>
    </div>
  );
}

// ─── MascotTipWidget — animated tip card for dashboard ──────────────
const tips = [
  { text: "Use templates to issue certificates faster.", emoji: "\ud83d\udcdd" },
  { text: "Verify any certificate instantly with the search tool.", emoji: "\ud83d\udd0d" },
  { text: "Bulk upload via CSV to issue hundreds at once.", emoji: "\ud83d\udce4" },
  { text: "Every certificate includes a QR code for verification.", emoji: "\ud83d\udcf1" },
  { text: "Register external certificates in the unified registry.", emoji: "\ud83c\udf10" },
  { text: "AI can pre-fill your certificate forms for speed.", emoji: "\ud83e\udd16" },
  { text: "Download certificates as PDF or PNG anytime.", emoji: "\ud83d\udcc4" },
  { text: "Revoke a certificate and the public page updates instantly.", emoji: "\u26a1" },
];

export function MascotTipWidget() {
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Date.now() / 60000) % tips.length);
  const [animating, setAnimating] = useState(false);

  const nextTip = () => {
    setAnimating(true);
    setTimeout(() => {
      setTipIndex((i) => (i + 1) % tips.length);
      setAnimating(false);
    }, 300);
  };

  const tip = tips[tipIndex];

  return (
    <div
      className="group flex items-start gap-3 rounded-lg border bg-card p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={nextTip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && nextTip()}
      aria-label="Click for next tip from Ti-Fi"
    >
      <img
        src={mascotImg}
        alt="Ti-Fi"
        className={cn(
          "h-8 w-8 object-contain shrink-0 mt-0.5",
          "animate-tifi-breathe group-hover:animate-tifi-wiggle",
          "dark:drop-shadow-[0_0_4px_rgba(255,255,255,0.15)]"
        )}
        draggable={false}
      />
      <div className={cn("transition-opacity duration-300", animating ? "opacity-0" : "opacity-100")}>
        <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-0.5">
          Tip from Ti-Fi {tip.emoji}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">{tip.text}</p>
      </div>
    </div>
  );
}

// ─── MascotLoader — animated loading state ──────────────────────────
export function MascotLoader({ message = "Preparing your document\u2026" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div className="relative">
        <img
          src={mascotImg}
          alt="Loading\u2026"
          className={cn(
            "h-16 w-16 object-contain",
            "animate-tifi-float",
            "drop-shadow-[0_0_12px_hsl(var(--primary)/0.3)]",
            "dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]"
          )}
          draggable={false}
        />
        {/* Orbiting dots */}
        <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 rounded-full bg-primary/60 animate-spin" style={{ animationDuration: "2s", transformOrigin: "0 24px" }} />
        <span className="absolute -top-1 left-1/2 h-1 w-1 rounded-full bg-primary/40 animate-spin" style={{ animationDuration: "3s", transformOrigin: "0 28px" }} />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}
