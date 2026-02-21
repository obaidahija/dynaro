import mongoose, { Document, Schema } from 'mongoose';

// ── Layout zone types ─────────────────────────────────────────────────────────

export interface ILayoutHeader {
  visible: boolean;
  show_logo: boolean;
  show_name: boolean;
  show_clock: boolean;
  name_size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ILayoutMain {
  type: 'menu-grid';
  // menu-grid options
  columns: number;           // 1 | 2 | 3 | 4
  rows: number;              // 1 | 2 | 3
  show_category_label: boolean;
}

export interface ILayoutBanner {
  visible: boolean;
  position: 'top' | 'bottom';
}

export interface ILayoutConfig {
  header: ILayoutHeader;
  main: ILayoutMain;
  banner: ILayoutBanner;
  bg_theme?: 'dark' | 'ocean' | 'midnight' | 'forest' | 'ember';
}

export interface IDisplayTemplate extends Document {
  name: string;
  description: string;
  preview_image_url: string;
  layout: ILayoutConfig;
  is_premium: boolean;
  created_at: Date;
  updated_at: Date;
}

// ── Default layout ────────────────────────────────────────────────────────────

export const DEFAULT_LAYOUT: ILayoutConfig = {
  header: { visible: true, show_logo: true, show_name: true, show_clock: true },
  main:   { type: 'menu-grid', columns: 3, rows: 2, show_category_label: true },
  banner: { visible: true, position: 'bottom' },
};

// ── Mongoose schemas ──────────────────────────────────────────────────────────

export const layoutHeaderSchema = new Schema<ILayoutHeader>({
  visible:    { type: Boolean, default: true },
  show_logo:  { type: Boolean, default: true },
  show_name:  { type: Boolean, default: true },
  show_clock: { type: Boolean, default: true },
  name_size:  { type: String, enum: ['sm', 'md', 'lg', 'xl'] },
}, { _id: false });

export const layoutMainSchema = new Schema<ILayoutMain>({
  type:                { type: String, enum: ['menu-grid'], default: 'menu-grid' },
  columns:             { type: Number, default: 3, min: 1, max: 4 },
  rows:                { type: Number, default: 2, min: 1, max: 3 },
  show_category_label: { type: Boolean, default: true },
}, { _id: false });

export const layoutBannerSchema = new Schema<ILayoutBanner>({
  visible:  { type: Boolean, default: true },
  position: { type: String, enum: ['top', 'bottom'], default: 'bottom' },
}, { _id: false });

const displayTemplateSchema = new Schema<IDisplayTemplate>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  preview_image_url: {
    type: String,
    default: '',
  },
  layout: {
    type: {
      header:   layoutHeaderSchema,
      main:     layoutMainSchema,
      banner:   layoutBannerSchema,
      bg_theme: { type: String, enum: ['dark', 'ocean', 'midnight', 'forest', 'ember'] },
    },
    default: () => DEFAULT_LAYOUT,
  },
  is_premium: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

displayTemplateSchema.index({ name: 1 });
displayTemplateSchema.index({ is_premium: 1 });

export const DisplayTemplate = mongoose.model<IDisplayTemplate>('DisplayTemplate', displayTemplateSchema);
