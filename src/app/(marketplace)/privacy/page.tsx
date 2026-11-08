import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How FurnitureX collects, uses and protects your personal information.",
};

const sections = [
  {
    title: "Information we collect",
    body: [
      "Account details such as your name, email address, phone number and password hash. Passwords are stored using a one-way bcrypt hash and are never visible to our team.",
      "Order and delivery information, including the address and phone number needed for Cash on Delivery fulfilment. Sellers receive only the information required to fulfil their orders.",
      "Marketplace activity such as saved items, cart contents, comments, reviews and product views. We use a first-party viewer cookie to count unique views without advertising trackers.",
      "Technical information needed to operate and secure the service, such as session records and server logs.",
    ],
  },
  {
    title: "How we use information",
    body: [
      "To create and manage your account, process orders, coordinate delivery, prevent fraud and provide support.",
      "To show sellers the information needed to fulfil their orders, and to show you relevant order and product updates.",
      "To improve the marketplace through aggregated analytics such as product views, cart additions and sales performance. Sellers see analytics for their own listings.",
      "To send transactional emails such as verification and password reset messages. We do not sell personal information.",
    ],
  },
  {
    title: "Cookies",
    body: [
      "We use a strictly necessary session cookie to keep you signed in. It is httpOnly and is not accessible to client-side scripts.",
      "We use a first-party viewer cookie to count unique product views. It contains a random identifier and is used only for marketplace analytics.",
    ],
  },
  {
    title: "Sharing",
    body: [
      "Order information is shared with the relevant seller so they can fulfil your order, and with delivery partners where needed.",
      "We use infrastructure providers for hosting, database, file storage and transactional email. These providers process data on our behalf under appropriate safeguards.",
      "We may disclose information where required by law or to protect the rights and safety of users and the platform.",
    ],
  },
  {
    title: "Retention & security",
    body: [
      "We retain account and order records for as long as needed to provide the service, meet legal obligations and resolve disputes. Session records are removed when they expire or are revoked.",
      "We apply access controls, hashing, rate limiting and reviewed server-side validation. No system is perfectly secure, so please use a strong, unique password.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You can update your profile details, change your password, manage saved addresses and revoke sessions from your account settings.",
      "You may request access, correction or deletion of your personal information by contacting support. Some records may need to be retained for legal or accounting reasons.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-8 sm:py-10">
      <p className="eyebrow">Legal</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Privacy policy</h1>
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
