import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  password_hash: string;
  role: 'superadmin' | 'owner' | 'admin';
  created_at: Date;
  updated_at: Date;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'owner', 'admin'],
    default: 'owner'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Index for faster queries
userSchema.index({ email: 1 });

export const User = mongoose.model<IUser>('User', userSchema);