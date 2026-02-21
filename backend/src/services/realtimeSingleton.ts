/**
 * Realtime singleton — routes import from here to avoid circular deps with server.ts
 */
import { RealtimeService } from './realtime';

let _instance: RealtimeService | null = null;

export function setRealtimeInstance(instance: RealtimeService) {
  _instance = instance;
}

export function getRealtimeInstance(): RealtimeService {
  if (!_instance) throw new Error('RealtimeService not initialized');
  return _instance;
}
