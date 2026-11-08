import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="FurnitureX home"
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <span
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white",
          compact && "h-7 w-7 text-xs",
        )}
        aria-hidden
      >
        F
      </span>
      <span
        className={cn(
          "text-lg font-semibold tracking-tight text-text-primary",
          compact && "text-base",
        )}
      >
        Furniture<span className="text-primary">X</span>
      </span>
    </Link>
  );
}
