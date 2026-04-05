import { useState, useEffect, useCallback, useRef } from "react";
import mascotIdle from "@/assets/mascot_idle.png";
import mascotWorking from "@/assets/mascot_working.png";
import mascotSuccess from "@/assets/mascot_success.png";
import mascotProud from "@/assets/mascot_proud.png";
import mascotVerified from "@/assets/mascot_verified.png";
import mascotSearch from "@/assets/mascot_search.png";
import { cn } from "@/lib/utils";

// Error/notFound reuse the working pose (determined expression)
const mascotError = mascotWorking;
// Default fallback image
const mascotImg = mascotIdle;

const moodImages: Record<MascotMood, string> = {
  idle: mascotIdle,        // standing, friendly pose
  working: mascotWorking,  // stamp + paper, busy
  success: mascotSuccess,  // winking, confident
  error: mascotError,      // determined expression
  empty: mascotIdle,       // standing
  loading: mascotWorking,  // busy with stamp
  verified: mascotVerified,// holding checkmark badge
  notFound: mascotSearch,  // magnifying glass, searching
  proud: mascotProud,      // holding stamp up high, triumphant
  greeting: mascotIdle,    // friendly standing pose
  search: mascotSearch,    // magnifying glass
  warning: mascotWorking,  // determined/focused
};

export type MascotMood =
  | "idle" | "working" | "success" | "error" | "empty"
  | "loading" | "verified" | "notFound" | "proud"
  | "greeting" | "search" | "warning";

const moodAnimations: Record<MascotMood, string> = {
  idle: "animate-rusti-breathe", working: "animate-rusti-float",
  success: "animate-rusti-celebrate", error: "animate-rusti-sad-droop",
  empty: "animate-rusti-curious-tilt opacity-80", loading: "animate-rusti-float",
  verified: "animate-rusti-heartbeat", notFound: "animate-rusti-sad-droop",
  proud: "animate-rusti-celebrate", greeting: "animate-rusti-entrance",
  search: "animate-rusti-curious-tilt", warning: "animate-rusti-squish",
};

const moodHoverAnimations: Record<MascotMood, string> = {
  idle: "group-hover:animate-rusti-wiggle group-hover:scale-125",
  working: "group-hover:animate-rusti-nod group-hover:scale-110",
  success: "group-hover:animate-rusti-spin-pop",
  error: "group-hover:animate-rusti-wiggle group-hover:brightness-125",
  empty: "group-hover:animate-rusti-peek group-hover:opacity-100",
  loading: "group-hover:animate-rusti-nod group-hover:scale-110",
  verified: "group-hover:animate-rusti-celebrate",
  notFound: "group-hover:animate-rusti-wiggle group-hover:brightness-125",
  proud: "group-hover:animate-rusti-spin-pop",
  greeting: "group-hover:animate-rusti-wiggle group-hover:scale-125",
  search: "group-hover:animate-rusti-wiggle group-hover:scale-120",
  warning: "group-hover:animate-rusti-wiggle group-hover:scale-110",
};

const moodGlow: Record<MascotMood, string> = {
  idle: "drop-shadow-[0_0_8px_hsl(var(--primary)/0.2)]",
  working: "drop-shadow-[0_0_16px_rgba(59,130,246,0.5)]",
  success: "drop-shadow-[0_0_20px_rgba(34,197,94,0.6)]",
  error: "drop-shadow-[0_0_16px_rgba(239,68,68,0.5)]",
  empty: "drop-shadow-[0_0_6px_hsl(var(--primary)/0.15)]",
  loading: "drop-shadow-[0_0_14px_rgba(59,130,246,0.4)]",
  verified: "drop-shadow-[0_0_24px_rgba(34,197,94,0.7)]",
  notFound: "drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]",
  proud: "drop-shadow-[0_0_20px_rgba(234,179,8,0.6)]",
  greeting: "drop-shadow-[0_0_16px_hsl(var(--primary)/0.5)]",
  search: "drop-shadow-[0_0_12px_hsl(var(--primary)/0.35)]",
  warning: "drop-shadow-[0_0_16px_rgba(234,179,8,0.5)]",
};

