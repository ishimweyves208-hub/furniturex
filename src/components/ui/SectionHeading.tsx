import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  hrefLabel = "View all",
  action,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  action?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-heading font-semibold tracking-tight text-text-primary">{title}</h2>
        {description ? (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-secondary">{description}</p>
        ) : null}
      </div>
      {action ? (
        <div className="shrink-0 pb-1">{action}</div>
      ) : href ? (
        <Link href={href} className="link-underline shrink-0 pb-1">
          {hrefLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}
