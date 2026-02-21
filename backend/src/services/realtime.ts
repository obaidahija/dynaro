// Real-time service for live updates using Socket.IO

import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger';

export interface RealTimeEvent {
  type: 'menu_update' | 'promotion_update' | 'store_update';
  store_id: string;
  data: any;
  timestamp: string;
}

export class RealtimeService {
  private io: Server;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true
      }
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Join store-specific room
      socket.on('join-store', (storeId: string) => {
        socket.join(`store-${storeId}`);
        logger.debug(`Socket ${socket.id} joined store-${storeId}`);
      });

      // Leave store room
      socket.on('leave-store', (storeId: string) => {
        socket.leave(`store-${storeId}`);
        logger.debug(`Socket ${socket.id} left store-${storeId}`);
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  // Broadcast events to specific store
  async broadcastToStore(storeId: string, event: RealTimeEvent) {
    this.io.to(`store-${storeId}`).emit('update', event);
    logger.debug(`Broadcasted ${event.type} to store-${storeId}`);
  }

  // Menu updates
  async notifyMenuUpdate(storeId: string, data: any) {
    const event: RealTimeEvent = {
      type: 'menu_update',
      store_id: storeId,
      data,
      timestamp: new Date().toISOString()
    };
    await this.broadcastToStore(storeId, event);
  }

  // Promotion updates
  async notifyPromotionUpdate(storeId: string, data: any) {
    const event: RealTimeEvent = {
      type: 'promotion_update',
      store_id: storeId,
      data,
      timestamp: new Date().toISOString()
    };
    await this.broadcastToStore(storeId, event);
  }

  // Store updates
  async notifyStoreUpdate(storeId: string, data: any) {
    const event: RealTimeEvent = {
      type: 'store_update',
      store_id: storeId,
      data,
      timestamp: new Date().toISOString()
    };
    await this.broadcastToStore(storeId, event);
  }

  // Get connected clients count for a store
  getStoreClientCount(storeId: string): number {
    const room = this.io.sockets.adapter.rooms.get(`store-${storeId}`);
    return room ? room.size : 0;
  }

  // Get total connected clients
  getTotalClientCount(): number {
    return this.io.engine.clientsCount;
  }
}