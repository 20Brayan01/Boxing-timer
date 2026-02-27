import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import db, { activeDbPath } from './db.ts';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seed } from './seed.ts';

const dbPath = activeDbPath;

dotenv.config();

// Safer seeding
try {
  seed();
} catch (err) {
  console.error('Initial seeding failed:', err);
}

const app = express();
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    res.json({ 
      status: 'ok', 
      database: 'connected', 
      userCount,
      env: process.env.NETLIFY ? 'netlify' : 'local',
      dbPath: activeDbPath
    });
  } catch (err: any) {
    res.status(500).json({ 
      status: 'error', 
      message: err.message,
      stack: err.stack
    });
  }
});

// Stripe initialization
let stripe: Stripe | null = null;
const getStripe = () => {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.warn('STRIPE_SECRET_KEY is not set. Stripe features will be disabled.');
      return null;
    }
    if (key.startsWith('http')) {
      console.error('Invalid STRIPE_SECRET_KEY: It looks like you provided a URL instead of the actual secret key.');
      return null;
    }
    stripe = new Stripe(key);
  }
  return stripe;
};

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.log('Auth failed: No token');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const session = db.prepare("SELECT user_id, expires_at FROM sessions WHERE id = ?").get(token) as any;
  if (!session) {
    console.log('Auth failed: Session not found for token');
    return res.status(401).json({ error: 'Session expired or invalid' });
  }

  const isExpired = new Date(session.expires_at) < new Date();
  if (isExpired) {
    console.log(`Auth failed: Session expired. Expires at: ${session.expires_at}`);
    return res.status(401).json({ error: 'Session expired or invalid' });
  }

  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(session.user_id) as any;
  if (!user) {
    console.log(`Auth failed: User not found for id ${session.user_id}`);
    return res.status(401).json({ error: 'User not found' });
  }

  req.userId = user.id;
  req.userRole = user.role;
  next();
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

// API Routes

// Auth
app.post('/api/auth/signup', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  const normalizedEmail = email.toLowerCase().trim();
  const role = normalizedEmail === 'admin@wu-boxing.com' ? 'admin' : 'user';
  
  try {
    const result = db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run(normalizedEmail, password, role);
    console.log(`User signed up: ${normalizedEmail}`);
    res.json({ success: true, userId: result.lastInsertRowid });
  } catch (error: any) {
    console.error(`Signup error for ${normalizedEmail}:`, error.message);
    res.status(400).json({ error: error.message.includes('UNIQUE') ? 'Email already exists' : error.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Login attempt: ${normalizedEmail}`);

    const user = db.prepare('SELECT id, email, role, subscription_end_date FROM users WHERE email = ? AND password = ?').get(normalizedEmail, password) as any;
    
    if (!user) {
      console.log(`Login failed for: ${normalizedEmail}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    
    db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(token, user.id, expiresAt);
    console.log(`Session created for user: ${user.id}`);
    res.json({ token, user });
  } catch (error: any) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Internal server error during login', details: error.message });
  }
});

app.get('/api/auth/me', authenticate, (req: any, res) => {
  const user = db.prepare('SELECT id, email, role, subscription_end_date FROM users WHERE id = ?').get(req.userId) as any;
  res.json(user);
});

