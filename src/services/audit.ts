import { Types } from "mongoose";
import { connectDb } from "@/lib/db/connect";
import { AuditLog } from "@/models/AuditLog";

export interface AuditInput {
  actorId?: Types.ObjectId | string | null;
  actorEmail?: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export async function recordAudit(input: AuditInput): Promise<void> {
  await connectDb();
  await AuditLog.create({
    actorId: input.actorId ?? null,
    actorEmail: input.actorEmail,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    metadata: input.metadata,
  });
}
