import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { buttonClasses } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <Logo />
      <p className="eyebrow mt-10">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">This page has moved on.</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-text-secondary">
        The page you are looking for may have been removed, renamed or never existed.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonClasses("primary")}>Back home</Link>
        <Link href="/marketplace" className={buttonClasses("outline")}>Browse marketplace</Link>
      </div>
    </div>
  );
}
