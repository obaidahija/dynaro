import { Router, Response } from 'express';
import { Store, MenuItem, Playlist } from '../models';
import { authenticateToken, requireOwner, AuthenticatedRequest } from '../utils/auth';
import { logger } from '../utils/logger';

const router = Router();

// ── GET /playlists — list all playlists for the owner's store ─────────────────
router.get('/', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const store = await Store.findOne({ owner_id: req.user!._id }).lean();
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    const playlists = await Playlist.find({ store_id: store._id }).lean();
    res.json({ success: true, data: playlists });
  } catch (error) {
    logger.error('Get playlists error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /playlists — create a new playlist ───────────────────────────────────
router.post('/', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const store = await Store.findOne({ owner_id: req.user!._id }).lean();
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    const { name } = req.body;
    if (!name?.trim()) { res.status(400).json({ success: false, message: 'name is required' }); return; }
    const playlist = await Playlist.create({ store_id: store._id, name: name.trim(), slides: [] });
    logger.info(`Playlist "${name}" created for store ${store._id}`);
    res.status(201).json({ success: true, data: playlist });
  } catch (error) {
    logger.error('Create playlist error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── GET /playlists/:id ────────────────────────────────────────────────────────
router.get('/:id', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const store = await Store.findOne({ owner_id: req.user!._id }).lean();
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    const playlist = await Playlist.findOne({ _id: req.params.id, store_id: store._id }).lean();
    if (!playlist) { res.status(404).json({ success: false, message: 'Playlist not found' }); return; }
    res.json({ success: true, data: playlist });
  } catch (error) {
    logger.error('Get playlist error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── PUT /playlists/:id — replace name + slides ────────────────────────────────
router.put('/:id', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const store = await Store.findOne({ owner_id: req.user!._id }).lean();
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    const { name, slides } = req.body;
    if (!Array.isArray(slides)) { res.status(400).json({ success: false, message: 'slides must be an array' }); return; }
    // Fetch then mutate — required so Mongoose tracks changes to Mixed fields inside subdocuments
    const playlist = await Playlist.findOne({ _id: req.params.id, store_id: store._id });
    if (!playlist) { res.status(404).json({ success: false, message: 'Playlist not found' }); return; }
    if (name?.trim()) playlist.name = name.trim();
    playlist.slides = slides as any;
    playlist.markModified('slides');
    await playlist.save();
    logger.info(`Playlist ${req.params.id} updated: ${slides.length} slides`);
    res.json({ success: true, data: playlist.toObject() });
  } catch (error) {
    logger.error('Update playlist error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── DELETE /playlists/:id ─────────────────────────────────────────────────────
router.delete('/:id', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const store = await Store.findOne({ owner_id: req.user!._id }).lean();
    if (!store) { res.status(404).json({ success: false, message: 'Store not found' }); return; }
    const playlist = await Playlist.findOneAndDelete({ _id: req.params.id, store_id: store._id });
    if (!playlist) { res.status(404).json({ success: false, message: 'Playlist not found' }); return; }
    logger.info(`Playlist ${req.params.id} deleted`);
    res.json({ success: true, message: 'Playlist deleted' });
  } catch (error) {
    logger.error('Delete playlist error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
