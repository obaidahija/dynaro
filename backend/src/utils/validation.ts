import { z } from 'zod';

// User validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['owner', 'admin', 'superadmin']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Store validation schemas
export const storeSchema = z.object({
  name: z.string().min(2, 'Store name must be at least 2 characters'),
  timezone: z.string().optional(),
});

export const brandingSchema = z.object({
  logo_url: z.string().url().optional(),
  primary_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format'),
  secondary_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format'),
  font_family: z.string().min(1, 'Font family is required'),
});

export const templateConfigSchema = z.object({
  background_image: z.string().url().optional(),
  show_descriptions: z.boolean(),
  show_categories: z.boolean(),
  grid_columns: z.number().min(2).max(4),
  promotional_banner_text: z.string().max(100).optional(),
});

// Menu item validation schemas
export const variationSchema = z.object({
  name: z.string().min(1, 'Variation name is required'),
  price_modifier: z.number(),
});

export const menuItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  image_url: z.string().url().optional(),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).default([]),
  variations: z.array(variationSchema).optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().default(0),
});

// Promotion validation schemas
export const promotionConditionsSchema = z.object({
  min_quantity: z.number().min(1).optional(),
  max_uses: z.number().min(1).optional(),
  current_uses: z.number().min(0).default(0),
});

export const promotionDisplayConfigSchema = z.object({
  badge_text: z.string().min(1, 'Badge text is required'),
  badge_color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format'),
  highlight_items: z.boolean().default(true),
  banner_image_url: z.string().optional(),
  side_image_url: z.string().optional(),
});

export const promotionBaseSchema = z.object({
  name: z.string().min(1, 'Promotion name is required'),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().min(0, 'Discount value must be positive'),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  applicable_items: z.array(z.string()),
  conditions: promotionConditionsSchema.optional(),
  display_config: promotionDisplayConfigSchema,
  is_active: z.boolean().default(true),
});

export const promotionSchema = promotionBaseSchema.refine((data) => {
  const startTime = new Date(data.start_time);
  const endTime = new Date(data.end_time);
  return endTime > startTime;
}, {
  message: 'End time must be after start time',
  path: ['end_time'],
});