// Stripe
app.post('/api/create-checkout-session', authenticate, async (req: any, res) => {
  const { planName, price, duration } = req.body;
  const stripeClient = getStripe();

  if (!stripeClient) {
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  try {
    const origin = req.headers.origin || process.env.APP_URL || 'http://localhost:3000';
    
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: (db.prepare('SELECT email FROM users WHERE id = ?').get(req.userId) as any).email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Monkey Squad Elite - ${planName}`,
              description: `Access to all premium workouts for ${duration}`,
            },
            unit_amount: Math.round(parseFloat(price.replace('$', '')) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        userId: req.userId.toString(),
        duration: duration
      },
      success_url: `${origin}?session_id={CHECKOUT_SESSION_ID}&payment=success`,
      cancel_url: `${origin}?payment=cancel`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/subscription/verify', authenticate, async (req: any, res) => {
  const { sessionId } = req.body;
  const stripeClient = getStripe();
  if (!stripeClient) return res.status(500).json({ error: 'Stripe not configured' });

  try {
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === 'paid') {
      const userId = session.metadata?.userId;
      const durationStr = session.metadata?.duration || '1 Month';
      const amount = session.amount_total || 0;
      
      let days = 30;
      if (durationStr.includes('3')) days = 90;
      if (durationStr.includes('6')) days = 180;

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);
      
      db.prepare('UPDATE users SET subscription_end_date = ? WHERE id = ?').run(endDate.toISOString(), userId);
      
      // Record payment
      db.prepare('INSERT INTO payments (user_id, amount, status, stripe_session_id) VALUES (?, ?, ?, ?)')
        .run(userId, amount, 'completed', sessionId);
      
      res.json({ success: true, subscriptionEndDate: endDate.toISOString() });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Workouts & Plans
app.get('/api/workouts', (req, res) => {
  const workouts = db.prepare('SELECT * FROM workouts').all() as any[];
  workouts.forEach(w => w.instructions = JSON.parse(w.instructions));
  res.json(workouts);
});

app.get('/api/plans', (req, res) => {
  const plans = db.prepare('SELECT * FROM plans').all() as any[];
  plans.forEach(p => p.features = JSON.parse(p.features));
  res.json(plans);
});

// Admin APIs
app.get('/api/admin/stats', authenticate, isAdmin, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  const totalRevenue = db.prepare("SELECT SUM(amount) as total FROM payments WHERE status = 'completed'").get() as any;
  const recentPayments = db.prepare(`
    SELECT p.*, u.email 
    FROM payments p 
    JOIN users u ON p.user_id = u.id 
    ORDER BY p.created_at DESC LIMIT 10
  `).all();
  
  const revenueByDay = db.prepare(`
    SELECT date(created_at) as date, SUM(amount) as total 
    FROM payments 
    WHERE status = 'completed' 
    GROUP BY date(created_at) 
    ORDER BY date ASC
  `).all();

  res.json({
    totalUsers: totalUsers.count,
    totalRevenue: (totalRevenue.total || 0) / 100,
    recentPayments,
    revenueByDay
  });
});

app.get('/api/admin/users', authenticate, isAdmin, (req, res) => {
  const users = db.prepare('SELECT id, email, role, subscription_end_date, created_at FROM users').all();
  res.json(users);
});

app.post('/api/admin/workouts', authenticate, isAdmin, (req, res) => {
  const workout = req.body;
  try {
    db.prepare(`
      INSERT OR REPLACE INTO workouts (id, name, description, rounds, fight_time, rest_time, category, difficulty, is_premium, gif_url, instructions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      workout.id, workout.name, workout.description, workout.rounds, 
      workout.fight_time, workout.rest_time, workout.category, 
      workout.difficulty, workout.is_premium ? 1 : 0, workout.gif_url, 
      JSON.stringify(workout.instructions)
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/workouts/:id', authenticate, isAdmin, (req, res) => {
  db.prepare('DELETE FROM workouts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.post('/api/admin/plans', authenticate, isAdmin, (req, res) => {
  const plan = req.body;
  try {
    db.prepare(`
      INSERT OR REPLACE INTO plans (id, name, price, duration_months, features)
      VALUES (?, ?, ?, ?, ?)
    `).run(plan.id, plan.name, plan.price, plan.duration_months, JSON.stringify(plan.features));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Backup API
app.get('/api/admin/backup', authenticate, isAdmin, (req, res) => {
  try {
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Database file not found' });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `spartime-backup-${timestamp}.db`;
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(dbPath);
    fileStream.pipe(res);
  } catch (error: any) {
    res.status(500).json({ error: 'Backup failed: ' + error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

export default app;
