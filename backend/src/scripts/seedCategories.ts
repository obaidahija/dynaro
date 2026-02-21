import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { Category } from '../models';
import { logger } from '../utils/logger';

// ── Default categories per store type ─────────────────────────────────────────
const CATEGORIES: Record<string, string[]> = {
  coffee_shop: [
    'Espresso Bar',
    'Filter Coffee',
    'Cold Brew & Iced',
    'Lattes & Cappuccinos',
    'Tea & Alternatives',
    'Pastries & Baked Goods',
    'Sandwiches & Snacks',
    'Extras & Syrups',
  ],
  restaurant: [
    'Starters & Appetizers',
    'Soups & Salads',
    'Mains',
    'Grills & BBQ',
    'Pasta & Rice',
    'Seafood',
    'Vegetarian',
    'Sides',
    'Desserts',
    'Beverages',
  ],
  bakery: [
    'Breads & Loaves',
    'Croissants & Pastries',
    'Cakes & Slices',
    'Muffins & Cupcakes',
    'Cookies & Biscuits',
    'Pies & Tarts',
    'Savory Bakes',
    'Drinks',
  ],
  fast_food: [
    'Burgers',
    'Chicken',
    'Wraps & Sandwiches',
    'Hot Dogs',
    'Fries & Sides',
    'Salads',
    'Kids Menu',
    'Combo Meals',
    'Desserts',
    'Drinks',
  ],
  bar_pub: [
    'Draft Beer',
    'Bottled Beer & Cider',
    'Wines',
    'Spirits & Whiskeys',
    'Cocktails',
    'Non-Alcoholic',
    'Bar Snacks & Starters',
    'Mains',
    'Sharing Plates',
  ],
  ice_cream_shop: [
    'Scoops',
    'Sundaes',
    'Milkshakes',
    'Cones & Waffles',
    'Frozen Yogurt',
    'Sorbet & Gelato',
    'Toppings & Extras',
    'Drinks',
  ],
  juice_bar: [
    'Fresh Juices',
    'Smoothies',
    'Cold Press',
    'Detox & Wellness',
    'Protein Shakes',
    'Infused Waters',
    'Snacks & Bites',
  ],
  pizza_shop: [
    'Classic Pizzas',
    'Signature Pizzas',
    'Vegetarian Pizzas',
    'Calzones',
    'Starters & Garlic Bread',
    'Pasta',
    'Salads',
    'Desserts',
    'Drinks',
  ],
  sushi_asian: [
    'Nigiri & Sashimi',
    'Maki & Rolls',
    'Temaki & Hand Rolls',
    'Ramen & Noodles',
    'Rice Dishes',
    'Dumplings & Gyoza',
    'Starters & Edamame',
    'Soups',
    'Desserts',
    'Drinks',
  ],
  sandwich_deli: [
    'Hot Sandwiches',
    'Cold Sandwiches',
    'Wraps & Baguettes',
    'Bagels',
    'Salads & Bowls',
    'Soups',
    'Sides & Chips',
    'Drinks',
  ],
  mexican: [
    'Tacos',
    'Burritos',
    'Quesadillas',
    'Enchiladas',
    'Nachos & Sharing',
    'Bowls & Salads',
    'Starters & Guacamole',
    'Sides',
    'Desserts',
    'Drinks',
  ],
  indian: [
    'Starters & Chaat',
    'Tandoor Specials',
    'Curries',
    'Biryanis & Rice',
    'Breads',
    'Vegetarian',
    'Sides & Raita',
    'Desserts',
    'Drinks & Lassi',
  ],
  breakfast_brunch: [
    'Eggs & Benedicts',
    'Pancakes & Waffles',
    'Toast & Avocado',
    'Full Breakfast',
    'Bowls & Granola',
    'Pastries',
    'Juices & Smoothies',
    'Coffee & Tea',
    'Cocktails & Mimosas',
  ],
  other: [
    'Starters',
    'Mains',
    'Sides',
    'Desserts',
    'Drinks',
    'Specials',
  ],
};

// ── Seed function ─────────────────────────────────────────────────────────────
async function seedCategories() {
  const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!MONGO_URI) {
    logger.error('MONGODB_URI / MONGO_URI not set in environment');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  logger.info('Connected to MongoDB');

  // Drop stale indexes that may exist from old schema versions
  try {
    await Category.collection.dropIndex('store_id_1_name_1');
    logger.info('Dropped stale index: store_id_1_name_1');
  } catch {
    // Index doesn't exist — nothing to do
  }

  // Ensure the correct compound index exists
  await Category.syncIndexes();
  logger.info('Indexes synced');

  let created = 0;
  let skipped = 0;

  for (const [store_type, names] of Object.entries(CATEGORIES)) {
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const exists = await Category.findOne({ name, store_type });
      if (exists) {
        logger.info(`  SKIP  [${store_type}] "${name}"`);
        skipped++;
        continue;
      }
      await Category.create({ name, store_type, sort_order: i });
      logger.info(`  CREATE [${store_type}] "${name}"`);
      created++;
    }
  }

  logger.info(`\nDone — ${created} created, ${skipped} skipped`);
  await mongoose.disconnect();
}

seedCategories().catch((err) => {
  logger.error('Seed failed:', err);
  process.exit(1);
});
