import { defineType, defineField } from 'sanity';

/**
 * Order — a record written by the Stripe webhook on a completed checkout, then
 * updated by the Printful webhook (shipped / failed). NOT hand-authored: every
 * field is read-only in Studio (the API writes from the functions bypass this)
 * except `inhouseStatus`, which the owner moves along as wall art is made.
 *
 * Mirrors Cats On Crack's order.ts, plus the Labrats in-house wall-art fields
 * stripe-webhook.cjs writes (`fulfilment` per line, `hasInhouse`, `inhouseStatus`,
 * status "inhouse").
 *
 * DEPLOY: registered in schemas/index.js; `npx sanity deploy` from the Studio
 * folder (NOT the MCP deploy_schema tool).
 */
const ro = <T extends object>(field: T) => ({ ...field, readOnly: true });

export default defineType({
  name: 'order',
  title: 'Order',
  type: 'document',
  icon: () => '🧾',
  fields: [
    ro({ name: 'orderRef', title: 'Order Ref', type: 'string' }),
    ro({ name: 'placedAt', title: 'Placed At', type: 'datetime' }),
    ro({
      name: 'status', title: 'Status', type: 'string',
      options: { list: [
        { title: 'Paid (not yet fulfilled)', value: 'paid' },
        { title: 'Fulfilled (sent to Printful)', value: 'fulfilled' },
        { title: 'In-house (make & dispatch)', value: 'inhouse' },
        { title: 'Shipped (Printful dispatched)', value: 'shipped' },
        { title: 'Fulfilment FAILED — action needed', value: 'fulfilment-failed' },
      ] },
    }),
    ro({ name: 'customerName', title: 'Customer Name', type: 'string' }),
    ro({ name: 'customerEmail', title: 'Customer Email', type: 'string' }),
    ro({
      name: 'items', title: 'Items', type: 'array',
      of: [{
        type: 'object',
        name: 'lineItem',
        fields: [
          { name: 'title', title: 'Item', type: 'string' },
          // Wall art lines carry format / size in colour / size.
          { name: 'colour', title: 'Colour / Format', type: 'string' },
          { name: 'size', title: 'Size', type: 'string' },
          { name: 'quantity', title: 'Qty', type: 'number' },
          { name: 'price', title: 'Line Total (£)', type: 'number' },
          { name: 'fulfilment', title: 'Fulfilment', type: 'string', options: { list: ['printful', 'inhouse'] } },
        ],
        preview: {
          select: { title: 'title', qty: 'quantity', price: 'price', fulfilment: 'fulfilment' },
          prepare: ({ title, qty, price, fulfilment }) => ({
            title: title || 'Item',
            subtitle: `Qty ${qty ?? 1} · £${(price ?? 0).toFixed(2)}${fulfilment === 'inhouse' ? ' · in-house' : ''}`,
          }),
        },
      }],
    }),
    ro({ name: 'hasInhouse', title: 'Has In-house Items', type: 'boolean' }),
    defineField({
      name: 'inhouseStatus', title: 'In-house Status', type: 'string',
      description: 'Wall art made & dispatched by us. Set to "to-make" when the order comes in.',
      hidden: ({ document }) => !document?.hasInhouse,
      options: { list: [
        { title: 'To make', value: 'to-make' },
        { title: 'Made', value: 'made' },
        { title: 'Dispatched', value: 'dispatched' },
      ] },
    }),
    ro({ name: 'shippingCost', title: 'Shipping (£)', type: 'number' }),
    ro({ name: 'total', title: 'Total (£)', type: 'number' }),
    ro({ name: 'currency', title: 'Currency', type: 'string' }),
    ro({
      name: 'shippingAddress', title: 'Shipping Address', type: 'object',
      fields: [
        { name: 'name', title: 'Name', type: 'string' },
        { name: 'line1', title: 'Line 1', type: 'string' },
        { name: 'line2', title: 'Line 2', type: 'string' },
        { name: 'city', title: 'City', type: 'string' },
        { name: 'state', title: 'State/County', type: 'string' },
        { name: 'postalCode', title: 'Postcode', type: 'string' },
        { name: 'country', title: 'Country', type: 'string' },
      ],
    }),
    ro({ name: 'stripeSessionId', title: 'Stripe Session ID', type: 'string' }),
    ro({ name: 'printfulOrderId', title: 'Printful Order ID', type: 'string' }),
    // ── Written by printful-webhook on package_shipped / order_failed ──
    ro({ name: 'carrier', title: 'Carrier', type: 'string' }),
    ro({ name: 'trackingNumber', title: 'Tracking Number', type: 'string' }),
    ro({ name: 'trackingUrl', title: 'Tracking URL', type: 'url' }),
    ro({ name: 'shippedAt', title: 'Shipped At', type: 'datetime' }),
    ro({ name: 'failureReason', title: 'Printful Failure Reason', type: 'string' }),
  ],
  orderings: [
    { title: 'Newest first', name: 'placedAtDesc', by: [{ field: 'placedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { ref: 'orderRef', email: 'customerEmail', total: 'total', status: 'status', placedAt: 'placedAt' },
    prepare: ({ ref, email, total, status, placedAt }) => {
      const badge = status === 'fulfilment-failed' ? '⚠️ '
        : status === 'fulfilled' ? '✓ '
        : status === 'shipped' ? '🚚 '
        : status === 'inhouse' ? '📦 '
        : '• ';
      const date = placedAt ? new Date(placedAt).toLocaleDateString('en-GB') : '';
      return {
        title: `${badge}#${ref || '—'} · £${(total ?? 0).toFixed(2)}`,
        subtitle: [email, date].filter(Boolean).join(' · '),
      };
    },
  },
});
