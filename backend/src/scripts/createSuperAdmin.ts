import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { User } from '../models';
import { hashPassword } from '../utils/auth';
import { logger } from '../utils/logger';

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/dynaro';
    await mongoose.connect(mongoUrl);
    
    logger.info('Connected to MongoDB');

    // Check if superadmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      logger.info('Superadmin user already exists:', existingSuperAdmin.email);
      process.exit(0);
    }

    // Create superadmin user with specific credentials
    const email = 'dynaro@dynaro.ai';
    const password = 'dynaro123';
    const name = 'Dynaro Admin';

    const password_hash = await hashPassword(password);

    const superAdmin = new User({
      email,
      name,
      password_hash,
      role: 'superadmin'
    });

    await superAdmin.save();

    logger.info('✅ Superadmin user created successfully!');
    logger.info(`Email: ${email}`);
    logger.info(`Role: superadmin`);

  } catch (error) {
    logger.error('Error creating superadmin user:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createSuperAdmin();