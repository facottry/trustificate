import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  variant?: "full" | "icon" | "text";
}

const sizeMap = {
  xs: { icon: "h-5 w-5", text: "text-xs", gap: "gap-1" },
  sm: { icon: "h-7 w-7", text: "text-sm", gap: "gap-1.5" },
  md: { icon: "h-9 w-9", text: "text-base", gap: "gap-2" },
  lg: { icon: "h-12 w-12", text: "text-xl", gap: "gap-2.5" },
  xl: { icon: "h-16 w-16", text: "text-2xl", gap: "gap-3" },
};

export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {/* Shield shape */}
      <path
        d="M24 2L6 10v12c0 11.1 7.7 21.5 18 24 10.3-2.5 18-12.9 18-24V10L24 2z"
        fill="hsl(var(--primary))"
        opacity="0.12"
      />
      <path
        d="M24 2L6 10v12c0 11.1 7.7 21.5 18 24 10.3-2.5 18-12.9 18-24V10L24 2z"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        fill="none"
      />
      {/* Checkmark */}
      <path
        d="M15 24l6 6 12-12"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Seal dots */}
      <circle cx="24" cy="42" r="1.5" fill="hsl(var(--primary))" opacity="0.6" />
      <circle cx="20" cy="41.5" r="1" fill="hsl(var(--primary))" opacity="0.4" />
      <circle cx="28" cy="41.5" r="1" fill="hsl(var(--primary))" opacity="0.4" />
    </svg>
  );
}

export function Logo({ className, size = "md", showText = true, variant = "full" }: LogoProps) {
  const s = sizeMap[size];

  if (variant === "icon") {
    return <LogoIcon className={cn(s.icon, className)} />;
  }

  if (variant === "text") {
    return (
      <span className={cn("font-bold tracking-tight text-foreground", s.text, className)}>
        TRUSTIFICATE
      </span>
    );
  }

  return (
    <div className={cn("flex items-center", s.gap, className)}>
      <LogoIcon className={s.icon} />
      {showText && (
        <span className={cn("font-bold tracking-tight text-foreground", s.text)}>
          TRUSTIFICATE
        </span>
      )}
    </div>
  );
}
