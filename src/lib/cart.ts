import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import { trackAddToCart } from './analytics';

export interface CartItem {
  productId: string;
  slug?: string;              // product / wall-art slug (GA4 item_id, checkout metadata); absent on carts saved before Oct 2026
  name: string;
  price: number;
  size: string;
  colour: string;
  image: string;
  productType?: string;       // used by checkout to resolve the exact Printful variant
  format?: string;            // WALL ART ONLY: format id (poster | canvas-standard | canvas-gallery)
  stripePriceId?: string;     // optional: nested model uses ad-hoc price_data
  printfulVariantId?: string; // optional: resolved server-side at checkout
  quantity: number;
}

/* Persistent cart — survives page navigations and browser restarts.
   Astro full-page-loads between routes, so a plain atom() empties the cart
   on every navigation; persistentAtom keeps it in localStorage. */
export const cartItems = persistentAtom<CartItem[]>('lr-cart-v1', [], {
  encode: JSON.stringify,
  decode: (v) => {
    try { return JSON.parse(v) ?? []; } catch { return []; }
  },
});

export const cartOpen = atom(false);

export const cartTotal = computed(cartItems, (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

export const cartCount = computed(cartItems, (items) =>
  items.reduce((sum, item) => sum + item.quantity, 0)
);

/* Free-shipping progress — threshold shared across all brands (£75).
   $qualifiesForFreeShipping / $amountToFreeShipping mirror the Wyrmfuel API
   so the CartDrawer progress bar reads the same values.
   Keep in sync with FREE_THRESHOLD_PENCE (7500) in create-checkout.js. */
export const FREE_SHIPPING_THRESHOLD = 75;

export const qualifiesForFreeShipping = computed(cartTotal, (total) =>
  total >= FREE_SHIPPING_THRESHOLD
);

export const amountToFreeShipping = computed(cartTotal, (total) =>
  Math.max(0, FREE_SHIPPING_THRESHOLD - total)
);

/* The product slug for a cart line. Lines saved before slugs were stored
   fall back to the id: product-{slug}-{productType} (Sanity _id is
   product-{slug}) or wallart-{slug}-{format}-{size}. */
export function cartSlug(item: Pick<CartItem, 'productId' | 'slug' | 'productType' | 'format' | 'size'>): string {
  if (item.slug) return item.slug;
  const id = String(item.productId || '');
  if (id.startsWith('wallart-')) {
    const suffix = `-${item.format}-${item.size}`;
    return item.format && item.size && id.endsWith(suffix) ? id.slice(8, id.length - suffix.length) : id.slice(8);
  }
  if (id.startsWith('product-')) {
    const rest = id.slice(8);
    const suffix = item.productType ? `-${item.productType}` : '';
    return suffix && rest.endsWith(suffix) ? rest.slice(0, rest.length - suffix.length) : rest;
  }
  return id;
}

/* Every add goes through here (garment PDP bridge and the drawer's wall-art
   listener), so this is where add_to_cart is sent (no-op without consent).
   Wall-art lines key by productId only (the wallart-{slug}-{format}-{size} id
   already encodes format + size, and colour is ""), so the same (productId,
   size, colour) dedup below keeps each format/size as its own line. Garment
   behaviour is unchanged. */
export function addToCart(input: Omit<CartItem, 'quantity'>) {
  const item = { ...input, slug: cartSlug(input) };
  const current = cartItems.get();
  const existing = current.find(
    (i) =>
      i.productId === item.productId &&
      i.size === item.size &&
      i.colour === item.colour
  );

  if (existing) {
    cartItems.set(
      current.map((i) =>
        i === existing ? { ...i, quantity: i.quantity + 1 } : i
      )
    );
  } else {
    cartItems.set([...current, { ...item, quantity: 1 }]);
  }

  trackAddToCart({ ...item, quantity: 1 });

  cartOpen.set(true);
}

export function removeFromCart(productId: string, size: string, colour: string) {
  cartItems.set(
    cartItems.get().filter(
      (i) =>
        !(i.productId === productId && i.size === size && i.colour === colour)
    )
  );
}

export function updateQuantity(productId: string, size: string, colour: string, quantity: number) {
  if (quantity <= 0) {
    removeFromCart(productId, size, colour);
    return;
  }

  cartItems.set(
    cartItems.get().map((i) =>
      i.productId === productId && i.size === size && i.colour === colour
        ? { ...i, quantity }
        : i
    )
  );
}

/* Empty the cart. Called from the drawer's Clear button and from
   /order-success (ONLY after a session_id confirms payment — never
   clear before the Stripe redirect). */
export function clearCart() {
  cartItems.set([]);
}

export function toggleCart() {
  cartOpen.set(!cartOpen.get());
}
