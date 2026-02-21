// Shared types for Dynrow frontend applications

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Store {
  _id: string;
  name: string;
  owner_id: string;
  timezone: string;
  branding: {
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
    font_family: string;
  };
  template_id: string;
  template_config: {
    background_image?: string;
    show_descriptions: boolean;
    show_categories: boolean;
    grid_columns: number;
    promotional_banner_text?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  _id: string;
  store_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category: string;
  tags: string[];
  variations?: Array<{
    name: string;
    price_modifier: number;
  }>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  _id: string;
  store_id: string;
  name: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_time: string;
  end_time: string;
  applicable_items: string[];
  conditions?: {
    min_quantity?: number;
    max_uses?: number;
    current_uses: number;
  };
  display_config: {
    badge_text: string;
    badge_color: string;
    highlight_items: boolean;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DisplayTemplate {
  _id: string;
  name: string;
  description: string;
  preview_image_url: string;
  template_type: 'grid' | 'list' | 'carousel' | 'split';
  config_schema: Record<string, any>;
  html_template: string;
  css_styles: string;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Real-time event types
export interface RealTimeEvent {
  type: 'menu_update' | 'promotion_update' | 'store_update';
  store_id: string;
  data: any;
  timestamp: string;
}

// Display data - what the screen shows
export interface DisplayData {
  store: Store;
  menu_items: (MenuItem & {
    current_price: number;
    original_price: number;
    has_promotion: boolean;
    promotion_badge?: string;
  })[];
  active_promotions: Promotion[];
  categories: string[];
  last_updated: string;
}