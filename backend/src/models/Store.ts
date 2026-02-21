import mongoose, { Document, Schema } from 'mongoose';
import { ILayoutConfig, DEFAULT_LAYOUT } from './DisplayTemplate';

export interface IBranding {
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
}

export interface ITemplateConfig {
  background_image?: string;
  show_descriptions: boolean;
  show_categories: boolean;
  grid_columns: number;
  promotional_banner_text?: string;
}

export interface ILayoutOverrides {
  /** Per-template ordered item selection: { [templateId]: itemId[] } */
  display_items_by_template?: Record<string, string[]>;
}

export interface IPlaylistSlide {
  _id: mongoose.Types.ObjectId;
  label?: string;
  item_ids: string[];
  duration_sec: number;
  layout: ILayoutConfig;
}

export interface IStore extends Document {
  name: string;
  owner_id: mongoose.Types.ObjectId;
  timezone: string;
  is_active: boolean;
  store_type: string;  // id from storeTypes.json (e.g. 'coffee_shop')
  branding: IBranding;
  template_id: mongoose.Types.ObjectId;
  template_config: ITemplateConfig;
  layout_overrides: ILayoutOverrides;
  playlist: IPlaylistSlide[];
  created_at: Date;
  updated_at: Date;
}

const brandingSchema = new Schema<IBranding>({
  logo_url: String,
  primary_color: {
    type: String,
    default: '#3B82F6'
  },
  secondary_color: {
    type: String,
    default: '#64748B'
  },
  font_family: {
    type: String,
    default: 'Inter'
  }
}, { _id: false });

const templateConfigSchema = new Schema<ITemplateConfig>({
  background_image: String,
  show_descriptions: {
    type: Boolean,
    default: true
  },
  show_categories: {
    type: Boolean,
    default: true
  },
  grid_columns: {
    type: Number,
    default: 3,
    min: 2,
    max: 4
  },
  promotional_banner_text: String
}, { _id: false });

const layoutOverridesSchema = new Schema<ILayoutOverrides>({
  display_items_by_template: {
    type: Schema.Types.Mixed,
    default: {},
  },
}, { _id: false });

const playlistSlideSchema = new Schema<IPlaylistSlide>({
  label:        { type: String, trim: true },
  item_ids:     { type: [String], default: [] },
  duration_sec: { type: Number, default: 9, min: 3, max: 300 },
  layout:       { type: Schema.Types.Mixed, default: () => ({ ...DEFAULT_LAYOUT }) },
}, { _id: true });

const storeSchema = new Schema<IStore>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  owner_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  store_type: {
    type: String,
    trim: true,
    default: 'other',
  },
  branding: {
    type: brandingSchema,
    default: () => ({})
  },
  template_id: {
    type: Schema.Types.ObjectId,
    ref: 'DisplayTemplate'
  },
  template_config: {
    type: templateConfigSchema,
    default: () => ({})
  },
  layout_overrides: {
    type: layoutOverridesSchema,
    default: () => ({})
  },
  playlist: {
    type: [playlistSlideSchema],
    default: () => [],
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
storeSchema.index({ owner_id: 1 });

export const Store = mongoose.model<IStore>('Store', storeSchema);