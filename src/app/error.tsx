"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app] unhandled error", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-danger/25 bg-danger/5 text-danger">
        <AlertCircle className="h-5 w-5" />
      </span>
      <p className="eyebrow mt-6">Something went wrong</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">We hit an unexpected error.</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-text-secondary">
        Your data is safe. Try again, or return to the marketplace if the problem continues.
      </p>
      {error.digest ? <p className="mt-2 font-mono text-[10px] text-text-muted">Reference: {error.digest}</p> : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className={buttonClasses("outline")}>Back home</Link>
      </div>
    </div>
  );
}
