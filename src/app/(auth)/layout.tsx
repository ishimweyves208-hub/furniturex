import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

const benefits = [
  "Save furniture you love to your wishlist.",
  "Place Cash on Delivery orders with trusted sellers.",
  "Track every order from your customer dashboard.",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-primary-soft p-10 lg:flex">
          <Logo />
          <div className="max-w-sm">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-text-primary">
              Furniture for every space.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              Join FurnitureX to shop quality furniture from trusted sellers.
            </p>
            <ul className="mt-6 space-y-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-text-muted">
            Reviewed listings · USD pricing · Cash on Delivery
          </p>
        </div>

        <div className="flex flex-col">
          <div className="container flex h-16 items-center justify-between">
            <Logo className="lg:hidden" />
            <Link
              href="/marketplace"
              className="ml-auto text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Browse marketplace
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center px-4 pb-12 pt-4 sm:px-6">
            <div className="w-full max-w-md">{children}</div>
          </div>
          <div className="container flex flex-wrap gap-x-6 gap-y-2 pb-6 text-xs text-text-muted">
            <Link href="/terms" className="hover:text-text-primary">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-text-primary">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-text-primary">
              Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
