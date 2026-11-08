import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Compass, HeartHandshake, Ruler } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About",
  description:
    "FurnitureX is a curated marketplace for independent furniture makers. Every listing is reviewed, prices are in USD, and payment is Cash on Delivery.",
};

const principles = [
  {
    icon: Compass,
    title: "Quality first",
    text: "Listings are reviewed for craftsmanship, clear materials and honest photography before publication.",
  },
  {
    icon: Ruler,
    title: "Clear details",
    text: "Dimensions, materials and finishes are surfaced so you can plan a room with confidence.",
  },
  {
    icon: HeartHandshake,
    title: "Direct with makers",
    text: "Independent studios keep their identity and relationship with customers through their own shops.",
  },
];

const steps = [
  "Independent makers apply and publish detailed listings.",
  "Our team reviews craftsmanship, materials and imagery.",
  "Approved pieces appear in the marketplace and seller shops.",
  "You order with Cash on Delivery and pay when it arrives.",
];

export default function AboutPage() {
  return (
    <div className="container py-10 sm:py-14">
      <section className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <div>
          <p className="eyebrow">About FurnitureX</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-text-primary sm:text-4xl">
            Furniture worth choosing carefully.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
            FurnitureX is a marketplace for independent makers who care about how things are made. We
            review every listing before it goes live, keep pricing transparent in USD, and let you pay
            in cash when the piece arrives.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/marketplace" className={buttonClasses("primary")}>
              Explore marketplace <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/sellers" className={buttonClasses("outline")}>
              Meet the sellers
            </Link>
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-background-alternate">
          <Image
            src="https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1400&q=85"
            alt="A warm interior with a wooden dining table and woven chairs"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
      </section>

      <section className="mt-12 border-y border-border py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          {principles.map((principle) => (
            <div key={principle.title}>
              <principle.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-3 text-base font-semibold text-text-primary">{principle.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{principle.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="order-2 lg:order-1">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            From workshop to your room.
          </h2>
          <ul className="mt-5 space-y-3">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <span className="text-sm leading-relaxed text-text-secondary">{step}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 flex items-start gap-2 text-sm text-text-secondary">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Questions about a piece, delivery or selling? We are happy to help.
          </p>
        </div>
        <div className="relative order-1 aspect-[4/3] overflow-hidden rounded-2xl bg-background-alternate lg:order-2">
          <Image
            src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=85"
            alt="A calm bedroom with natural materials and soft light"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </section>

      <section className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl bg-primary-soft px-6 py-8 sm:flex-row sm:items-center sm:px-8">
        <div>
          <h2 className="text-xl font-semibold text-text-primary sm:text-2xl">
            Sell your furniture on FurnitureX
          </h2>
          <p className="mt-1.5 text-sm text-text-secondary">
            Open a shop, publish listings and reach customers looking for quality furniture.
          </p>
        </div>
        <Link href="/register?role=seller" className={buttonClasses("primary", "lg", "shrink-0")}>
          Apply to sell
        </Link>
      </section>
    </div>
  );
}
