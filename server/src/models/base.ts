import mongoose, { type Model, Schema } from 'mongoose';

export function defineModel<T extends mongoose.Document>(
  name: string,
  schema: Schema<T>
): Model<T> {
  const existing = mongoose.models[name] as Model<T> | undefined;
  return existing ?? mongoose.model<T>(name, schema);
}

export function transformJson(ret: any): any {
  if (ret && ret._id !== undefined && ret._id !== null) {
    ret.id = String(ret._id);
    delete ret._id;
  }
  if (ret) delete ret.__v;
  return ret;
}

export const baseOptions: any = {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: false, transform: (_doc: any, ret: any) => transformJson(ret) },
  toObject: { virtuals: false, transform: (_doc: any, ret: any) => transformJson(ret) },
};

export const imageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String },
    thumbnailUrl: { type: String },
    width: { type: Number },
    height: { type: Number },
    format: { type: String },
    bytes: { type: Number },
  },
  { _id: false }
);

export function enumValues(values: Record<string, string> | string[] | any): string[] {
  return Array.isArray(values) ? (values as string[]) : Object.values(values as object).map(String);
}