const defaultMessages: Record<MascotMood, string> = {
  idle: "✨ Rusti's here. What are we building today?",
  working: "💅 Hold tight, queen is working…",
  success: "🎉 Nailed it! Another one for the portfolio!",
  error: "😤 Ugh, something broke. Let's fix this!",
  empty: "🦗 It's giving… empty. Let's change that!",
  loading: "⏳ Patience, darling. Greatness takes a moment…",
  verified: "✅ Verified and ICONIC. This credential is legit!",
  notFound: "🔍 Hmm, couldn't find that one. Try again?",
  proud: "🏆 Look at you go! Rusti approves!",
  greeting: "👋 Hey there! Welcome to TRUSTIFICATE!",
  search: "🔎 Drop a certificate ID and let's verify!",
  warning: "⚠️ Heads up! Rusti spotted something…",
};

const moodEmojiBursts: Record<MascotMood, string[]> = {
  idle: ["✨", "💫", "⭐", "🌟"],
  working: ["⚡", "🔧", "💪", "🛠️"],
  success: ["🎉", "🥳", "🎊", "💯", "🏆"],
  error: ["💔", "😵", "🫠", "❌"],
  empty: ["🦗", "💨", "🫥"],
  loading: ["⏳", "⌛", "🔄"],
  verified: ["✅", "🛡️", "💎", "🔒"],
  notFound: ["🔍", "❓", "🤷"],
  proud: ["👑", "💅", "🏆", "🌟", "💎"],
  greeting: ["👋", "🤗", "💖", "✨"],
  search: ["🔎", "🧐", "📋"],
  warning: ["⚠️", "👀", "🚨"],
};

function playSound(type: "pop" | "sparkle" | "whoosh" | "ding") {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.08;
    switch (type) {
      case "pop":
        osc.frequency.value = 600;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(); osc.stop(ctx.currentTime + 0.15); break;
      case "sparkle":
        osc.type = "sine"; osc.frequency.value = 1200;
        osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(); osc.stop(ctx.currentTime + 0.2); break;
      case "whoosh":
        osc.type = "sawtooth"; osc.frequency.value = 200;
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
        gain.gain.value = 0.04;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(); osc.stop(ctx.currentTime + 0.2); break;
      case "ding":
        osc.type = "sine"; osc.frequency.value = 880;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(); osc.stop(ctx.currentTime + 0.3); break;
    }
  } catch { /* audio not available */ }
}

interface MascotProps {
  mood?: MascotMood;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  message?: string;
  className?: string;
  showMessage?: boolean;
  static?: boolean;
}

const sizeMap = {
  xs: "h-8 w-8", sm: "h-14 w-14", md: "h-20 w-20",
  lg: "h-32 w-32", xl: "h-44 w-44",
};

const idleThoughts = ["💭", "✨", "🤔", "😊", "👋", "🌟", "💅", "👑", "💖", "🔥"];

function EmojiBurst({ emojis }: { emojis: string[] }) {
  const [particles, setParticles] = useState<{ id: number; emoji: string; x: number; delay: number }[]>([]);
  useEffect(() => {
    const burst = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      x: Math.random() * 80 - 40,
      delay: Math.random() * 0.3,
    }));
    setParticles(burst);
    const timer = setTimeout(() => setParticles([]), 1500);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-20">
      {particles.map((p) => (
        <span key={p.id} className="absolute text-lg animate-[float-up_1.2s_ease-out_forwards]"
          style={{ left: `calc(50% + ${p.x}px)`, bottom: "60%", animationDelay: `${p.delay}s`, opacity: 0 }}>
          {p.emoji}
        </span>
      ))}
    </div>
  );
}

