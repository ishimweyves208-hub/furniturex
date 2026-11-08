import "./load-env";
import mongoose from "mongoose";
import { connectDb } from "@/lib/db/connect";
import { User } from "@/models/User";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { PlatformSetting } from "@/models/PlatformSetting";
import { hashPassword } from "@/lib/auth/password";
import { slugify } from "@/lib/utils";

const image = (file: string, alt: string) => ({
  url: `/demo/${file}`,
  alt,
  isPrimary: true,
});

const CATEGORIES = [
  {
    name: "Sofas",
    slug: "sofas",
    description: "Deep seats, sculptural silhouettes and everyday comfort.",
    image: "/demo/sofa-living.jpg",
    order: 1,
  },
  {
    name: "Beds",
    slug: "beds",
    description: "Calm bedrooms built around solid timber and soft linen.",
    image: "/demo/bed.jpg",
    order: 2,
  },
  {
    name: "Chairs",
    slug: "chairs",
    description: "Lounge chairs, dining chairs and considered seating.",
    image: "/demo/armchair.jpg",
    order: 3,
  },
  {
    name: "Tables",
    slug: "tables",
    description: "Dining tables, coffee tables and side tables in solid wood.",
    image: "/demo/dining-table.jpg",
    order: 4,
  },
  {
    name: "Wardrobes",
    slug: "wardrobes",
    description: "Quiet storage with thoughtful interiors and clean fronts.",
    image: "/demo/wardrobe.jpg",
    order: 5,
  },
  {
    name: "Cabinets",
    slug: "cabinets",
    description: "Sideboards, cabinets and bedside storage.",
    image: "/demo/cabinet.jpg",
    order: 6,
  },
  {
    name: "Office Furniture",
    slug: "office-furniture",
    description: "Desks, task chairs and pieces for a focused workspace.",
    image: "/demo/office.jpg",
    order: 7,
  },
  {
    name: "Outdoor Furniture",
    slug: "outdoor-furniture",
    description: "Weather-ready seating and dining for open-air rooms.",
    image: "/demo/outdoor.jpg",
    order: 8,
  },
];

