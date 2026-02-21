import express, { Request, Response } from 'express';
import { User, Store } from '../models';
import { hashPassword, comparePassword, generateToken, authenticateToken, AuthenticatedRequest } from '../utils/auth';
import { registerSchema, loginSchema } from '../utils/validation';
import { logger } from '../utils/logger';

const router = express.Router();

// Register new user
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user
    const user = new User({
      email: validatedData.email,
      name: validatedData.name,
      password_hash: passwordHash,
      role: validatedData.role || 'owner'
    });

    await user.save();
    logger.info(`New user registered: ${user.email}`);

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        token
      },
      message: 'User registered successfully'
    });

  } catch (error: any) {
    logger.error('Registration error:', error);
    
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

// Login user
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedData = loginSchema.parse(req.body);

    // Find user
    const user = await User.findOne({ email: validatedData.email });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    // Check password
    const isValidPassword = await comparePassword(validatedData.password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    // Generate token
    const token = generateToken(user._id.toString());

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        token
      },
      message: 'Login successful'
    });

  } catch (error: any) {
    logger.error('Login error:', error);
    
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

// Get current user
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;

    // Get user's store if they have one
    const store = await Store.findOne({ owner_id: user._id });

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        store: store ? {
          _id: store._id,
          name: store.name,
          timezone: store.timezone,
          branding: store.branding,
          template_id: store.template_id,
          template_config: store.template_config,
          created_at: store.created_at,
          updated_at: store.updated_at
        } : null
      }
    });

  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout (client-side token removal, but we can log it)
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    logger.info(`User logged out: ${req.user?.email}`);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;