import { Router, Response } from 'express';
import { Promotion, Store, MenuItem } from '../models';
import { authenticateToken, requireOwner, AuthenticatedRequest } from '../utils/auth';
import { promotionSchema, promotionBaseSchema } from '../utils/validation';
import { getRealtimeInstance } from '../services/realtimeSingleton';
import { logger } from '../utils/logger';

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getOwnerStoreId(req: AuthenticatedRequest): Promise<string | null> {
  const store = await Store.findOne({ owner_id: req.user!._id }, '_id').lean();
  return store ? String(store._id) : null;
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/promotions — list all promotions for the owner's store
router.get('/', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const storeId = await getOwnerStoreId(req);
    if (!storeId) {
      res.status(404).json({ success: false, message: 'You have no store yet' });
      return;
    }

    const promotions = await Promotion.find({ store_id: storeId })
      .populate('applicable_items', 'name category price')
      .sort({ created_at: -1 })
      .lean();

    res.json({ success: true, data: promotions });
  } catch (error) {
    logger.error('Get promotions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/promotions — create a promotion
router.post('/', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const storeId = await getOwnerStoreId(req);
    if (!storeId) {
      res.status(404).json({ success: false, message: 'You have no store yet' });
      return;
    }

    const validation = promotionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, message: 'Validation error', errors: validation.error.issues });
      return;
    }

    // Verify all applicable_items belong to this store
    if (validation.data.applicable_items.length > 0) {
      const itemCount = await MenuItem.countDocuments({
        _id: { $in: validation.data.applicable_items },
        store_id: storeId,
      });
      if (itemCount !== validation.data.applicable_items.length) {
        res.status(400).json({ success: false, message: 'Some menu items do not belong to your store' });
        return;
      }
    }

    const promotion = await new Promotion({ ...validation.data, store_id: storeId }).save();
    await promotion.populate('applicable_items', 'name category price');

    await getRealtimeInstance().notifyPromotionUpdate(storeId, { action: 'created', id: String(promotion._id) });
    logger.info(`Promotion created: ${promotion.name} for store ${storeId}`);
    res.status(201).json({ success: true, data: promotion });
  } catch (error) {
    logger.error('Create promotion error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/promotions/:id — update a promotion
router.put('/:id', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const storeId = await getOwnerStoreId(req);
    if (!storeId) {
      res.status(404).json({ success: false, message: 'You have no store yet' });
      return;
    }

    const promotion = await Promotion.findOne({ _id: req.params.id, store_id: storeId });
    if (!promotion) {
      res.status(404).json({ success: false, message: 'Promotion not found' });
      return;
    }

    const validation = promotionBaseSchema.partial().safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, message: 'Validation error', errors: validation.error.issues });
      return;
    }

    // Verify applicable_items if provided
    if (validation.data.applicable_items && validation.data.applicable_items.length > 0) {
      const itemCount = await MenuItem.countDocuments({
        _id: { $in: validation.data.applicable_items },
        store_id: storeId,
      });
      if (itemCount !== validation.data.applicable_items.length) {
        res.status(400).json({ success: false, message: 'Some menu items do not belong to your store' });
        return;
      }
    }

    Object.assign(promotion, validation.data);
    promotion.updated_at = new Date();
    await promotion.save();
    await promotion.populate('applicable_items', 'name category price');

    await getRealtimeInstance().notifyPromotionUpdate(storeId, { action: 'updated', id: String(promotion._id) });
    logger.info(`Promotion updated: ${promotion.name} for store ${storeId}`);
    res.json({ success: true, data: promotion });
  } catch (error) {
    logger.error('Update promotion error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PATCH /api/promotions/:id/toggle — toggle is_active
router.patch('/:id/toggle', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const storeId = await getOwnerStoreId(req);
    if (!storeId) {
      res.status(404).json({ success: false, message: 'You have no store yet' });
      return;
    }

    const promotion = await Promotion.findOne({ _id: req.params.id, store_id: storeId });
    if (!promotion) {
      res.status(404).json({ success: false, message: 'Promotion not found' });
      return;
    }

    promotion.is_active = !promotion.is_active;
    promotion.updated_at = new Date();
    await promotion.save();

    await getRealtimeInstance().notifyPromotionUpdate(storeId, { action: 'toggled', id: String(promotion._id), is_active: promotion.is_active });
    logger.info(`Promotion toggled: ${promotion.name} → ${promotion.is_active} for store ${storeId}`);
    res.json({ success: true, data: { is_active: promotion.is_active } });
  } catch (error) {
    logger.error('Toggle promotion error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/promotions/:id — delete a promotion
router.delete('/:id', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const storeId = await getOwnerStoreId(req);
    if (!storeId) {
      res.status(404).json({ success: false, message: 'You have no store yet' });
      return;
    }

    const promotion = await Promotion.findOneAndDelete({ _id: req.params.id, store_id: storeId });
    if (!promotion) {
      res.status(404).json({ success: false, message: 'Promotion not found' });
      return;
    }

    await getRealtimeInstance().notifyPromotionUpdate(storeId, { action: 'deleted', id: req.params.id });
    logger.info(`Promotion deleted: ${promotion.name} for store ${storeId}`);
    res.json({ success: true, message: 'Promotion deleted successfully' });
  } catch (error) {
    logger.error('Delete promotion error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
