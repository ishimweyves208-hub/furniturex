"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Spinner } from "@/components/ui/Feedback";
import { cn } from "@/lib/utils";

export function SignOutButton({
  className,
  label = "Sign out",
  variant = "ghost",
}: {
  className?: string;
  label?: string;
  variant?: "ghost" | "outline" | "primary";
}) {
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      setPending(false);
    }
  }

  const variantClasses = {
    ghost: "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
    outline: "border border-border bg-background text-text-secondary hover:bg-bg-hover",
    primary: "bg-primary text-white hover:bg-primary-hover",
  };

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-60",
        variantClasses[variant],
        className,
      )}
    >
      {pending ? <Spinner /> : <LogOut className="h-4 w-4" />}
      {label}
    </button>
  );
}
