import { jsonError, jsonOk } from "@/lib/api";
import { listActiveCategories } from "@/services/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await listActiveCategories();
    return jsonOk({ categories });
  } catch (error) {
    return jsonError(error);
  }
}
