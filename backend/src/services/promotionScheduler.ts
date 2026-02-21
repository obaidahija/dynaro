/**
 * Promotion scheduler — runs every 30 seconds and fires socket events
 * whenever a promotion transitions between states (starts or expires).
 * The display front-end re-fetches on any promotion_update event, so it
 * will immediately hide expired deals and show newly-started ones.
 */
import { Promotion } from '../models';
import { getRealtimeInstance } from './realtimeSingleton';
import { logger } from '../utils/logger';

const TICK_MS = 30_000; // 30 s — fine enough resolution, cheap query

let timer: NodeJS.Timeout | null = null;
let lastTick: Date = new Date();

async function tick() {
  try {
    const now = new Date();
    const since = lastTick;
    lastTick = now;

    // Promotions whose end_time fell inside the last tick window → just expired
    const justExpired = await Promotion.find({
      end_time: { $gte: since, $lt: now },
    }).select('store_id name').lean();

    // Promotions whose start_time fell inside the last tick window and are active → just went live
    const justStarted = await Promotion.find({
      start_time: { $gte: since, $lt: now },
      is_active: true,
    }).select('store_id name').lean();

    const affected = [...justExpired, ...justStarted];
    if (affected.length === 0) return;

    // Deduplicate by store_id and notify once per store
    const storeIds = [...new Set(affected.map((p) => String(p.store_id)))];
    const realtime = getRealtimeInstance();

    for (const storeId of storeIds) {
      await realtime.notifyPromotionUpdate(storeId, { action: 'schedule_tick' });
      logger.info(`[PromotionScheduler] notified store ${storeId} (${
        affected.filter((p) => String(p.store_id) === storeId).map((p) => p.name).join(', ')
      })`);
    }
  } catch (err) {
    logger.error('[PromotionScheduler] tick error:', err);
  }
}

export function startPromotionScheduler() {
  if (timer) return; // already running
  lastTick = new Date();
  timer = setInterval(tick, TICK_MS);
  logger.info('[PromotionScheduler] started (30 s interval)');
}

export function stopPromotionScheduler() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    logger.info('[PromotionScheduler] stopped');
  }
}