export function Mascot({
  mood = "idle", size = "md", message, className,
  showMessage = true, static: isStatic = false,
}: MascotProps) {
  const displayMessage = message || defaultMessages[mood];
  const moodImg = moodImages[mood];
  const [thought, setThought] = useState<string | null>(null);
  const [showBurst, setShowBurst] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const thoughtTimer = useRef<ReturnType<typeof setTimeout>>();

  const showThought = useCallback(() => {
    if (mood !== "idle" && mood !== "greeting") return;
    setThought(idleThoughts[Math.floor(Math.random() * idleThoughts.length)]);
    clearTimeout(thoughtTimer.current);
    thoughtTimer.current = setTimeout(() => setThought(null), 2500);
    playSound("sparkle");
  }, [mood]);

  const handleClick = () => {
    setShowBurst(true);
    setClickCount((c) => c + 1);
    playSound(mood === "success" || mood === "proud" ? "ding" : "pop");
    setTimeout(() => setShowBurst(false), 1500);
  };

  useEffect(() => () => clearTimeout(thoughtTimer.current), []);

  const animClass = isStatic ? "" : cn(moodAnimations[mood], moodHoverAnimations[mood], moodGlow[mood]);

  return (
    <div className={cn("group relative flex flex-col items-center gap-3 select-none", className)}
      onMouseEnter={showThought} onClick={handleClick}
      role="img" aria-label={`Rusti the seal mascot is feeling ${mood}`}>

      {showBurst && !isStatic && <EmojiBurst emojis={moodEmojiBursts[mood]} />}

      {thought && !isStatic && (
        <span className="absolute -top-5 -right-2 text-2xl animate-rusti-peek pointer-events-none z-10" aria-hidden="true">
          {thought}
        </span>
      )}

      {!isStatic && (size === "lg" || size === "xl" || size === "md") && (
        <div className={cn(
          "absolute rounded-full blur-xl opacity-30 animate-pulse",
          size === "xl" ? "h-36 w-36" : size === "lg" ? "h-24 w-24" : "h-16 w-16",
          mood === "success" || mood === "proud" ? "bg-green-400" :
          mood === "error" || mood === "notFound" ? "bg-red-400" :
          mood === "verified" ? "bg-emerald-400" :
          mood === "warning" ? "bg-amber-400" : "bg-primary/30"
        )} aria-hidden="true" />
      )}

      {!isStatic && (size === "lg" || size === "xl") && (
        <div className={cn(
          "absolute bottom-0 rounded-full bg-foreground/8 blur-md",
          size === "xl" ? "h-4 w-28" : "h-3 w-20",
          mood === "working" || mood === "loading" ? "animate-pulse" : ""
        )} aria-hidden="true" />
      )}

      {!isStatic && (mood === "success" || mood === "proud" || mood === "verified") && (
        <div className="absolute inset-0 pointer-events-none z-10" aria-hidden="true">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="absolute text-xs animate-ping"
              style={{ top: `${15 + Math.random() * 60}%`, left: `${10 + Math.random() * 80}%`,
                animationDelay: `${i * 0.4}s`, animationDuration: "1.5s" }}>✨</span>
          ))}
        </div>
      )}

      <img src={moodImg} alt="Rusti, the TRUSTIFICATE seal mascot"
        className={cn(sizeMap[size],
          "object-contain cursor-pointer transition-all duration-300 relative z-[5]",
          animClass, "dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]", "hover:brightness-110"
        )} draggable={false} />

      {clickCount >= 5 && !isStatic && (
        <span className="absolute -top-1 -left-1 bg-primary text-primary-foreground text-[9px] font-bold rounded-full h-5 w-5 flex items-center justify-center z-20 animate-rusti-peek">
          {clickCount}
        </span>
      )}

      {showMessage && displayMessage && (
        <p className={cn(
          "text-sm text-muted-foreground text-center max-w-[260px] leading-relaxed animate-fade-in font-medium",
          (mood === "success" || mood === "proud") && "text-green-600 dark:text-green-400",
          mood === "error" && "text-red-500 dark:text-red-400",
          mood === "greeting" && "text-primary",
        )}>{displayMessage}</p>
      )}
    </div>
  );
}