const PRODUCTS = [
  {
    seller: 0,
    category: "sofas",
    name: "Halden Sculptural Sofa",
    description:
      "A low, generous three-seat sofa with a solid oak frame and hand-finished bouclé upholstery. The deep seat and softened arms bring an easy, sculptural presence to a living room.",
    priceCents: 289000,
    stock: 4,
    materials: ["Solid oak", "Bouclé", "High-resilience foam"],
    color: "Oat",
    dimensions: { width: 92, depth: 38, height: 29, unit: "in" as const },
    image: image("sofa-living.jpg", "Halden sculptural sofa in a warm living room"),
    featured: true,
  },
  {
    seller: 0,
    category: "chairs",
    name: "Arlo Lounge Chair",
    description:
      "A compact lounge chair with a steam-bent oak frame and saddle-leather seat. Made one at a time in a small workshop, it is equally at home beside a window or at the end of a long dining table.",
    priceCents: 68000,
    stock: 12,
    materials: ["Steam-bent oak", "Saddle leather"],
    color: "Cognac",
    dimensions: { width: 27, depth: 30, height: 31, unit: "in" as const },
    image: image("armchair.jpg", "Arlo lounge chair with a leather seat"),
    featured: true,
  },
  {
    seller: 1,
    category: "tables",
    name: "Mira Oak Dining Table",
    description:
      "A quietly proportioned dining table in solid white oak, finished with a hard-wax oil that deepens with age. The tapered legs are hand-shaped so the table feels light despite its substantial top.",
    priceCents: 178000,
    stock: 6,
    materials: ["Solid white oak", "Hard-wax oil"],
    color: "Natural oak",
    dimensions: { width: 86, depth: 38, height: 30, unit: "in" as const },
    image: image("dining-table.jpg", "Mira oak dining table set for dinner"),
    featured: true,
  },
  {
    seller: 1,
    category: "chairs",
    name: "Juniper Dining Chair",
    description:
      "A slender dining chair with a woven paper-cord seat that softens over time. The frame is made from responsibly sourced ash and assembled with traditional joinery for decades of daily use.",
    priceCents: 32000,
    stock: 24,
    materials: ["Ash", "Paper cord"],
    color: "Natural",
    dimensions: { width: 18, depth: 20, height: 32, unit: "in" as const },
    image: image("armchair.jpg", "Juniper woven dining chair"),
  },
  {
    seller: 0,
    category: "beds",
    name: "Fen Linen Bed",
    description:
      "A low platform bed in solid walnut with a softly upholstered headboard and a relaxed linen slipcover. Designed to feel grounded without making the room feel heavy.",
    priceCents: 212000,
    stock: 5,
    materials: ["Walnut", "Linen", "Oak slats"],
    color: "Warm linen",
    dimensions: { width: 68, depth: 84, height: 38, unit: "in" as const },
    image: image("bed.jpg", "Fen linen bed in a calm bedroom"),
    featured: true,
  },
  {
    seller: 0,
    category: "cabinets",
    name: "Fen Bedside Table",
    description:
      "A small bedside table with a single soft-close drawer and an open shelf for the book you are actually reading. Made from walnut with a hand-rubbed oil finish and a solid brass pull.",
    priceCents: 42000,
    stock: 15,
    materials: ["Walnut", "Brass"],
    color: "Walnut",
    dimensions: { width: 18, depth: 15, height: 22, unit: "in" as const },
    image: image("cabinet.jpg", "Fen walnut bedside table"),
  },
  {
    seller: 1,
    category: "cabinets",
    name: "Loom Sideboard",
    description:
      "A four-door sideboard with reeded oak fronts and adjustable interior shelving. Designed to hide the everyday and display the considered, it is finished on all sides so it can float in a room.",
    priceCents: 156000,
    stock: 5,
    materials: ["Reeded oak", "Solid brass"],
    color: "Smoked oak",
    dimensions: { width: 72, depth: 18, height: 31, unit: "in" as const },
    image: image("cabinet.jpg", "Loom reeded oak sideboard"),
    featured: true,
  },
  {
    seller: 1,
    category: "tables",
    name: "Pillar Coffee Table",
    description:
      "A low coffee table with a travertine top and three sculptural stone legs. The honed surface is sealed against everyday spills, while the natural voids and tonal variation make each table unique.",
    priceCents: 118000,
    stock: 3,
    materials: ["Travertine"],
    color: "Sand",
    dimensions: { width: 48, depth: 28, height: 14, unit: "in" as const },
    image: image("coffee-table.jpg", "Pillar travertine coffee table"),
    featured: true,
  },
  {
    seller: 1,
    category: "wardrobes",
    name: "Alder Wardrobe",
    description:
      "A full-height wardrobe with push-latch doors and a fitted interior for hanging, folded and seasonal storage. The pale ash frame is finished with a low-sheen natural oil.",
    priceCents: 198000,
    stock: 4,
    materials: ["Ash", "Solid oak", "Brass hardware"],
    color: "Pale ash",
    dimensions: { width: 62, depth: 24, height: 84, unit: "in" as const },
    image: image("wardrobe.jpg", "Alder ash wardrobe with fitted interior"),
  },
  {
    seller: 0,
    category: "sofas",
    name: "Loom Modular Sofa",
    description:
      "A relaxed modular sofa that can be arranged as a two-seat lounge or extended for a full room. Feather-wrapped cushions sit on a kiln-dried hardwood frame for a softer, lived-in feel.",
    priceCents: 246000,
    stock: 6,
    materials: ["Kiln-dried hardwood", "Wool blend", "Feather wrap"],
    color: "Stone",
    dimensions: { width: 108, depth: 40, height: 30, unit: "in" as const },
    image: image("lounge-sofa.jpg", "Loom modular sofa in a light living room"),
  },
  {
    seller: 1,
    category: "office-furniture",
    name: "Mercer Writing Desk",
    description:
      "A slim writing desk with a cable channel, a shallow pencil drawer and tapered legs. Sized for a quiet corner or a home office that needs to stay flexible.",
    priceCents: 96000,
    stock: 8,
    materials: ["White oak", "Powder-coated steel"],
    color: "Natural oak",
    dimensions: { width: 54, depth: 24, height: 30, unit: "in" as const },
    image: image("office.jpg", "Mercer writing desk in a bright home office"),
    featured: true,
  },
  {
    seller: 0,
    category: "outdoor-furniture",
    name: "Sol Outdoor Lounge Set",
    description:
      "A two-seat outdoor lounge with a teak frame, quick-dry cushions and a low table. Built for balconies, patios and long afternoons outside.",
    priceCents: 174000,
    stock: 5,
    materials: ["Teak", "Quick-dry foam", "Weatherproof fabric"],
    color: "Natural teak",
    dimensions: { width: 76, depth: 34, height: 28, unit: "in" as const },
    image: image("outdoor.jpg", "Sol outdoor lounge set on a patio"),
  },
  {
    seller: 1,
    category: "outdoor-furniture",
    name: "Terrace Dining Set",
    description:
      "A compact outdoor dining table with two benches in FSC-certified teak. The slatted surfaces shed rain quickly and soften to a silver-grey finish over time.",
    priceCents: 142000,
    stock: 6,
    materials: ["FSC-certified teak"],
    color: "Natural teak",
    dimensions: { width: 64, depth: 32, height: 30, unit: "in" as const },
    image: image("outdoor.jpg", "Terrace teak dining set outdoors"),
  },
];

