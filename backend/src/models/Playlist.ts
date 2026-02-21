import mongoose, { Document, Schema } from 'mongoose';
import { ILayoutConfig, DEFAULT_LAYOUT } from './DisplayTemplate';

export interface IPlaylistSlide {
  _id: mongoose.Types.ObjectId;
  label?: string;
  item_ids: string[];
  duration_sec: number;
  layout: ILayoutConfig;
  item_colors?: Record<string, { category?: string; name?: string; price?: string }>;
  item_sizes?:  Record<string, { category?: string; name?: string; price?: string }>;
  item_tags?:   Record<string, { category?: boolean; name?: boolean; price?: boolean }>;
}

export interface IPlaylist extends Document {
  store_id: mongoose.Types.ObjectId;
  name: string;
  slides: IPlaylistSlide[];
  created_at: Date;
  updated_at: Date;
}

const playlistSlideSchema = new Schema<IPlaylistSlide>({
  label:        { type: String, trim: true },
  item_ids:     { type: [String], default: [] },
  duration_sec: { type: Number, default: 9, min: 3, max: 300 },
  layout:       { type: Schema.Types.Mixed, default: () => ({ ...DEFAULT_LAYOUT }) },
  item_colors:  { type: Schema.Types.Mixed, default: () => ({}) },
  item_sizes:   { type: Schema.Types.Mixed, default: () => ({}) },
  item_tags:    { type: Schema.Types.Mixed, default: () => ({}) },
}, { _id: true });

const playlistSchema = new Schema<IPlaylist>({
  store_id: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  name:     { type: String, required: true, trim: true },
  slides:   { type: [playlistSlideSchema], default: () => [] },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

playlistSchema.index({ store_id: 1 });

export const Playlist = mongoose.model<IPlaylist>('Playlist', playlistSchema);
