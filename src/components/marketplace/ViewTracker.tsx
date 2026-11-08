"use client";

import { useEffect } from "react";

export function ViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    const key = `fx:viewed:${productId}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // Storage can be unavailable in private modes; the server still dedupes.
    }
    const controller = new AbortController();
    void fetch(`/api/products/${productId}/view`, {
      method: "POST",
      signal: controller.signal,
      keepalive: true,
    }).catch(() => undefined);
    return () => controller.abort();
  }, [productId]);

  return null;
}
