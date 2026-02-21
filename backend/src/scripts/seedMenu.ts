import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { User, Store, MenuItem, Category } from '../models';
import { logger } from '../utils/logger';

const OWNER_EMAIL = 'p@dynaro.ai';

// Category names match the seeded coffee_shop categories from seedCategories.ts
const MENU_ITEMS = [
  // ── Espresso Bar ─────────────────────────────────────────────────────────────
  {
    name: 'Espresso', category: 'Espresso Bar', price: 3.00, sort_order: 1, is_active: true,
    description: 'Double shot of our signature dark-roast blend. Rich, bold, and perfectly extracted.',
    image_url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600&q=80',
  },
  {
    name: 'Americano', category: 'Espresso Bar', price: 3.50, sort_order: 2, is_active: true,
    description: 'Espresso diluted with hot water — smooth and full-bodied.',
    image_url: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=600&q=80',
  },
  {
    name: 'Flat White', category: 'Espresso Bar', price: 4.50, sort_order: 3, is_active: true,
    description: 'Velvety micro-foam steamed milk over a double ristretto. A barista favourite.',
    image_url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80',
  },
  {
    name: 'Cortado', category: 'Espresso Bar', price: 4.00, sort_order: 4, is_active: true,
    description: 'Equal parts espresso and warm milk, cutting the acidity perfectly.',
    image_url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&q=80',
  },

  // ── Lattes & Cappuccinos ──────────────────────────────────────────────────────
  {
    name: 'Cappuccino', category: 'Lattes & Cappuccinos', price: 4.50, sort_order: 1, is_active: true,
    description: 'Classic Italian — equal thirds espresso, steamed milk, and thick foam.',
    image_url: 'https://images.unsplash.com/photo-1521302200778-33500795e128?w=600&q=80',
  },
  {
    name: 'Café Latte', category: 'Lattes & Cappuccinos', price: 5.00, sort_order: 2, is_active: true,
    description: 'Smooth espresso with lots of steamed milk and a light foam top.',
    image_url: 'https://images.unsplash.com/photo-1570968915860-54d520519524?w=600&q=80',
  },
  {
    name: 'Mocha', category: 'Lattes & Cappuccinos', price: 5.50, sort_order: 3, is_active: true,
    description: 'Espresso, rich chocolate sauce, steamed milk, and whipped cream.',
    image_url: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=600&q=80',
  },
  {
    name: 'Chai Latte', category: 'Lattes & Cappuccinos', price: 4.75, sort_order: 4, is_active: true,
    description: 'Spiced masala chai concentrate with frothy steamed milk.',
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
  },
  {
    name: 'Matcha Latte', category: 'Lattes & Cappuccinos', price: 5.25, sort_order: 5, is_active: true,
    description: 'Ceremonial-grade Japanese matcha whisked with oat milk.',
    image_url: 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=600&q=80',
  },

  // ── Cold Brew & Iced ──────────────────────────────────────────────────────────
  {
    name: 'Iced Latte', category: 'Cold Brew & Iced', price: 5.50, sort_order: 1, is_active: true,
    description: 'Chilled espresso poured over ice with cold milk. Refreshingly smooth.',
    image_url: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=600&q=80',
  },
  {
    name: 'Cold Brew', category: 'Cold Brew & Iced', price: 5.00, sort_order: 2, is_active: true,
    description: '18-hour slow-steeped cold brew. Naturally sweet, zero bitterness.',
    image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80',
  },
  {
    name: 'Iced Matcha', category: 'Cold Brew & Iced', price: 5.75, sort_order: 3, is_active: true,
    description: 'Matcha shaken with oat milk poured over ice.',
    image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80',
  },
  {
    name: 'Nitro Cold Brew', category: 'Cold Brew & Iced', price: 6.00, sort_order: 4, is_active: true,
    description: 'Cold brew infused with nitrogen — creamy, cascading, no ice needed.',
    image_url: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=600&q=80',
  },
  {
    name: 'Frappé', category: 'Cold Brew & Iced', price: 6.50, sort_order: 5, is_active: false,
    description: 'Blended ice, espresso, and milk topped with whipped cream.',
    image_url: 'https://images.unsplash.com/photo-1632977080010-63a0f60dd2c5?w=600&q=80',
  },

  // ── Pastries & Baked Goods ────────────────────────────────────────────────────
  {
    name: 'Butter Croissant', category: 'Pastries & Baked Goods', price: 3.50, sort_order: 1, is_active: true,
    description: 'Freshly baked, golden-laminated croissant. Flaky outside, soft inside.',
    image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',
  },
  {
    name: 'Pain au Chocolat', category: 'Pastries & Baked Goods', price: 4.00, sort_order: 2, is_active: true,
    description: 'Classic chocolate-filled puff pastry. Two layers of dark chocolate.',
    image_url: 'https://images.unsplash.com/photo-1623334044303-241021148842?w=600&q=80',
  },
  {
    name: 'Almond Croissant', category: 'Pastries & Baked Goods', price: 4.25, sort_order: 3, is_active: true,
    description: 'Twice-baked with almond cream filling and toasted flaked almonds.',
    image_url: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=600&q=80',
  },
  {
    name: 'Banana Bread', category: 'Pastries & Baked Goods', price: 3.75, sort_order: 4, is_active: true,
    description: 'Moist slice with walnuts and a hint of cinnamon. Vegan-friendly.',
    image_url: 'https://images.unsplash.com/photo-1605190557401-0f6e3a1e5c18?w=600&q=80',
  },
  {
    name: 'Cheesecake Slice', category: 'Pastries & Baked Goods', price: 6.00, sort_order: 5, is_active: true,
    description: 'New-York style baked cheesecake with a buttery biscuit base.',
    image_url: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=600&q=80',
  },

  // ── Sandwiches & Snacks ───────────────────────────────────────────────────────
  {
    name: 'Avo Toast', category: 'Sandwiches & Snacks', price: 8.50, sort_order: 1, is_active: true,
    description: 'Smashed avocado on sourdough with chilli flakes, poached egg, and feta.',
    image_url: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=600&q=80',
  },
  {
    name: 'Club Sandwich', category: 'Sandwiches & Snacks', price: 9.50, sort_order: 2, is_active: true,
    description: 'Toasted triple-decker with chicken, bacon, egg, lettuce, and tomato.',
    image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80',
  },
  {
    name: 'Granola Bowl', category: 'Sandwiches & Snacks', price: 7.00, sort_order: 3, is_active: true,
    description: 'House granola, Greek yoghurt, seasonal berries, and honey drizzle.',
    image_url: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&q=80',
  },

  // ── Tea & Alternatives ────────────────────────────────────────────────────────
  {
    name: 'English Breakfast Tea', category: 'Tea & Alternatives', price: 3.00, sort_order: 1, is_active: true,
    description: 'Classic black tea served with milk and a choice of sweetener.',
    image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80',
  },
  {
    name: 'Green Tea', category: 'Tea & Alternatives', price: 3.25, sort_order: 2, is_active: true,
    description: 'Delicate Japanese sencha, served at the perfect temperature.',
    image_url: 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=600&q=80',
  },
  {
    name: 'Hot Chocolate', category: 'Tea & Alternatives', price: 4.50, sort_order: 3, is_active: true,
    description: 'Rich Belgian dark chocolate melted into steamed milk, finished with cream.',
    image_url: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=600&q=80',
  },
];

