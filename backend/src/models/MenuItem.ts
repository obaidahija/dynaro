import mongoose, { Document, Schema } from 'mongoose';

export interface IVariation {
  name: string;
  price_modifier: number;
}

export interface IMenuItem extends Document {
  store_id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; name: string };
  tags: string[];
  variations?: IVariation[];
  is_active: boolean;
  show_on_display: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

const variationSchema = new Schema<IVariation>({
  name: {
    type: String,
    required: true
  },
  price_modifier: {
    type: Number,
    required: true,
    default: 0
  }
}, { _id: false });

const menuItemSchema = new Schema<IMenuItem>({
  store_id: {
    type: Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image_url: String,
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  tags: [{
    type: String,
    trim: true
  }],
  variations: [variationSchema],
  is_active: {
    type: Boolean,
    default: true
  },
  show_on_display: {
    type: Boolean,
    default: false
  },
  sort_order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for performance
menuItemSchema.index({ store_id: 1, is_active: 1 });
menuItemSchema.index({ store_id: 1, category: 1, sort_order: 1 });

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', menuItemSchema);