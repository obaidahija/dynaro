import express, { Response } from 'express';
import { Store, DisplayTemplate, MenuItem, Category } from '../models';
import { authenticateToken, requireOwner, AuthenticatedRequest } from '../utils/auth';
import { storeSchema, brandingSchema, templateConfigSchema } from '../utils/validation';
import { logger } from '../utils/logger';

const router = express.Router();

// Get current user's store
router.get('/my-store', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const store = await Store.findOne({ owner_id: req.user!._id }).populate('template_id');

    if (!store) {
      res.status(404).json({
        success: false,
        message: 'Store not found'
      });
      return;
    }

    res.json({
      success: true,
      data: store
    });

  } catch (error) {
    logger.error('Get store error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create or update store
router.put('/my-store', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedData = storeSchema.parse(req.body);

    let store = await Store.findOne({ owner_id: req.user!._id });

    if (store) {
      // Update existing store
      store.name = validatedData.name;
      if (validatedData.timezone) {
        store.timezone = validatedData.timezone;
      }
      await store.save();
    } else {
      // Create new store with default template
      const defaultTemplate = await DisplayTemplate.findOne({ name: 'Modern Grid' });
      
      store = new Store({
        name: validatedData.name,
        owner_id: req.user!._id,
        timezone: validatedData.timezone || 'UTC',
        template_id: defaultTemplate?._id,
        branding: {
          primary_color: '#3B82F6',
          secondary_color: '#64748B',
          font_family: 'Inter'
        },
        template_config: {
          show_descriptions: true,
          show_categories: true,
          grid_columns: 3
        }
      });
      await store.save();
    }

    logger.info(`Store updated: ${store.name} (${req.user!.email})`);

    // TODO: Broadcast store update
    // realtime.notifyStoreUpdate(store._id.toString(), store);

    res.json({
      success: true,
      data: store,
      message: 'Store updated successfully'
    });

  } catch (error: any) {
    logger.error('Update store error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update store branding
router.put('/my-store/branding', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedData = brandingSchema.parse(req.body);

    const store = await Store.findOne({ owner_id: req.user!._id });
    if (!store) {
      res.status(404).json({
        success: false,
        message: 'Store not found'
      });
      return;
    }

    // Update branding
    store.branding = validatedData;
    await store.save();

    logger.info(`Store branding updated: ${store.name} (${req.user!.email})`);

    // TODO: Broadcast store update
    // realtime.notifyStoreUpdate(store._id.toString(), store);

    res.json({
      success: true,
      data: store,
      message: 'Store branding updated successfully'
    });

  } catch (error: any) {
    logger.error('Update branding error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update template configuration
router.put('/my-store/template-config', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedData = templateConfigSchema.parse(req.body);

    const store = await Store.findOne({ owner_id: req.user!._id });
    if (!store) {
       res.status(404).json({
        success: false,
        message: 'Store not found'
      });
      return
    }

    // Update template config
    store.template_config = validatedData;
    await store.save();

    logger.info(`Store template config updated: ${store.name} (${req.user!.email})`);

    // TODO: Broadcast store update
    // realtime.notifyStoreUpdate(store._id.toString(), store);

    res.json({
      success: true,
      data: store,
      message: 'Template configuration updated successfully'
    });

  } catch (error: any) {
    logger.error('Update template config error:', error);
    
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Change store template
router.put('/my-store/template', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { template_id } = req.body;

    if (!template_id) {
      res.status(400).json({
        success: false,
        message: 'Template ID is required'
      });
      return;
    }

    // Check if template exists
    const template = await DisplayTemplate.findById(template_id);
    if (!template) {
       res.status(404).json({
        success: false,
        message: 'Template not found'
      });
      return;
    }

    const store = await Store.findOne({ owner_id: req.user!._id });
    if (!store) {
       res.status(404).json({
        success: false,
        message: 'Store not found'
      });
      return;
    }

    // Update template
    store.template_id = template_id;
    await store.save();

    logger.info(`Store template changed: ${store.name} -> ${template.name} (${req.user!.email})`);

    // TODO: Broadcast store update
    // realtime.notifyStoreUpdate(store._id.toString(), store);

    res.json({
      success: true,
      data: store,
      message: 'Template changed successfully'
    });

  } catch (error) {
    logger.error('Change template error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ── Store types list (public) ────────────────────────────────────────────────

// PATCH /stores/my-store/layout-overrides  { template_id: string, display_item_ids: string[] }
// Store owner saves the ordered item selection for a specific template.
router.patch('/my-store/layout-overrides', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { template_id, display_item_ids } = req.body as { template_id: string; display_item_ids: string[] };
    if (!template_id || !Array.isArray(display_item_ids)) {
      res.status(400).json({ success: false, message: 'template_id and display_item_ids are required' }); return;
    }
    const store = await Store.findOne({ owner_id: req.user!._id });
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    // Use $set so Mongoose detects the Mixed-type nested change reliably
    await Store.updateOne(
      { _id: store._id },
      { $set: { [`layout_overrides.display_items_by_template.${template_id}`]: display_item_ids } },
    );
    const updated = await Store.findById(store._id).lean();
    logger.info(`Display items saved for store ${store._id}, template ${template_id}`);
    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('Save layout overrides error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── Playlist ──────────────────────────────────────────────────────────────────

// GET /stores/my-store/playlist
router.get('/my-store/playlist', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const store = await Store.findOne({ owner_id: req.user!._id }).lean();
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    res.json({ success: true, data: store.playlist ?? [] });
  } catch (error) {
    logger.error('Get playlist error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /stores/my-store/playlist  — replaces full playlist
router.put('/my-store/playlist', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const slides = req.body.slides;
    if (!Array.isArray(slides)) {
      res.status(400).json({ success: false, message: 'slides must be an array' }); return;
    }
    // Validate each slide minimally
    for (const s of slides) {
      if (!s.layout) {
        res.status(400).json({ success: false, message: 'Each slide must have a layout' }); return;
      }
    }
    const store = await Store.findOneAndUpdate(
      { owner_id: req.user!._id },
      { $set: { playlist: slides } },
      { new: true, runValidators: true },
    ).lean();
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    logger.info(`Playlist updated for store owner ${req.user!._id}: ${slides.length} slides`);
    res.json({ success: true, data: store.playlist });
  } catch (error) {
    logger.error('Save playlist error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

import storeTypes from '../data/storeTypes.json';

// GET /stores/store-types  — returns the full list of supported store types
router.get('/store-types', (_req, res: Response) => {
  res.json({ success: true, data: storeTypes });
});

// PATCH /stores/my-store/store-type  { store_type: 'coffee' }
router.patch('/my-store/store-type', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { store_type } = req.body;
    const valid = storeTypes.map((t) => t.id);
    if (!store_type || !valid.includes(store_type)) {
      res.status(400).json({ success: false, message: `store_type must be one of: ${valid.join(', ')}` }); return;
    }
    const store = await Store.findOneAndUpdate(
      { owner_id: req.user!._id },
      { store_type },
      { new: true },
    );
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    logger.info(`Store type set to "${store_type}" for store ${store._id}`);
    res.json({ success: true, data: store });
  } catch (error) {
    logger.error('Set store type error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── Category management (global collection, scoped by store_type) ────────────

// GET /stores/my-store/categories
// Returns all global categories matching the store's store_type.
router.get('/my-store/categories', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const store = await Store.findOne({ owner_id: req.user!._id }, 'store_type');
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    const cats = await Category.find({ store_type: store.store_type, is_disabled: { $ne: true } }).sort({ sort_order: 1, created_at: 1 });
    res.json({ success: true, data: cats });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /stores/my-store/categories  { name }
// Creates a new global Category using the store's store_type.
router.post('/my-store/categories', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const name = req.body.name?.trim();
    if (!name) { res.status(400).json({ success: false, message: 'name is required' }); return; }
    const store = await Store.findOne({ owner_id: req.user!._id }, 'store_type');
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    const existing = await Category.findOne({ name, store_type: store.store_type });
    if (existing) { res.status(409).json({ success: false, message: 'Category already exists' }); return; }
    const count = await Category.countDocuments({ store_type: store.store_type });
    const cat = await Category.create({ name, store_type: store.store_type, sort_order: count });
    logger.info(`Category "${name}" created for store_type "${store.store_type}"`);
    res.status(201).json({ success: true, data: cat });
  } catch (error) {
    logger.error('Add category error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PATCH /stores/my-store/categories/:id  { name }
// Renames the category and cascades to this store's menu items.
router.patch('/my-store/categories/:id', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const store = await Store.findOne({ owner_id: req.user!._id }, '_id store_type');
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    const cat = await Category.findOne({ _id: req.params.id, store_type: store.store_type });
    if (!cat) { res.status(404).json({ success: false, message: 'Category not found' }); return; }
    const newName = req.body.name?.trim();
    if (!newName) { res.status(400).json({ success: false, message: 'name is required' }); return; }
    if (newName !== cat.name) {
      const conflict = await Category.findOne({ name: newName, store_type: store.store_type });
      if (conflict) { res.status(409).json({ success: false, message: 'A category with that name already exists' }); return; }
      cat.name = newName;
    }
    await cat.save();
    logger.info(`Category "${cat.name}" renamed`);
    res.json({ success: true, data: cat });
  } catch (error) {
    logger.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /stores/my-store/categories/:id
// Blocked if any of this store's menu items still use the category.
router.delete('/my-store/categories/:id', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const store = await Store.findOne({ owner_id: req.user!._id }, '_id store_type');
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    const cat = await Category.findOne({ _id: req.params.id, store_type: store.store_type });
    if (!cat) { res.status(404).json({ success: false, message: 'Category not found' }); return; }
    const count = await MenuItem.countDocuments({ store_id: store._id, category: cat._id });
    if (count > 0) {
      res.status(400).json({ success: false, message: `${count} item${count !== 1 ? 's' : ''} still use this category. Reassign or delete them first.` }); return;
    }
    await cat.deleteOne();
    logger.info(`Category "${cat.name}" deleted`);
    res.json({ success: true, data: { deleted: cat._id } });
  } catch (error) {
    logger.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;