async function seedSeller(index: number, passwordHash: string) {
  const data =
    index === 0
      ? {
          name: "Mara Ellison",
          email: "mara@furniturex.demo",
          shopName: "Ellison & Oak",
          shopSlug: "ellison-and-oak",
          shopDescription:
            "A small studio in the Hudson Valley making upholstered seating and solid timber furniture in limited runs.",
          shopLogo: "/demo/sofa-living.jpg",
        }
      : {
          name: "Theo Nakamura",
          email: "theo@furniturex.demo",
          shopName: "Nakamura Workshop",
          shopSlug: "nakamura-workshop",
          shopDescription:
            "Quiet, useful furniture in oak, ash and stone. Every piece is built to be repaired, not replaced.",
          shopLogo: "/demo/dining-table.jpg",
        };

  return User.findOneAndUpdate(
    { email: data.email },
    {
      $set: {
        ...data,
        passwordHash,
        role: "seller",
        accountStatus: "active",
        emailVerified: true,
        sellerStatus: "active",
        phone: "+1 555 0100",
      },
    },
    { upsert: true, new: true },
  );
}

async function main() {
  await connectDb();

  await PlatformSetting.findOneAndUpdate(
    { key: "platform" },
    {
      $setOnInsert: {
        key: "platform",
        deliveryFeeCents: 4900,
        freeDeliveryThresholdCents: 150000,
        requireReapprovalOnMaterialChange: true,
        supportEmail: "support@furniturex.demo",
        marketplaceTagline: "Considered furniture from independent makers.",
      },
    },
    { upsert: true },
  );

  const categories = new Map<string, mongoose.Types.ObjectId>();
  for (const category of CATEGORIES) {
    const doc = await Category.findOneAndUpdate(
      { slug: category.slug },
      { $set: { ...category, active: true } },
      { upsert: true, new: true },
    );
    categories.set(category.slug, doc._id);
  }
  console.log(`Seeded ${categories.size} categories and platform settings.`);

  if (process.env.SEED_DEMO !== "true") {
    console.log("SEED_DEMO is not true — skipped demo sellers and products.");
    return;
  }

  const password = "Demo1234!";
  const passwordHash = await hashPassword(password);
  const sellers = [await seedSeller(0, passwordHash), await seedSeller(1, passwordHash)];
  await User.findOneAndUpdate(
    { email: "demo@furniturex.demo" },
    {
      $set: {
        name: "Demo Customer",
        passwordHash,
        role: "customer",
        accountStatus: "active",
        emailVerified: true,
      },
    },
    { upsert: true },
  );

  for (const product of PRODUCTS) {
    const seller = sellers[product.seller];
    if (!seller) continue;
    const nameSlug = slugify(product.name);
    await Product.findOneAndUpdate(
      { slug: nameSlug },
      {
        $set: {
          sellerId: seller._id,
          categoryId: categories.get(product.category),
          name: product.name,
          slug: nameSlug,
          description: product.description,
          priceCents: product.priceCents,
          currency: "USD",
          images: [product.image],
          materials: product.materials,
          dimensions: product.dimensions,
          color: product.color,
          stock: product.stock,
          status: "approved",
          isFeatured: product.featured ?? false,
          isDemo: true,
          approvedAt: new Date(),
          moderatedAt: new Date(),
          submittedAt: new Date(),
          publishedAt: new Date(),
          approvedContentHash: null,
        },
      },
      { upsert: true, new: true },
    );
  }

  console.log(`Seeded ${PRODUCTS.length} demo products and 2 demo sellers.`);
  console.log("Demo sign-in (development only):");
  console.log("  Customer: demo@furniturex.demo / Demo1234!");
  console.log("  Seller:   mara@furniturex.demo / Demo1234!");
  console.log("  Seller:   theo@furniturex.demo / Demo1234!");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
  });
