import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IAuditLog {
  _id: Types.ObjectId;
  actorId?: Types.ObjectId | null;
  actorEmail?: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    actorEmail: { type: String, maxlength: 254 },
    action: { type: String, required: true, index: true, maxlength: 120 },
    targetType: { type: String, required: true, index: true, maxlength: 80 },
    targetId: { type: String, maxlength: 120 },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog: Model<IAuditLog> =
  models.AuditLog ?? model<IAuditLog>("AuditLog", auditLogSchema);
