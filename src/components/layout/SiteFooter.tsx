import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

const shopLinks = [
  { href: "/marketplace", label: "All furniture" },
  { href: "/categories", label: "Categories" },
  { href: "/sellers", label: "Seller directory" },
  { href: "/wishlist", label: "Wishlist" },
];

const companyLinks = [
  { href: "/about", label: "About FurnitureX" },
  { href: "/contact", label: "Contact" },
  { href: "/register?role=seller", label: "Sell on FurnitureX" },
];

const supportLinks = [
  { href: "/contact", label: "Help & support" },
  { href: "/terms", label: "Terms of service" },
  { href: "/privacy", label: "Privacy policy" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] lg:gap-12">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              A considered furniture marketplace connecting independent makers with people
              furnishing homes and workspaces.
            </p>
            <Link
              href="/marketplace"
              className="mt-4 inline-flex text-sm font-medium text-primary transition-colors hover:text-primary-hover"
            >
              Explore the marketplace
            </Link>
          </div>

          <FooterColumn title="Shop" links={shopLinks} />
          <FooterColumn title="Company" links={companyLinks} />
          <FooterColumn title="Support" links={supportLinks} />
        </div>

        <div className="mt-9 flex flex-col gap-3 border-t border-border pt-5 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} FurnitureX. All rights reserved.</p>
          <p>Reviewed listings · Transparent USD pricing · Cash on Delivery</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-primary">
        {title}
      </h2>
      <ul className="mt-3 space-y-2.5">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link
              href={link.href}
              className="text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
