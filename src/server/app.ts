import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import db from './db';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(express.json());

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
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const session = db.prepare('SELECT user_id FROM sessions WHERE id = ? AND expires_at > datetime("now")').get(token) as any;
  if (!session) return res.status(401).json({ error: 'Session expired or invalid' });

  req.userId = session.user_id;
  next();
};

// API Routes

// Auth
app.post('/api/auth/signup', (req, res) => {
  const { email, password } = req.body;
  try {
    const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, password);
    res.json({ success: true, userId: result.lastInsertRowid });
  } catch (error: any) {
    res.status(400).json({ error: error.message.includes('UNIQUE') ? 'Email already exists' : error.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT id, email FROM users WHERE email = ? AND password = ?').get(email, password) as any;
  
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  
  db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(token, user.id, expiresAt);
  
  res.json({ token, user });
});

app.get('/api/auth/me', authenticate, (req: any, res) => {
  const user = db.prepare('SELECT id, email, subscription_end_date FROM users WHERE id = ?').get(req.userId) as any;
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
      
      let days = 30;
      if (durationStr.includes('3')) days = 90;
      if (durationStr.includes('6')) days = 180;

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);
      
      db.prepare('UPDATE users SET subscription_end_date = ? WHERE id = ?').run(endDate.toISOString(), userId);
      
      res.json({ success: true, subscriptionEndDate: endDate.toISOString() });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

export default app;
