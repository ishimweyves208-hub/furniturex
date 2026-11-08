import { Types } from "mongoose";
import { connectDb } from "@/lib/db/connect";
import { Notification } from "@/models/Notification";
import type { NotificationType } from "@/lib/constants";

export interface NotifyInput {
  userId: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

export async function notify(input: NotifyInput): Promise<void> {
  await connectDb();
  await Notification.create({
    userId: input.userId,
    type: input.type,
    title: input.title.slice(0, 160),
    message: input.message.slice(0, 1000),
    link: input.link?.slice(0, 500),
  });
}

export async function notifyMany(inputs: NotifyInput[]): Promise<void> {
  if (inputs.length === 0) return;
  await connectDb();
  await Notification.insertMany(
    inputs.map((input) => ({
      userId: input.userId,
      type: input.type,
      title: input.title.slice(0, 160),
      message: input.message.slice(0, 1000),
      link: input.link?.slice(0, 500),
    })),
  );
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  await connectDb();
  return Notification.countDocuments({ userId, readAt: null });
}

export async function listNotifications(
  userId: string,
  options: { page?: number; pageSize?: number } = {},
) {
  await connectDb();
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(Math.max(options.pageSize ?? 20, 1), 50);
  const [items, total, unread] = await Promise.all([
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Notification.countDocuments({ userId }),
    Notification.countDocuments({ userId, readAt: null }),
  ]);
  return {
    items: items.map((item) => ({
      id: String(item._id),
      type: item.type,
      title: item.title,
      message: item.message,
      link: item.link,
      readAt: item.readAt ? item.readAt.toISOString() : null,
      createdAt: item.createdAt.toISOString(),
    })),
    total,
    unread,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
