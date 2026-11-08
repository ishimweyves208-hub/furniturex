import type { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api";
import { assertSameOrigin } from "@/lib/security";
import { requireApiUser } from "@/lib/auth/session";
import { Notification } from "@/models/Notification";
import { connectDb } from "@/lib/db/connect";
import type { NotificationDTO } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser();
    await connectDb();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(
      Math.max(Number.parseInt(searchParams.get("pageSize") ?? "20", 10) || 20, 1),
      50,
    );
    const [items, total, unread] = await Promise.all([
      Notification.find({ userId: user.id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Notification.countDocuments({ userId: user.id }),
      Notification.countDocuments({ userId: user.id, readAt: null }),
    ]);
    const dto: NotificationDTO[] = items.map((item) => ({
      id: String(item._id),
      type: item.type,
      title: item.title,
      message: item.message,
      link: item.link,
      readAt: item.readAt ? item.readAt.toISOString() : null,
      createdAt: item.createdAt.toISOString(),
    }));
    return jsonOk({
      items: dto,
      total,
      unread,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return jsonError(error);
  }
}

const readSchema = z.object({
  ids: z.array(z.string().regex(/^[a-f0-9]{24}$/i)).max(100).optional(),
  all: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const user = await requireApiUser();
    const input = readSchema.parse(await parseJsonBody(request));
    await connectDb();
    const filter: Record<string, unknown> = { userId: user.id, readAt: null };
    if (!input.all && input.ids && input.ids.length > 0) {
      filter._id = { $in: input.ids };
    }
    const result = await Notification.updateMany(filter, { $set: { readAt: new Date() } });
    return jsonOk({ updated: result.modifiedCount });
  } catch (error) {
    return jsonError(error);
  }
}
