import { beforeEach, describe, expect, it } from "vitest";
import { hashToken, randomToken, safeEqualHex } from "@/lib/auth/tokens";
import { rateLimit } from "@/lib/security";
import { assertSameOrigin } from "@/lib/security";
import { ApiError } from "@/lib/api";

describe("token helpers", () => {
  it("generates unique high-entropy tokens", () => {
    const first = randomToken(24);
    const second = randomToken(24);
    expect(first).toHaveLength(48);
    expect(first).not.toBe(second);
  });

  it("hashes deterministically and compares safely", () => {
    const token = randomToken();
    const hash = hashToken(token);
    expect(hash).toBe(hashToken(token));
    expect(safeEqualHex(hash, hash)).toBe(true);
    expect(safeEqualHex(hash, `${hash.slice(0, -1)}0`)).toBe(false);
    expect(safeEqualHex("nothex", "nothex")).toBe(false);
  });
});

describe("rate limiting", () => {
  beforeEach(() => {
    globalThis.__furniturexRateLimits?.clear();
  });

  it("allows up to the limit then blocks", () => {
    const options = { limit: 2, windowMs: 60_000 };
    expect(rateLimit("test-key", options).allowed).toBe(true);
    expect(rateLimit("test-key", options).allowed).toBe(true);
    const blocked = rateLimit("test-key", options);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});

describe("same-origin check", () => {
  function request(method: string, headers: Record<string, string>) {
    return new Request("https://furniturex.example/api/test", { method, headers });
  }

  it("allows safe methods and matching origins", () => {
    expect(() => assertSameOrigin(request("GET", {}))).not.toThrow();
    expect(() =>
      assertSameOrigin(request("POST", { origin: "https://furniturex.example", host: "furniturex.example" })),
    ).not.toThrow();
  });

  it("rejects cross-site mutations and mismatched origins", () => {
    expect(() => assertSameOrigin(request("POST", { "sec-fetch-site": "cross-site" }))).toThrow(ApiError);
    expect(() =>
      assertSameOrigin(request("POST", { origin: "https://evil.example", host: "furniturex.example" })),
    ).toThrow(ApiError);
  });
});
