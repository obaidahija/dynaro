export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'owner' | 'admin';
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
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  _id: string;
  store_id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  _id: string;
  store_id: string;
  title: string;
  description?: string;
  image_url?: string;
  discount_type: 'percentage' | 'fixed' | 'none';
  discount_value: number;
  applies_to: 'all' | 'category' | 'item';
  target_id?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}
