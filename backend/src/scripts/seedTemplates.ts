/**
 * Seed script — creates default DisplayTemplates.
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/seedTemplates.ts
 */
import mongoose from 'mongoose';
import { DisplayTemplate } from '../models';
import type { ILayoutConfig } from '../models/DisplayTemplate';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dynaro';

const TEMPLATES: {
  name: string;
  description: string;
  layout: ILayoutConfig;
  is_premium: boolean;
}[] = [
  {
    name: 'Standard Menu',
    description: 'Full header with logo and clock, 3-column item grid, flash-sale banner at the bottom.',
    is_premium: false,
    layout: {
      header: { visible: true, show_logo: true, show_name: true, show_clock: true },
      main:   { type: 'menu-grid', columns: 3, rows: 2, show_category_label: true },
      banner: { visible: true, position: 'bottom' },
    },
  },
  {
    name: 'Wide Grid',
    description: '4-column grid to show more items. Full header, no category labels on cards, bottom banner.',
    is_premium: false,
    layout: {
      header: { visible: true, show_logo: true, show_name: true, show_clock: true },
      main:   { type: 'menu-grid', columns: 4, rows: 2, show_category_label: false },
      banner: { visible: true, position: 'bottom' },
    },
  },
  {
    name: 'No Header',
    description: 'Header hidden — maximum grid space. 3-column grid + bottom banner.',
    is_premium: false,
    layout: {
      header: { visible: false, show_logo: false, show_name: false, show_clock: false },
      main:   { type: 'menu-grid', columns: 3, rows: 2, show_category_label: true },
      banner: { visible: true, position: 'bottom' },
    },
  },
  {
    name: 'Slideshow',
    description: 'Full-screen single item slides. Header with name + clock, top banner.',
    is_premium: false,
    layout: {
      header: { visible: true, show_logo: false, show_name: true, show_clock: true },
      main:   { type: 'menu-grid', columns: 1, rows: 1, show_category_label: false },
      banner: { visible: true, position: 'top' },
    },
  },
  {
    name: 'Compact',
    description: 'Name-only header, 2-column grid with 3 rows, banner hidden. Great for small screens.',
    is_premium: false,
    layout: {
      header: { visible: true, show_logo: false, show_name: true, show_clock: false },
      main:   { type: 'menu-grid', columns: 2, rows: 3, show_category_label: true },
      banner: { visible: false, position: 'bottom' },
    },
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  let created = 0;
  let skipped = 0;

  for (const tpl of TEMPLATES) {
    const exists = await DisplayTemplate.findOne({ name: tpl.name });
    if (exists) {
      console.log(`⏭  Skipping "${tpl.name}" (already exists)`);
      skipped++;
    } else {
      await DisplayTemplate.create(tpl);
      console.log(`✅ Created "${tpl.name}"`);
      created++;
    }
  }

  console.log(`\nDone — ${created} created, ${skipped} skipped.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
