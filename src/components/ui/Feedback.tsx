import { AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const alertTones = {
  info: "border-border bg-background text-text-primary",
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

const alertIcons = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertCircle,
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof alertTones;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const Icon = alertIcons[tone];
  return (
    <div className={cn("flex gap-3 border p-4 text-sm rounded-lg", alertTones[tone], className)} role="status">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title && "mt-1", "leading-relaxed opacity-90")}>{children}</div> : null}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center border border-dashed border-border bg-background px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? <div className="mb-4 text-text-muted">{icon}</div> : null}
      <h3 className="font-display text-2xl text-text-primary">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin text-primary", className)} aria-hidden />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-4">
          <Skeleton className="aspect-[4/5] w-full rounded-lg" />
          <Skeleton className="h-3 w-1/3 rounded" />
          <Skeleton className="h-5 w-2/3 rounded" />
          <Skeleton className="h-4 w-1/4 rounded" />
        </div>
      ))}
    </div>
  );
}

export function Price({
  cents,
  currency = "USD",
  className,
}: {
  cents: number;
  currency?: string;
  className?: string;
}) {
  return (
    <span className={className}>
      {new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
      }).format(cents / 100)}
    </span>
  );
}
