import type { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { requireApiUser } from "@/lib/auth/session";
import { connectDb } from "@/lib/db/connect";
import { AuditLog } from "@/models/AuditLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireApiUser({ roles: ["superadmin"] });
    await connectDb();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(
      Math.max(Number.parseInt(searchParams.get("pageSize") ?? "30", 10) || 30, 1),
      100,
    );
    const q = searchParams.get("q");
    const filter: Record<string, unknown> = {};
    if (q) {
      const pattern = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 100), "i");
      filter.$or = [{ action: pattern }, { actorEmail: pattern }, { targetType: pattern }];
    }
    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);
    return jsonOk({
      items: items.map((item) => ({
        id: String(item._id),
        action: item.action,
        actorEmail: item.actorEmail,
        actorId: item.actorId ? String(item.actorId) : null,
        targetType: item.targetType,
        targetId: item.targetId,
        metadata: item.metadata,
        createdAt: item.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return jsonError(error);
  }
}