async function seedMenu() {
  try {
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/dynaro';
    await mongoose.connect(mongoUrl);
    logger.info('Connected to MongoDB');

    // Find owner
    const owner = await User.findOne({ email: OWNER_EMAIL });
    if (!owner) {
      logger.error(`Owner ${OWNER_EMAIL} not found. Create the store via the superadmin dashboard first.`);
      process.exit(1);
    }

    // Find their store
    const store = await Store.findOne({ owner_id: owner._id });
    if (!store) {
      logger.error(`No store found for ${OWNER_EMAIL}. Create one via the superadmin dashboard first.`);
      process.exit(1);
    }

    logger.info(`Seeding menu for store: "${store.name}" (type: ${store.store_type})`);

    // Build a name → _id map from the seeded categories
    const seededCats = await Category.find({ store_type: store.store_type }).lean();
    const catMap = new Map(seededCats.map((c) => [c.name, c._id]));
    const usedCats = [...new Set(MENU_ITEMS.map((i) => i.category))];
    const missing = usedCats.filter((c) => !catMap.has(c));

    if (missing.length > 0) {
      logger.error(`❌  Missing categories for store_type "${store.store_type}": ${missing.join(', ')}`);
      logger.error('Run `npm run seed:categories` first.');
      process.exit(1);
    }

    // Clear existing items for a clean seed
    const deleted = await MenuItem.deleteMany({ store_id: store._id });
    logger.info(`Cleared ${deleted.deletedCount} existing items`);

    // Insert all items — use category ObjectId, not name string
    const docs = MENU_ITEMS.map((item) => ({
      ...item,
      category: catMap.get(item.category),
      store_id: store._id,
      tags: [],
      show_on_display: true,
    }));
    const inserted = await MenuItem.insertMany(docs);
    logger.info(`✅ Inserted ${inserted.length} menu items across ${usedCats.length} categories`);

    for (const cat of usedCats) {
      const count = MENU_ITEMS.filter((i) => i.category === cat).length;
      logger.info(`  ${cat}: ${count} item${count !== 1 ? 's' : ''}`);
    }

  } catch (error) {
    logger.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
}

seedMenu();
