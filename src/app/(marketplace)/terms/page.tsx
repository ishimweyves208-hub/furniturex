import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description: "The terms that govern buying and selling furniture on FurnitureX.",
};

const sections = [
  {
    title: "1. About FurnitureX",
    body: [
      "FurnitureX is a marketplace that connects customers with independent furniture sellers. Unless expressly stated, FurnitureX is not the manufacturer or seller of the furniture listed on the platform.",
      "Each listing identifies the seller responsible for the product, its description and fulfilment. FurnitureX reviews listings before publication but does not guarantee every detail supplied by a seller.",
    ],
  },
  {
    title: "2. Accounts",
    body: [
      "You must provide accurate information when creating an account and keep your login credentials secure. You are responsible for activity under your account.",
      "Seller accounts are subject to application review. We may suspend or disable accounts that breach these terms, misrepresent products, or harm other users.",
    ],
  },
  {
    title: "3. Listings & pricing",
    body: [
      "All prices are displayed in US dollars (USD). Prices, stock and availability may change until an order is placed.",
      "Sellers are responsible for ensuring listings are accurate, lawful and do not infringe third-party rights. FurnitureX may remove, reject or suspend listings that do not meet our standards.",
    ],
  },
  {
    title: "4. Orders & payment",
    body: [
      "FurnitureX currently supports Cash on Delivery only. You pay the courier in cash when your order arrives. No card details are collected online.",
      "A single checkout may create separate orders when items come from different sellers. Each seller fulfils their own order and delivery timing may differ.",
      "Orders can be cancelled by you before the seller confirms or processes them, subject to the options shown in your account. Delivered orders become payable and are marked paid on delivery.",
    ],
  },
  {
    title: "5. Delivery, returns & faults",
    body: [
      "Delivery arrangements, lead times and any assembly are handled by the seller. Please inspect your furniture on delivery and raise any visible damage with the courier and seller promptly.",
      "Faults, returns and replacements are governed by the seller's stated policy and applicable consumer law. Contact support if you cannot resolve an issue with a seller.",
    ],
  },
  {
    title: "6. Content & conduct",
    body: [
      "Comments and reviews must be honest, relevant and respectful. Do not post unlawful, misleading, abusive or infringing content. We may hide content that breaches these rules.",
      "Reviews are intended for customers with delivered orders. Manipulating ratings or reviews is prohibited.",
    ],
  },
  {
    title: "7. Liability",
    body: [
      "To the extent permitted by law, FurnitureX is not liable for indirect or consequential loss arising from the marketplace. Nothing in these terms excludes liability that cannot lawfully be excluded.",
      "Our total liability for any claim relating to the platform is limited to the fees FurnitureX received for the transaction giving rise to the claim, where applicable.",
    ],
  },
  {
    title: "8. Changes",
    body: [
      "We may update these terms as the marketplace evolves. Material changes will be communicated on the platform. Continued use after an update means you accept the revised terms.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-8 sm:py-10">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Terms & conditions</h1>
      <p className="mt-2 text-sm text-text-secondary">Last updated: {new Date().getFullYear()}</p>
      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold text-text-primary">{section.title}</h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed text-text-secondary">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
