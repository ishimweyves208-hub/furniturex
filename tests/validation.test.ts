import { describe, expect, it } from "vitest";
import {
  addressInputSchema,
  checkoutSchema,
  productInputSchema,
  reviewInputSchema,
} from "@/lib/validation/product";
import {
  loginSchema,
  profileSchema,
  registerSchema,
} from "@/lib/validation/auth";

const product = {
  name: "Halden Sofa",
  categoryId: "64b7f0c2f0f0f0f0f0f0f0f0",
  description: "A generous sofa with a solid oak frame and bouclé upholstery.",
  price: 2890,
  stock: 2,
  images: [{ url: "https://images.unsplash.com/photo-1", isPrimary: true }],
};

describe("product validation", () => {
  it("accepts a complete listing and coerces numerics", () => {
    const parsed = productInputSchema.parse({
      ...product,
      price: "2890.50",
      stock: "4",
      materials: "Oak, Bouclé",
      dimensions: { width: "92", unit: "in" },
    });
    expect(parsed.price).toBe(2890.5);
    expect(parsed.stock).toBe(4);
    expect(parsed.materials).toBe("Oak, Bouclé");
  });

  it("requires at least one image and a substantial description", () => {
    const result = productInputSchema.safeParse({ ...product, images: [], description: "Too short" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toContain("images");
      expect(paths).toContain("description");
    }
  });

  it("only accepts HTTPS image URLs", () => {
    expect(
      productInputSchema.safeParse({ ...product, images: [{ url: "http://example.com/a.jpg" }] }).success,
    ).toBe(false);
  });

  it("rejects unsupported actions", () => {
    expect(productInputSchema.safeParse({ ...product, action: "publish" }).success).toBe(false);
  });
});

describe("checkout validation", () => {
  const checkout = {
    fullName: "Demo Customer",
    phone: "+1 555 0100",
    addressLine1: "12 Market Street",
    city: "Hudson",
    country: "United States",
    idempotencyKey: "3f3b9d2a-5a4a-4f6f-8a88-2a7d0c9b1e11",
  };

  it("accepts a valid COD checkout without a gateway field", () => {
    expect(checkoutSchema.safeParse(checkout).success).toBe(true);
  });

  it("requires a UUID idempotency key", () => {
    expect(checkoutSchema.safeParse({ ...checkout, idempotencyKey: "retry" }).success).toBe(false);
  });
});

describe("account validation", () => {
  it("rejects mismatched registration passwords", () => {
    const result = registerSchema.safeParse({
      name: "Demo User",
      email: "USER@Example.com",
      password: "Demo1234!",
      confirmPassword: "Different1",
      role: "customer",
      acceptTerms: true,
    });
    expect(result.success).toBe(false);
  });

  it("requires a shop name for seller registration", () => {
    const result = registerSchema.safeParse({
      name: "Demo User",
      email: "seller@example.com",
      password: "Demo1234!",
      confirmPassword: "Demo1234!",
      role: "seller",
      shopName: "",
      acceptTerms: true,
    });
    expect(result.success).toBe(false);
  });

  it("normalises emails and rejects weak passwords", () => {
    const parsed = loginSchema.parse({ email: " Person@Example.com ", password: "secret" });
    expect(parsed.email).toBe("person@example.com");
    expect(registerSchema.safeParse({
      name: "Demo User",
      email: "a@b.co",
      password: "short",
      confirmPassword: "short",
      role: "customer",
      acceptTerms: true,
    }).success).toBe(false);
  });

  it("validates profile avatar and address fields", () => {
    expect(profileSchema.safeParse({ name: "Demo User", avatar: "not-a-url" }).success).toBe(false);
    expect(addressInputSchema.safeParse({
      label: "Home",
      fullName: "Demo User",
      phone: "+1 555 0100",
      addressLine1: "12 Market Street",
      city: "Hudson",
      country: "United States",
    }).success).toBe(true);
  });

  it("restricts reviews to a 1-5 integer rating", () => {
    const base = {
      productId: "64b7f0c2f0f0f0f0f0f0f0f0",
      orderId: "64b7f0c2f0f0f0f0f0f0f0f1",
      content: "Beautifully made and comfortable.",
    };
    expect(reviewInputSchema.safeParse({ ...base, rating: 5 }).success).toBe(true);
    expect(reviewInputSchema.safeParse({ ...base, rating: 6 }).success).toBe(false);
    expect(reviewInputSchema.safeParse({ ...base, rating: 4.5 }).success).toBe(false);
  });
});
