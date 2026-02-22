import type { IItemFieldTags, IItemFieldImage } from '@shared/display-types';

/**
 * ── Template Placeholder Contract ──────────────────────────────────────────
 *
 * The `DisplayData` interface IS the placeholder system.
 * Every template is a React component that receives `DisplayData` as props.
 * Each field in this interface maps to a data slot ("placeholder") in the UI:
 *
 *   store.name               → store name shown in the header
 *   store.branding           → colors, logo, font
 *   store.template_config    → layout settings (columns, show descriptions…)
 *   store.layout             → zone/block layout config from DisplayTemplate
 *   menuItems[]              → the cards in the grid
 *   promotions[]             → badges, banner strip, discounted prices
 *
 * To build a new template later, just create a component that accepts `TemplateProps`.
 * The template registry in the display page maps template IDs → components.
 */

// ── Layout config (mirrors backend DisplayTemplate model) ─────────────────────

export interface ILayoutHeader {
  visible: boolean;
  show_logo: boolean;
  show_name: boolean;
  show_clock: boolean;
  name_size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ILayoutMain {
  type: 'menu-grid';
  columns: number;           // 1 | 2 | 3 | 4
  rows: number;              // 1 | 2 | 3
  show_category_label: boolean;
  label_style?: ILabelStyle;
}

export interface ILabelStyle {
  category?: boolean;  // default: true
  name?: boolean;      // default: false
  price?: boolean;     // default: false
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

export const DEFAULT_LAYOUT: ILayoutConfig = {
  header: { visible: true, show_logo: true, show_name: true, show_clock: true },
  main:   { type: 'menu-grid', columns: 3, rows: 2, show_category_label: true },
  banner: { visible: true, position: 'bottom' },
};

// ── Store / menu types ────────────────────────────────────────────────────────

export interface DisplayBranding {
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
}

export interface DisplayTemplateConfig {
  /** Number of grid columns: 2 | 3 | 4 */
  grid_columns: number;
  /** Whether item descriptions appear on cards */
  show_descriptions: boolean;
  /** Whether category tabs are shown / auto-cycled */
  show_categories: boolean;
  /** Optional static text override for the promo banner */
  promotional_banner_text?: string;
}

export interface DisplayStore {
  _id: string;
  name: string;
  timezone: string;
  branding: DisplayBranding;
  template_config: DisplayTemplateConfig;
  /** Zone/block layout from the store's assigned DisplayTemplate */
  layout: ILayoutConfig;
}

export interface DisplayMenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category: { _id: string; name: string };
  tags: string[];
  sort_order: number;
}

export interface DisplayPromotion {
  _id: string;
  name: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_time: string;
  end_time: string;
  /** Empty array means the promotion applies to ALL items */
  applicable_items: string[];
  display_config: {
    badge_text: string;
    badge_color: string;
    highlight_items: boolean;
    banner_image_url?: string;
    side_image_url?: string;
  };
}

/** Per-item text colors for a slide */
export interface IItemFieldColors {
  category?: string;
  name?: string;
  price?: string;
}

/** Per-item font sizes for a slide — values are tokens: 'xs' | 'sm' | 'md' | 'lg' */
export interface IItemFieldSizes {
  category?: string;
  name?: string;
  price?: string;
}

/** A single resolved playlist slide — carries its own layout and item subset */
export interface DisplayPlaylistSlide {
  _id: string;
  label?: string;
  duration_sec: number;
  layout: ILayoutConfig;
  items: DisplayMenuItem[];
  item_colors?: Record<string, IItemFieldColors>;
  item_sizes?:  Record<string, IItemFieldSizes>;
  item_tags?:   Record<string, IItemFieldTags>;
  item_images?: Record<string, IItemFieldImage>;
}

/** Full payload every template receives */
export interface DisplayData {
  store: DisplayStore;
  menuItems: DisplayMenuItem[];
  promotions: DisplayPromotion[];
  playlist?: DisplayPlaylistSlide[];
}

/** Every template component must satisfy this contract */
export interface TemplateProps {
  data: DisplayData;
}