export function MascotInline({ className }: { className?: string }) {
  const [clicked, setClicked] = useState(false);
  const handleClick = () => { setClicked(true); playSound("pop"); setTimeout(() => setClicked(false), 600); };
  return (
    <img src={mascotIdle} alt="Rusti"
      className={cn("h-6 w-6 object-contain select-none cursor-pointer",
        "animate-rusti-breathe", "hover:animate-rusti-wiggle hover:scale-150",
        "transition-transform duration-200",
        "drop-shadow-[0_0_6px_hsl(var(--primary)/0.3)]",
        "dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.2)]",
        clicked && "animate-rusti-spin-pop", className
      )} draggable={false} onClick={handleClick} />
  );
}

export function MascotWatermark() {
  return (
    <div className="flex items-center gap-1.5 opacity-60">
      <img src={mascotImg} alt="TRUSTIFICATE" className="h-5 w-5 object-contain" draggable={false} />
      <span className="text-[9px] tracking-wider uppercase font-semibold">Verified by TRUSTIFICATE</span>
    </div>
  );
}

export function VerificationBadge({ status = "verified", className }: { status?: "verified" | "revoked" | "pending"; className?: string }) {
  const labels = { verified: "✅ Verified by TRUSTIFICATE", revoked: "❌ Revoked", pending: "⏳ Pending Verification" };
  const colors = { verified: "border-success/30 bg-success/5 text-success", revoked: "border-destructive/30 bg-destructive/5 text-destructive", pending: "border-warning/30 bg-warning/5 text-warning" };
  const badgeAnim = { verified: "animate-rusti-peek", revoked: "", pending: "animate-pulse" };
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full border px-4 py-1.5", colors[status], badgeAnim[status], className)}>
      <img src={status === "verified" ? mascotVerified : mascotError} alt=""
        className={cn("h-5 w-5 object-contain", status === "verified" && "animate-rusti-heartbeat")} draggable={false} />
      <span className="text-sm font-semibold">{labels[status]}</span>
    </div>
  );
}

const allMascotImages = [mascotIdle, mascotWorking, mascotSuccess, mascotProud, mascotVerified, mascotSearch];

const tips = [
  { text: "Use templates to issue certificates faster.", emoji: "📝", diva: "Pro tip, bestie!", gradient: "from-blue-500/10 via-indigo-500/5 to-purple-500/10", border: "border-blue-300 dark:border-blue-700", accent: "text-blue-600 dark:text-blue-400" },
  { text: "Verify any certificate instantly with the search tool.", emoji: "🔍", diva: "Rusti knows all!", gradient: "from-emerald-500/10 via-teal-500/5 to-cyan-500/10", border: "border-emerald-300 dark:border-emerald-700", accent: "text-emerald-600 dark:text-emerald-400" },
  { text: "Bulk upload via CSV to issue hundreds at once.", emoji: "📤", diva: "Work smarter, not harder!", gradient: "from-violet-500/10 via-purple-500/5 to-fuchsia-500/10", border: "border-violet-300 dark:border-violet-700", accent: "text-violet-600 dark:text-violet-400" },
  { text: "Every certificate includes a QR code for verification.", emoji: "📱", diva: "Scan and slay!", gradient: "from-amber-500/10 via-orange-500/5 to-yellow-500/10", border: "border-amber-300 dark:border-amber-700", accent: "text-amber-600 dark:text-amber-400" },
  { text: "Register external certificates in the unified registry.", emoji: "🌐", diva: "One registry to rule them all!", gradient: "from-rose-500/10 via-pink-500/5 to-red-500/10", border: "border-rose-300 dark:border-rose-700", accent: "text-rose-600 dark:text-rose-400" },
  { text: "AI can pre-fill your certificate forms for speed.", emoji: "🤖", diva: "Let the robots help!", gradient: "from-cyan-500/10 via-sky-500/5 to-blue-500/10", border: "border-cyan-300 dark:border-cyan-700", accent: "text-cyan-600 dark:text-cyan-400" },
  { text: "Download certificates as PDF or PNG anytime.", emoji: "📄", diva: "Take it to go!", gradient: "from-green-500/10 via-lime-500/5 to-emerald-500/10", border: "border-green-300 dark:border-green-700", accent: "text-green-600 dark:text-green-400" },
  { text: "Revoke a certificate and the public page updates instantly.", emoji: "⚡", diva: "Power move!", gradient: "from-orange-500/10 via-red-500/5 to-rose-500/10", border: "border-orange-300 dark:border-orange-700", accent: "text-orange-600 dark:text-orange-400" },
];

