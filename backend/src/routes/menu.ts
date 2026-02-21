import { Router, Response } from 'express';
import { z } from 'zod';
import { MenuItem, Store } from '../models';
import { authenticateToken, requireOwner, AuthenticatedRequest } from '../utils/auth';
import { getRealtimeInstance } from '../services/realtimeSingleton';
import { logger } from '../utils/logger';

const router = Router();

// ── Validation ────────────────────────────────────────────────────────────────

const variationSchema = z.object({
  name: z.string().min(1),
  price_modifier: z.number().default(0),
});

const menuItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  image_url: z.string().url().optional().or(z.literal('')),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional().default([]),
  variations: z.array(variationSchema).optional().default([]),
  is_active: z.boolean().optional().default(true),
  show_on_display: z.boolean().optional().default(false),
  sort_order: z.number().optional().default(0),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve the owner's store_id — returns null if no store found */
async function getOwnerStoreId(req: AuthenticatedRequest): Promise<string | null> {
  const store = await Store.findOne({ owner_id: req.user!._id }, '_id').lean();
  return store ? String(store._id) : null;
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/menu  — list all items for owner's store
router.get('/', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const storeId = await getOwnerStoreId(req);
    if (!storeId) {
      res.status(404).json({ success: false, message: 'You have no store yet' });
      return;
    }

    const items = await MenuItem.find({ store_id: storeId })
      .populate('category', '_id name')
      .sort({ sort_order: 1 })
      .lean();

    res.json({ success: true, data: items });
  } catch (error) {
    logger.error('Get menu items error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/menu  — create a new item
router.post('/', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const storeId = await getOwnerStoreId(req);
    if (!storeId) {
      res.status(404).json({ success: false, message: 'You have no store yet' });
      return;
    }

    const validation = menuItemSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, message: 'Validation error', errors: validation.error.issues });
      return;
    }

    const item = await new MenuItem({ ...validation.data, store_id: storeId }).save();

    await getRealtimeInstance().notifyMenuUpdate(storeId, { action: 'created', item });
    logger.info(`Menu item created: ${item.name} for store ${storeId}`);

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    logger.error('Create menu item error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/menu/:id  — update an item
router.put('/:id', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const storeId = await getOwnerStoreId(req);
    if (!storeId) {
      res.status(404).json({ success: false, message: 'You have no store yet' });
      return;
    }

    const item = await MenuItem.findOne({ _id: req.params.id, store_id: storeId });
    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }

    const validation = menuItemSchema.partial().safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, message: 'Validation error', errors: validation.error.issues });
      return;
    }

    Object.assign(item, validation.data);
    await item.save();

    await getRealtimeInstance().notifyMenuUpdate(storeId, { action: 'updated', item });
    logger.info(`Menu item updated: ${item.name}`);

    res.json({ success: true, data: item });
  } catch (error) {
    logger.error('Update menu item error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/menu/:id  — delete an item
router.delete('/:id', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const storeId = await getOwnerStoreId(req);
    if (!storeId) {
      res.status(404).json({ success: false, message: 'You have no store yet' });
      return;
    }

    const item = await MenuItem.findOneAndDelete({ _id: req.params.id, store_id: storeId });
    if (!item) {
      res.status(404).json({ success: false, message: 'Item not found' });
      return;
    }

    await getRealtimeInstance().notifyMenuUpdate(storeId, { action: 'deleted', itemId: req.params.id });
    logger.info(`Menu item deleted: ${item.name}`);

    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    logger.error('Delete menu item error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
