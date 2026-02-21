import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  store_type: string;   // id from storeTypes.json
  is_disabled: boolean;
  sort_order: number;
  created_at: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    store_type: {
      type: String,
      required: true,
      trim: true,
    },
    is_disabled: {
      type: Boolean,
      default: false,
    },
    sort_order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  },
);

// Unique category name per store_type, fast lookup by store_type
categorySchema.index({ name: 1, store_type: 1 }, { unique: true });

export const Category = mongoose.model<ICategory>('Category', categorySchema);
