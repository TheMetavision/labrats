import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const BRAND_TAG = 'labrats-web';

const ALLOWED_COUNTRIES = [
  'GB',
  'US', 'CA',
  'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'PL', 'SE',
  'DK', 'FI', 'CZ', 'GR', 'RO', 'HU', 'BG', 'HR', 'SK', 'SI', 'LT',
  'LV', 'EE', 'CY', 'LU', 'MT', 'MC', 'SM', 'VA', 'AD', 'AZ', 'KZ',
  'IS', 'LI', 'NO', 'CH',
  'AU', 'NZ',
  'JP', 'BR',
  'MX', 'SG', 'KR', 'IN', 'ZA', 'AE', 'SA', 'TH', 'MY', 'PH', 'ID',
  'AR', 'CL', 'CO', 'PE', 'HK', 'TW', 'IL', 'TR', 'NG', 'KE', 'GH',
];

function buildShippingOptions(cartTotalPence) {
  const freeThreshold = 7500;
  const ukRate = cartTotalPence >= freeThreshold ? 0 : 695;
  const ukLabel = cartTotalPence >= freeThreshold
    ? 'UK Standard (FREE over £75)'
    : 'UK Standard';

  return [
    {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: ukRate, currency: 'gbp' },
        display_name: ukLabel,
        delivery_estimate: {
          minimum: { unit: 'business_day', value: 3 },
          maximum: { unit: 'business_day', value: 5 },
        },
      },
    },
    {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: 1295, currency: 'gbp' },
        display_name: 'Europe',
        delivery_estimate: {
          minimum: { unit: 'business_day', value: 5 },
          maximum: { unit: 'business_day', value: 10 },
        },
      },
    },
    {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: 1495, currency: 'gbp' },
        display_name: 'North America',
        delivery_estimate: {
          minimum: { unit: 'business_day', value: 7 },
          maximum: { unit: 'business_day', value: 14 },
        },
      },
    },
    {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: 1795, currency: 'gbp' },
        display_name: 'Australia & New Zealand',
        delivery_estimate: {
          minimum: { unit: 'business_day', value: 10 },
          maximum: { unit: 'business_day', value: 18 },
        },
      },
    },
    {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: 1995, currency: 'gbp' },
        display_name: 'Rest of World',
        delivery_estimate: {
          minimum: { unit: 'business_day', value: 10 },
          maximum: { unit: 'business_day', value: 21 },
        },
      },
    },
  ];
}

export default async function handler(req, context) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { items } = await req.json();

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Cart is empty' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const SITE_URL = process.env.SITE_URL || 'https://labrats.uk';

    const line_items = items.map((item) => {
      const colourLabel = item.colour ? ` — ${item.colour}` : '';
      return {
        price_data: {
          currency: 'gbp',
          unit_amount: Math.round(item.price * 100),
          product_data: {
            name: `${item.name}${colourLabel} (${item.size})`,
          },
        },
        quantity: item.quantity || 1,
      };
    });

    const cartTotalPence = items.reduce((sum, item) => {
      return sum + Math.round(item.price * 100) * (item.quantity || 1);
    }, 0);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      shipping_address_collection: {
        allowed_countries: ALLOWED_COUNTRIES,
      },
      shipping_options: buildShippingOptions(cartTotalPence),
      success_url: `${SITE_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/merch`,
      metadata: { source: BRAND_TAG },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Stripe checkout error:', error.message || error);
    return new Response(
      JSON.stringify({ error: error.message || 'Checkout failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export const config = {
  path: '/api/create-checkout',
};
