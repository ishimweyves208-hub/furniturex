import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  pathname,
  searchParams,
}: {
  page: number;
  totalPages: number;
  pathname: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === "string" && value && key !== "page") params.set(key, value);
    }
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const pages: (number | "ellipsis")[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (start > 1) {
    pages.unshift(1);
    if (start > 2) pages.splice(1, 0, "ellipsis");
  }
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push("ellipsis");
    pages.push(totalPages);
  }

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-text-secondary transition-colors hover:border-primary/40 hover:text-primary",
          page <= 1 && "pointer-events-none opacity-40",
        )}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>
      {pages.map((entry, index) =>
        entry === "ellipsis" ? (
          <span key={`e-${index}`} className="px-2 text-text-muted">
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={hrefFor(entry)}
            aria-current={entry === page ? "page" : undefined}
            className={cn(
              "flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm transition-colors",
              entry === page
                ? "border-primary bg-primary text-white"
                : "border-border bg-background text-text-secondary hover:border-primary/40 hover:text-primary",
            )}
          >
            {entry}
          </Link>
        ),
      )}
      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-text-secondary transition-colors hover:border-primary/40 hover:text-primary",
          page >= totalPages && "pointer-events-none opacity-40",
        )}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
