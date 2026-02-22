// Shared display types used by both dashboard (mock) and display (live)

export interface ILayoutHeader {
  visible: boolean;
  show_logo: boolean;
  show_name: boolean;
  show_clock: boolean;
  name_size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ILayoutMain {
  type: 'menu-grid';
  columns: number;
  rows: number;
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

export interface IItemFieldColors {
  category?: string;
  name?: string;
  price?: string;
}

export interface IItemFieldSizes {
  category?: string;
  name?: string;
  price?: string;
}

export interface IItemFieldTags {
  category?: boolean;
  name?: boolean;
  price?: boolean;
}

export interface IItemFieldImage {
  /** CSS object-position value — controls which part of the image is visible.
   *  Valid values: 'center center', 'left top', 'right bottom', etc. */
  position?: string;
}

/** Size token → CSS value maps for the live display (rem-based) */
export const DISPLAY_CAT_SIZES: Record<string, string>   = { xs: '0.62rem', sm: '0.75rem', md: '0.88rem', lg: '1.05rem' };
export const DISPLAY_NAME_SIZES: Record<string, string>  = { xs: '0.72rem', sm: '0.85rem', md: '1.0rem',  lg: '1.2rem'  };
export const DISPLAY_PRICE_SIZES: Record<string, string> = { xs: '0.80rem', sm: '1.0rem',  md: '1.15rem', lg: '1.4rem'  };

/** Size token → CSS value maps for the dashboard preview mock (em-based, scales with card) */
export const MOCK_CAT_SIZES: Record<string, string>   = { xs: '0.32em', sm: '0.44em', md: '0.56em', lg: '0.70em' };
export const MOCK_NAME_SIZES: Record<string, string>  = { xs: '0.45em', sm: '0.58em', md: '0.70em', lg: '0.88em' };
export const MOCK_PRICE_SIZES: Record<string, string> = { xs: '0.45em', sm: '0.58em', md: '0.70em', lg: '0.88em' };

export const SIZE_STEPS  = ['xs', 'sm', 'md', 'lg'] as const;
export const SIZE_LABELS: Record<string, string> = { xs: 'XS', sm: 'S', md: 'M', lg: 'L' };

/**
 * Minimal promo shape needed to render a card — used by MenuItemCard.
 * The display app's full DisplayPromotion is a structural superset of this.
 */
export interface CardPromotion {
  _id: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  /** Empty array = applies to ALL items */
  applicable_items: string[];
  display_config: {
    badge_text: string;
    badge_color: string;
  };
}

export const BG_THEMES: Record<string, { label: string; gradient: string }> = {
  dark:     { label: 'Dark',     gradient: 'linear-gradient(160deg, #071020 0%, #0c1e40 50%, #071020 100%)' },
  ocean:    { label: 'Ocean',    gradient: 'linear-gradient(160deg, #06141e 0%, #0a2d45 50%, #06141e 100%)' },
  midnight: { label: 'Midnight', gradient: 'linear-gradient(160deg, #0e0b1a 0%, #1e1a3d 50%, #0e0b1a 100%)' },
  forest:   { label: 'Forest',   gradient: 'linear-gradient(160deg, #071a0f 0%, #0d3020 50%, #071a0f 100%)' },
  ember:    { label: 'Ember',    gradient: 'linear-gradient(160deg, #1a0a05 0%, #3d1810 50%, #1a0a05 100%)' },
};
