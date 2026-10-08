// Tests for the cart's quantity rules in src/lib/cart-quantity.ts (pure; no
// nanostores, no window). Node 23.6+ runs the .ts file directly.
//
//   npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

const { MAX_QTY_PER_LINE, requestedQty, addLine, setLineQty, sanitizeStoredCart } =
  await import('../src/lib/cart-quantity.ts');

const teeM = {
  productId: 'product-some-design-tshirt', slug: 'some-design', name: 'Some Design T-Shirt',
  price: 25, size: 'M', colour: 'Black', image: 'x', productType: 'tshirt',
};
const teeL = { ...teeM, size: 'L' };
const teeMWhite = { ...teeM, colour: 'White' };
const poster = {
  productId: 'wallart-some-art-poster-small', slug: 'some-art', name: 'Some Art',
  price: 9.99, size: 'small', colour: '', format: 'poster', image: 'y', productType: 'wallart',
};
const line = (item, quantity) => ({ ...item, quantity });
const key = (i) => ({ productId: i.productId, size: i.size, colour: i.colour });

test('the cap is 10 per line', () => {
  assert.equal(MAX_QTY_PER_LINE, 10);
});

test('requestedQty: whole numbers 1..10; anything else becomes 1', () => {
  assert.equal(requestedQty(3), 3);
  assert.equal(requestedQty('4'), 4);
  assert.equal(requestedQty(2.9), 2);
  assert.equal(requestedQty(50), 10);
  for (const bad of [0, -5, NaN, Infinity, undefined, null, '', 'lots', true, [2], {}]) {
    assert.equal(requestedQty(bad), 1, `requestedQty(${String(bad)})`);
  }
});

test('addLine: same productId + size + colour merges; size or colour makes a new line', () => {
  let { items, added } = addLine([], teeM, 1);
  assert.equal(added, 1);
  ({ items } = addLine(items, teeM, undefined));
  ({ items } = addLine(items, teeL, 3));
  ({ items } = addLine(items, teeMWhite, 2));
  ({ items } = addLine(items, poster, 1));
  assert.deepEqual(items.map((i) => [i.size, i.colour, i.quantity]), [
    ['M', 'Black', 2], ['L', 'Black', 3], ['M', 'White', 2], ['small', '', 1],
  ]);
});

test('addLine: adding a chosen quantity stops at the cap and reports what was added', () => {
  let { items, added } = addLine([line(teeM, 8)], teeM, 5);
  assert.equal(items[0].quantity, 10);
  assert.equal(added, 2);
  ({ items, added } = addLine(items, teeM, 1));
  assert.equal(added, 0);
  assert.equal(items[0].quantity, 10);
});

test('addLine: a saved line already above the cap is not reduced by adding', () => {
  const { items, added } = addLine([line(teeM, 12)], teeM, 1);
  assert.equal(items[0].quantity, 12);
  assert.equal(added, 0);
});

test('setLineQty: + and − within 1..10; below 1 removes; the cap holds', () => {
  const start = [line(teeM, 2), line(teeL, 1)];
  assert.equal(setLineQty(start, key(teeM), 3)[0].quantity, 3);
  assert.equal(setLineQty(start, key(teeM), 1)[0].quantity, 1);
  assert.deepEqual(setLineQty(start, key(teeM), 0).map((i) => i.size), ['L']);
  assert.equal(setLineQty([line(teeM, 10)], key(teeM), 11)[0].quantity, 10);
  assert.equal(setLineQty([line(teeM, 12)], key(teeM), 11)[0].quantity, 11);
  assert.equal(setLineQty([line(teeM, 12)], key(teeM), 13)[0].quantity, 12);
  assert.equal(setLineQty(start, key(teeM), 5)[1].quantity, 1);
});

test('setLineQty: junk is ignored, fractions are floored, unknown lines are a no-op', () => {
  const start = [line(teeM, 2)];
  for (const bad of ['5', NaN, Infinity, null, undefined, true, [4]]) {
    assert.equal(setLineQty(start, key(teeM), bad), start, `setLineQty(${String(bad)})`);
  }
  assert.equal(setLineQty(start, key(teeM), 3.7)[0].quantity, 3);
  assert.equal(setLineQty(start, key(teeMWhite), 3), start);
});

test('sanitizeStoredCart: a basket saved by the old cart loads unchanged', () => {
  const saved = JSON.parse(JSON.stringify([
    line(teeM, 2),
    { productId: 'product-older-tshirt', name: 'Older', price: 25, size: 'S', colour: 'Black', image: '', quantity: 1 }, // no slug (older shape)
    line(poster, 1),
    line(teeL, 14), // the old cart had no cap
  ]));
  assert.deepEqual(sanitizeStoredCart(saved), saved);
});

test('sanitizeStoredCart: repairs or drops what could never check out', () => {
  assert.deepEqual(sanitizeStoredCart(null), []);
  assert.deepEqual(sanitizeStoredCart({ items: [] }), []);
  const out = sanitizeStoredCart([
    null, 'x', { name: 'no id', price: 1, size: 'M', colour: '', quantity: 1 },
    { productId: 'a', size: 'M', colour: '', price: 'free', quantity: 1 },
    { productId: 'b', size: 'M', colour: '', price: 10, quantity: 0 },
    { productId: 'c', size: 'M', colour: '', price: 10, quantity: -3 },
    { productId: 'd', size: 'M', colour: '', price: 10, quantity: 2.6 },
    { productId: 'e', size: 'M', colour: '', price: 10, quantity: 1e6 },
    { productId: 'f', size: 'M', colour: '', price: 10, quantity: '3' },
  ]);
  assert.deepEqual(out.map((i) => [i.productId, i.quantity]), [['b', 1], ['c', 1], ['d', 2], ['e', 99], ['f', 1]]);
});
