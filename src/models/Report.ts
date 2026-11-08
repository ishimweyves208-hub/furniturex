import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IReport {
  _id: Types.ObjectId;
  type: string;
  requestedBy: Types.ObjectId;
  from?: Date | null;
  to?: Date | null;
  data: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    type: { type: String, required: true, index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    from: { type: Date, default: null },
    to: { type: Date, default: null },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

export const Report: Model<IReport> = models.Report ?? model<IReport>("Report", reportSchema);