export function MascotTipWidget() {
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Date.now() / 60000) % tips.length);
  const [mascotIndex, setMascotIndex] = useState(() => Math.floor(Math.random() * allMascotImages.length));
  const [animating, setAnimating] = useState(false);

  const nextTip = () => {
    setAnimating(true);
    playSound("pop");
    setTimeout(() => {
      setTipIndex((i) => (i + 1) % tips.length);
      setMascotIndex(Math.floor(Math.random() * allMascotImages.length));
      setAnimating(false);
    }, 300);
  };

  const tip = tips[tipIndex];
  const mascotSrc = allMascotImages[mascotIndex];

  return (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-2xl border-2 p-4 shadow-md cursor-pointer",
        "hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]",
        "transition-all duration-300 bg-gradient-to-r",
        tip.gradient, tip.border
      )}
      onClick={nextTip} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && nextTip()}
      aria-label="Click for next tip from Rusti"
    >
      {/* Mascot — fixed size, random pose */}
      <div className="relative shrink-0">
        <div className="h-14 w-14 rounded-xl bg-white/60 dark:bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-inner overflow-hidden">
          <img
            src={mascotSrc}
            alt="Rusti"
            className={cn(
              "h-12 w-12 object-contain transition-all duration-500",
              animating ? "scale-0 rotate-180 opacity-0" : "scale-100 rotate-0 opacity-100",
              "group-hover:animate-rusti-wiggle"
            )}
            draggable={false}
          />
        </div>
        <span className="absolute -top-2 -right-2 text-base animate-bounce drop-shadow-sm">{tip.emoji}</span>
      </div>

      {/* Content */}
      <div className={cn("flex-1 transition-all duration-300", animating ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0")}>
        <div className="flex items-center gap-2 mb-0.5">
          <p className={cn("text-xs font-extrabold uppercase tracking-widest", tip.accent)}>Rusti says</p>
          <span className="text-[10px] text-muted-foreground italic font-medium">"{tip.diva}"</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed font-medium">{tip.text}</p>
      </div>

      {/* Arrow */}
      <div className="shrink-0 h-8 w-8 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center group-hover:bg-white/80 dark:group-hover:bg-white/20 transition-colors">
        <span className="text-sm group-hover:translate-x-0.5 transition-transform">→</span>
      </div>
    </div>
  );
}

export function MascotLoader({ message = "Patience, darling. Greatness takes a moment…" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
        <img src={mascotImg} alt="Loading…"
          className={cn("h-24 w-24 object-contain relative z-10",
            "animate-rusti-float",
            "drop-shadow-[0_0_20px_hsl(var(--primary)/0.4)]",
            "dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]"
          )} draggable={false} />
        <span className="absolute -top-2 left-1/2 h-2 w-2 rounded-full bg-primary/60 animate-spin" style={{ animationDuration: "2s", transformOrigin: "0 32px" }} />
        <span className="absolute -top-2 left-1/2 h-1.5 w-1.5 rounded-full bg-primary/40 animate-spin" style={{ animationDuration: "3s", transformOrigin: "0 36px" }} />
        <span className="absolute -top-1 left-1/2 h-1 w-1 rounded-full bg-primary/30 animate-spin" style={{ animationDuration: "4s", transformOrigin: "0 40px" }} />
      </div>
      <p className="text-base text-muted-foreground animate-pulse font-medium">{message}</p>
    </div>
  );
}
