/**
 * One-time migration: convert MenuItem.category from a plain string
 * to an ObjectId reference pointing at the matching Category document.
 *
 * Run once after deploying the new MenuItem schema:
 *   npm run migrate:menu
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { Store, MenuItem, Category } from '../models';
import { logger } from '../utils/logger';

async function migrate() {
  const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/dynaro';
  await mongoose.connect(mongoUrl);
  logger.info('Connected to MongoDB');

  const stores = await Store.find({}, '_id store_type').lean();
  logger.info(`Found ${stores.length} store(s) to process`);

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const store of stores) {
    // Load all enabled categories for this store's type
    const cats = await Category.find({ store_type: store.store_type }).lean();
    const catMap = new Map(cats.map((c) => [c.name, c._id]));

    // Find menu items that still have a string category (not yet migrated)
    const items = await MenuItem.find({ store_id: store._id }).lean();

    for (const item of items) {
      const raw = item.category as unknown;

      // Skip items that already hold an ObjectId
      if (raw instanceof mongoose.Types.ObjectId || mongoose.isValidObjectId(raw as string) && typeof raw !== 'string') {
        totalSkipped++;
        continue;
      }

      const nameStr = String(raw).trim();

      // Skip if it's already a valid 24-char hex ObjectId string (was previously migrated)
      if (/^[0-9a-fA-F]{24}$/.test(nameStr)) {
        totalSkipped++;
        continue;
      }

      const catId = catMap.get(nameStr);
      if (!catId) {
        logger.warn(`  SKIP [${store._id}] item "${item.name}" — category "${nameStr}" not found in store_type "${store.store_type}"`);
        totalFailed++;
        continue;
      }

      await MenuItem.updateOne({ _id: item._id }, { $set: { category: catId } });
      logger.info(`  ✓ [${store._id}] "${item.name}": "${nameStr}" → ${catId}`);
      totalUpdated++;
    }
  }

  logger.info(`\nMigration complete — updated: ${totalUpdated}, skipped: ${totalSkipped}, failed: ${totalFailed}`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  logger.error('Migration failed:', err);
  process.exit(1);
});
