import { describe, expect, it } from "vitest";
import {
  buildQueryString,
  clamp,
  dollarsToCents,
  formatCurrency,
  initials,
  slugify,
  truncate,
} from "@/lib/utils";

describe("slugify", () => {
  it("normalises accents, spaces and punctuation", () => {
    expect(slugify("  Café & Oak — Sideboard  ")).toBe("cafe-oak-sideboard");
  });

  it("limits slugs to 80 characters", () => {
    expect(slugify("a".repeat(120))).toHaveLength(80);
  });
});

describe("currency helpers", () => {
  it("converts dollars to integer cents without floating point drift", () => {
    expect(dollarsToCents(19.99)).toBe(1999);
    expect(dollarsToCents("0.1")).toBe(10);
    expect(dollarsToCents("not-a-number")).toBeNaN();
  });

  it("formats whole-dollar amounts without decimals", () => {
    expect(formatCurrency(199900)).toBe("$1,999");
    expect(formatCurrency(199950)).toBe("$1,999.50");
  });
});

describe("query helpers", () => {
  it("preserves current params and removes empty updates", () => {
    const query = buildQueryString(
      { status: "pending", page: "2", q: "" },
      { page: 3, q: "", status: null },
    );
    expect(query).toBe("?page=3");
  });

  it("clamps and truncates values", () => {
    expect(clamp(12, 0, 10)).toBe(10);
    expect(truncate("abcdefghij", 5)).toBe("abcde…");
  });

  it("builds initials from the first two names", () => {
    expect(initials("Mara Ellison")).toBe("ME");
  });
});
