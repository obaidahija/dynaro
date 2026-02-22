/**
 * Public display endpoint — no authentication required.
 *
 *   GET /api/display/:storeId            → store data + all menu items
 *   GET /api/display/:storeId/:playlistId → store data + resolved playlist slides
 */
import { Router, Request, Response } from 'express';
import { Store, MenuItem, Promotion } from '../models';
import { Playlist } from '../models/Playlist';
import { DEFAULT_LAYOUT } from '../models/DisplayTemplate';
import { logger } from '../utils/logger';

const router = Router();

async function buildResponse(storeId: string, playlistId: string | undefined, res: Response): Promise<void> {
  const store = await Store.findById(storeId).populate('template_id').lean();

  if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }

  if (store.is_active === false) {
    res.status(200).json({ success: false, offline: true, message: 'This store is currently offline' });
    return;
  }

  const now = new Date();

  const allActiveItems = await MenuItem.find({ store_id: store._id, is_active: true })
    .populate('category', '_id name')
    .sort({ sort_order: 1 })
    .lean();

  const promotions = await Promotion.find({
    store_id: store._id,
    is_active: true,
    start_time: { $lte: now },
    end_time:   { $gte: now },
  }).lean();

  const tplLayout = (store.template_id as any)?.layout ?? DEFAULT_LAYOUT;

  let playlist: any[] = [];

  if (playlistId) {
    const pl = await Playlist.findOne({ _id: playlistId, store_id: store._id }).lean();
    if (!pl) { res.status(404).json({ success: false, message: 'Playlist not found' }); return; }
    playlist = (pl.slides ?? []).map((slide: any) => {
      const slideLayout = slide.layout ?? tplLayout;
      const slideItemIds: string[] = slide.item_ids ?? [];
      const slideItems = slideItemIds.length > 0
        ? slideItemIds.map((id: string) => allActiveItems.find((m) => String(m._id) === id)).filter(Boolean)
        : allActiveItems;
      return {
        _id: String(slide._id),
        label: slide.label ?? '',
        duration_sec: slide.duration_sec ?? 9,
        layout: slideLayout,
        items: slideItems,
        item_colors:  slide.item_colors  ?? {},
        item_sizes:   slide.item_sizes   ?? {},
        item_tags:    slide.item_tags    ?? {},
        item_images:  slide.item_images  ?? {},
      };
    });
  }

  res.json({
    success: true,
    data: {
      store: {
        _id: store._id,
        name: store.name,
        timezone: store.timezone,
        branding: store.branding,
        template_config: {
          ...store.template_config,
          show_categories:   store.template_config?.show_categories   ?? true,
          show_descriptions: store.template_config?.show_descriptions ?? true,
          grid_columns:      store.template_config?.grid_columns      ?? 3,
        },
        layout: tplLayout,
      },
      menuItems: allActiveItems,
      promotions,
      playlist,
    },
  });
}

router.get('/:storeId', async (req: Request, res: Response): Promise<void> => {
  try { await buildResponse(req.params.storeId, undefined, res); }
  catch (error) { logger.error('Display data error:', error); res.status(500).json({ success: false, message: 'Internal server error' }); }
});

router.get('/:storeId/:playlistId', async (req: Request, res: Response): Promise<void> => {
  try { await buildResponse(req.params.storeId, req.params.playlistId, res); }
  catch (error) { logger.error('Display data error:', error); res.status(500).json({ success: false, message: 'Internal server error' }); }
});

export default router;
