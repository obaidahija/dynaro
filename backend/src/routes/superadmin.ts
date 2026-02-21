import { Router, Response } from 'express';
import { z } from 'zod';
import { Store, User, DisplayTemplate, Category } from '../models';
import { ILayoutConfig, DEFAULT_LAYOUT } from '../models/DisplayTemplate';
import storeTypes from '../data/storeTypes.json';
import { authenticateToken, requireSuperAdmin, requireOwner, hashPassword, AuthenticatedRequest } from '../utils/auth';
import { logger } from '../utils/logger';

const router = Router();

const createOwnerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const createStoreSchema = z.object({
  storeName: z.string().min(2),
  timezone: z.string().optional(),
  store_type: z.string().optional(),
  owner: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

const editStoreSchema = z.object({
  storeName: z.string().min(2).optional(),
  timezone: z.string().optional(),
  store_type: z.string().optional(),
});

// GET all stores (superadmin only)
router.get('/stores', authenticateToken, requireSuperAdmin, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const stores = await Store.find()
      .populate('owner_id', 'name email role')
      .sort({ created_at: -1 });

    res.json({ success: true, data: stores });
  } catch (error) {
    logger.error('Get stores error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET all owner users (superadmin only)
router.get('/owners', authenticateToken, requireSuperAdmin, async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const owners = await User.find({ role: 'owner' }, '-password_hash').sort({ created_at: -1 });
    res.json({ success: true, data: owners });
  } catch (error) {
    logger.error('Get owners error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST create a store + owner user in one step (superadmin only)
router.post('/stores', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validation = createStoreSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, message: 'Validation error', errors: validation.error.issues });
      return;
    }

    const { storeName, timezone, store_type, owner } = validation.data;

    // Check email not taken
    const existingUser = await User.findOne({ email: owner.email });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'A user with this email already exists' });
      return;
    }

    // Create owner user
    const password_hash = await hashPassword(owner.password);
    const newOwner = await new User({ email: owner.email, name: owner.name, password_hash, role: 'owner' }).save();

    // Get default template
    const defaultTemplate = await DisplayTemplate.findOne({ name: 'Modern Grid' });

    // Create store
    const store = await new Store({
      name: storeName,
      owner_id: newOwner._id,
      timezone: timezone || 'UTC',
      store_type: store_type || 'other',
      template_id: defaultTemplate?._id,
      branding: { primary_color: '#3B82F6', secondary_color: '#64748B', font_family: 'Inter' },
      template_config: { show_descriptions: true, show_categories: true, grid_columns: 3 },
    }).save();

    logger.info(`Superadmin created store "${storeName}" with owner ${owner.email}`);

    res.status(201).json({
      success: true,
      message: 'Store and owner created successfully',
      data: { store, owner: { _id: newOwner._id, email: newOwner.email, name: newOwner.name, role: newOwner.role } },
    });
  } catch (error) {
    logger.error('Create store error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PATCH edit a store's details (superadmin only)
router.patch('/stores/:storeId', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validation = editStoreSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ success: false, message: 'Validation error', errors: validation.error.issues });
      return;
    }
    const store = await Store.findById(req.params.storeId);
    if (!store) {
      res.status(404).json({ success: false, message: 'Store not found' }); return;
    }
    const { storeName, timezone, store_type } = validation.data;
    if (storeName) store.name = storeName;
    if (timezone)  store.timezone = timezone;
    if (store_type) store.store_type = store_type;
    await store.save();
    logger.info(`Superadmin updated store "${store.name}"`);
    res.json({ success: true, data: store, message: 'Store updated successfully' });
  } catch (error) {
    logger.error('Edit store error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PATCH toggle a store's active status (superadmin only)
router.patch('/stores/:storeId/toggle-active', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const store = await Store.findById(req.params.storeId);
    if (!store) {
      res.status(404).json({ success: false, message: 'Store not found' });
      return;
    }
    store.is_active = !store.is_active;
    await store.save();
    logger.info(`Superadmin toggled store "${store.name}" → ${store.is_active ? 'active' : 'inactive'}`);
    res.json({ success: true, data: store, message: `Store is now ${store.is_active ? 'active' : 'inactive'}` });
  } catch (error) {
    logger.error('Toggle store error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE a store (superadmin only)
router.delete('/stores/:storeId', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const store = await Store.findById(req.params.storeId);
    if (!store) {
      res.status(404).json({ success: false, message: 'Store not found' });
      return;
    }
    await Store.findByIdAndDelete(req.params.storeId);
    logger.info(`Superadmin deleted store: ${store.name}`);
    res.json({ success: true, message: 'Store deleted successfully' });
  } catch (error) {
    logger.error('Delete store error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── Category management (superadmin, scoped by store_type) ────────────────────

// GET /superadmin/categories?store_type=coffee_shop
router.get('/categories', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { store_type } = req.query as { store_type?: string };
    if (!store_type) { res.status(400).json({ success: false, message: 'store_type query param is required' }); return; }
    const valid = storeTypes.map((t) => t.id);
    if (!valid.includes(store_type)) { res.status(400).json({ success: false, message: 'Invalid store_type' }); return; }
    const cats = await Category.find({ store_type }).sort({ sort_order: 1, created_at: 1 });
    res.json({ success: true, data: cats });
  } catch (error) {
    logger.error('Superadmin get categories error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /superadmin/categories  { name, store_type }
router.post('/categories', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const name = req.body.name?.trim();
    const store_type = req.body.store_type?.trim();
    if (!name || !store_type) { res.status(400).json({ success: false, message: 'name and store_type are required' }); return; }
    const valid = storeTypes.map((t) => t.id);
    if (!valid.includes(store_type)) { res.status(400).json({ success: false, message: 'Invalid store_type' }); return; }
    const existing = await Category.findOne({ name, store_type });
    if (existing) { res.status(409).json({ success: false, message: 'Category already exists for this store type' }); return; }
    const count = await Category.countDocuments({ store_type });
    const cat = await Category.create({ name, store_type, sort_order: count });
    logger.info(`Superadmin created category "${name}" for store_type "${store_type}"`);
    res.status(201).json({ success: true, data: cat });
  } catch (error) {
    logger.error('Superadmin add category error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PATCH /superadmin/categories/:id  { name?, is_disabled? }
router.patch('/categories/:id', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) { res.status(404).json({ success: false, message: 'Category not found' }); return; }
    const newName = req.body.name?.trim();
    if (newName && newName !== cat.name) {
      const conflict = await Category.findOne({ name: newName, store_type: cat.store_type });
      if (conflict) { res.status(409).json({ success: false, message: 'A category with that name already exists' }); return; }
      cat.name = newName;
    }
    if (typeof req.body.is_disabled === 'boolean') {
      cat.is_disabled = req.body.is_disabled;
    }
    await cat.save();
    logger.info(`Superadmin updated category "${cat.name}"`);
    res.json({ success: true, data: cat });
  } catch (error) {
    logger.error('Superadmin update category error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /superadmin/categories/:id
router.delete('/categories/:id', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) { res.status(404).json({ success: false, message: 'Category not found' }); return; }
    await cat.deleteOne();
    logger.info(`Superadmin deleted category "${cat.name}"`);
    res.json({ success: true, data: { deleted: cat._id } });
  } catch (error) {
    logger.error('Superadmin delete category error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── Template management (superadmin) ─────────────────────────────────────────

const layoutHeaderSchema = z.object({
  visible:    z.boolean().default(true),
  show_logo:  z.boolean().default(true),
  show_name:  z.boolean().default(true),
  show_clock: z.boolean().default(true),
  name_size:  z.enum(['sm', 'md', 'lg', 'xl']).optional(),
});

const layoutMainSchema = z.object({
  type:                z.enum(['menu-grid']).default('menu-grid'),
  columns:             z.number().int().min(1).max(4).default(3),
  rows:                z.number().int().min(1).max(3).default(2),
  show_category_label: z.boolean().default(true),
});

const layoutBannerSchema = z.object({
  visible:  z.boolean().default(true),
  position: z.enum(['top', 'bottom']).default('bottom'),
});

const templateBodySchema = z.object({
  name:              z.string().min(2),
  description:       z.string().min(1),
  preview_image_url: z.string().optional(),
  is_premium:        z.boolean().default(false),
  layout: z.object({
    header:   layoutHeaderSchema,
    main:     layoutMainSchema,
    banner:   layoutBannerSchema,
    bg_theme: z.enum(['dark', 'ocean', 'midnight', 'forest', 'ember']).optional(),
  }).default(() => DEFAULT_LAYOUT as ILayoutConfig),
});

// GET /superadmin/templates  — list all (superadmin only)
router.get('/templates', authenticateToken, requireSuperAdmin, async (_req, res: Response): Promise<void> => {
  try {
    const templates = await DisplayTemplate.find().sort({ created_at: -1 });
    res.json({ success: true, data: templates });
  } catch (err) {
    logger.error('Get templates error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /superadmin/templates  — create
router.post('/templates', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const v = templateBodySchema.safeParse(req.body);
    if (!v.success) { res.status(400).json({ success: false, message: 'Validation error', errors: v.error.issues }); return; }
    const tpl = await new DisplayTemplate(v.data).save();
    logger.info(`Superadmin created template "${tpl.name}"`);
    res.status(201).json({ success: true, data: tpl });
  } catch (err: any) {
    if (err.code === 11000) { res.status(409).json({ success: false, message: 'Template name already exists' }); return; }
    logger.error('Create template error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /superadmin/templates/:id  — full update
router.put('/templates/:id', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const v = templateBodySchema.partial().safeParse(req.body);
    if (!v.success) { res.status(400).json({ success: false, message: 'Validation error', errors: v.error.issues }); return; }
    const tpl = await DisplayTemplate.findByIdAndUpdate(req.params.id, v.data, { new: true, runValidators: true });
    if (!tpl) { res.status(404).json({ success: false, message: 'Template not found' }); return; }
    logger.info(`Superadmin updated template "${tpl.name}"`);
    res.json({ success: true, data: tpl });
  } catch (err: any) {
    if (err.code === 11000) { res.status(409).json({ success: false, message: 'Template name already exists' }); return; }
    logger.error('Update template error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /superadmin/templates/:id
router.delete('/templates/:id', authenticateToken, requireSuperAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tpl = await DisplayTemplate.findByIdAndDelete(req.params.id);
    if (!tpl) { res.status(404).json({ success: false, message: 'Template not found' }); return; }
    logger.info(`Superadmin deleted template "${tpl.name}"`);
    res.json({ success: true, data: { deleted: tpl._id } });
  } catch (err) {
    logger.error('Delete template error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── Public template routes (store owners) ─────────────────────────────────────

// GET /superadmin/templates/public  — list all (any authenticated user)
router.get('/templates/public', authenticateToken, async (_req, res: Response): Promise<void> => {
  try {
    const templates = await DisplayTemplate.find().sort({ is_premium: 1, name: 1 }).lean();
    res.json({ success: true, data: templates });
  } catch (err) {
    logger.error('Get public templates error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PATCH /superadmin/templates/apply  — store owner selects a template
router.patch('/templates/apply', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { template_id } = req.body as { template_id: string };
    if (!template_id) { res.status(400).json({ success: false, message: 'template_id is required' }); return; }
    const tpl = await DisplayTemplate.findById(template_id);
    if (!tpl) { res.status(404).json({ success: false, message: 'Template not found' }); return; }
    const store = await Store.findOne({ owner_id: req.user!._id });
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    store.template_id = tpl._id as any;
    await store.save();
    logger.info(`Store "${store.name}" applied template "${tpl.name}"`);
    res.json({ success: true, data: { template: tpl, store } });
  } catch (err) {
    logger.error('Apply template error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
