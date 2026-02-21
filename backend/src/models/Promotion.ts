import mongoose, { Document, Schema } from 'mongoose';

export interface IPromotionConditions {
  min_quantity?: number;
  max_uses?: number;
  current_uses: number;
}

export interface IPromotionDisplayConfig {
  badge_text: string;
  badge_color: string;
  highlight_items: boolean;
  banner_image_url?: string;
  side_image_url?: string;
}

export interface IPromotion extends Document {
  store_id: mongoose.Types.ObjectId;
  name: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_time: Date;
  end_time: Date;
  applicable_items: mongoose.Types.ObjectId[];
  conditions?: IPromotionConditions;
  display_config: IPromotionDisplayConfig;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const promotionConditionsSchema = new Schema<IPromotionConditions>({
  min_quantity: Number,
  max_uses: Number,
  current_uses: {
    type: Number,
    default: 0
  }
}, { _id: false });

const promotionDisplayConfigSchema = new Schema<IPromotionDisplayConfig>({
  badge_text: {
    type: String,
    required: true,
    default: 'SALE'
  },
  badge_color: {
    type: String,
    default: '#EF4444'
  },
  highlight_items: {
    type: Boolean,
    default: true
  },
  banner_image_url: { type: String },
  side_image_url: { type: String },
}, { _id: false });

const promotionSchema = new Schema<IPromotion>({
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
  discount_type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discount_value: {
    type: Number,
    required: true,
    min: 0
  },
  start_time: {
    type: Date,
    required: true
  },
  end_time: {
    type: Date,
    required: true
  },
  applicable_items: [{
    type: Schema.Types.ObjectId,
    ref: 'MenuItem'
  }],
  conditions: promotionConditionsSchema,
  display_config: {
    type: promotionDisplayConfigSchema,
    default: () => ({})
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for performance
promotionSchema.index({ store_id: 1, is_active: 1, start_time: 1, end_time: 1 });

export const Promotion = mongoose.model<IPromotion>('Promotion', promotionSchema);