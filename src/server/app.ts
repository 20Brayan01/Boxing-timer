import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

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

app.use(express.json());

// API Routes
app.post('/api/create-checkout-session', async (req, res) => {
  const { planName, price, duration } = req.body;
  const stripeClient = getStripe();

  if (!stripeClient) {
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  try {
    // Use the request origin to construct redirect URLs for multi-environment support (Local, AI Studio, Netlify)
    const origin = req.headers.origin || process.env.APP_URL || 'http://localhost:3000';
    
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
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
      success_url: `${origin}?session_id={CHECKOUT_SESSION_ID}&payment=success`,
      cancel_url: `${origin}?payment=cancel`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

export default app;
