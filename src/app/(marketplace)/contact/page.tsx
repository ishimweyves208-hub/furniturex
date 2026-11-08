import type { Metadata } from "next";
import { Mail, MessageSquare, Truck } from "lucide-react";
import { ContactForm } from "@/components/marketplace/ContactForm";
import { getPlatformSettings } from "@/services/settings";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact the FurnitureX team about orders, delivery, listings or selling on the marketplace.",
};

export default async function ContactPage() {
  const settings = await getPlatformSettings().catch(() => null);
  const supportEmail = settings?.supportEmail ?? "support@furniturex.example";

  return (
    <div className="container py-8 sm:py-10">
      <div className="max-w-2xl">
        <p className="eyebrow">Support</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          We are here to help.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary sm:text-base">
          Questions about an order, a piece, delivery or selling on FurnitureX? Send us a note and the
          right person will reply.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.7fr]">
        <ContactForm supportEmail={supportEmail} />
        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-background p-5">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="mt-2 text-base font-semibold text-text-primary">Email</h2>
            <p className="mt-1 text-sm text-text-secondary">For order and account support.</p>
            <a
              href={`mailto:${supportEmail}`}
              className="mt-2 inline-block text-sm text-primary underline underline-offset-4"
            >
              {supportEmail}
            </a>
          </div>
          <div className="rounded-xl border border-border bg-background p-5">
            <Truck className="h-5 w-5 text-primary" />
            <h2 className="mt-2 text-base font-semibold text-text-primary">Orders & delivery</h2>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              Delivery is coordinated by each seller and paid in cash on arrival. Track status under
              your account orders.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background p-5">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="mt-2 text-base font-semibold text-text-primary">Sellers</h2>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              Applying to sell is free. Submit an application and our team will review your studio and
              first listings.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
