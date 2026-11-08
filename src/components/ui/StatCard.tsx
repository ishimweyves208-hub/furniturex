import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "warning";
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold leading-none text-text-primary",
          tone === "positive" && "text-green-700",
          tone === "warning" && "text-amber-700",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-text-secondary">{hint}</p> : null}
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{children}</div>;
}
