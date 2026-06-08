import { useStore } from '@nanostores/react';
import { cartItems, cartOpen, cartTotal, removeFromCart, updateQuantity, toggleCart, clearCart } from '../lib/cart';

/* Brand tokens — read from the site's CSS variables (defined in Layout.astro)
   with hex fallbacks, so this component ports across IP brands by inheriting
   each site's palette instead of hardcoding colours. */
const ACCENT = 'var(--color-teal, #00c2d4)';      // brand accent (buttons/borders)
const HIGHLIGHT = 'var(--color-yellow, #f5c518)'; // headings/prices
const BG = 'var(--color-bg-alt, #111111)';
const TEXT = 'var(--color-text, #f5f5f5)';
const HEADING_FONT = "var(--font-heading, 'Barlow Condensed', sans-serif)";
const BODY_FONT = "var(--font-body, 'Barlow', sans-serif)";

export default function CartDrawer() {
  const items = useStore(cartItems);
  const isOpen = useStore(cartOpen);
  const total = useStore(cartTotal);

  async function handleCheckout() {
    if (items.length === 0) return;
    try {
      const res = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            /* id + productType let create-checkout resolve the exact Printful
               sync variant (id = product-{slug}-{productType}, set by the PDP). */
            id: item.productId,
            title: item.name,
            name: item.name,
            productType: item.productType || '',
            price: item.price,
            size: item.size,
            colour: item.colour || '',
            image: item.image || '',
            quantity: item.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url; else alert('Checkout failed.');
    } catch (err) { console.error(err); alert('Something went wrong.'); }
  }

  function handleClear() {
    if (items.length === 0) return;
    if (window.confirm('Empty your cart?')) clearCart();
  }

  return (
    <>
      {isOpen && <div onClick={toggleCart} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:998 }} />}

      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:'400px', maxWidth:'90vw', background:BG, zIndex:999, transform:isOpen?'translateX(0)':'translateX(100%)', transition:'transform 0.3s ease', display:'flex', flexDirection:'column', borderLeft:`2px solid ${ACCENT}` }}>
        <div style={{ padding:'24px', borderBottom:'1px solid rgba(255,255,255,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ fontFamily:HEADING_FONT, fontWeight:700, fontSize:'20px', letterSpacing:'1px', textTransform:'uppercase' as const, color:HIGHLIGHT, margin:0 }}>Your Cart</h2>
          <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
            {items.length > 0 && (
              <button onClick={handleClear} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.45)', cursor:'pointer', fontFamily:HEADING_FONT, fontWeight:700, fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase' as const, padding:0, textDecoration:'underline', textUnderlineOffset:'3px' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}>
                Clear cart
              </button>
            )}
            <button onClick={toggleCart} aria-label="Close cart" style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'1.5rem' }}>{'\u2715'}</button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }}>
          {items.length === 0 ? (
            <p style={{ color:'rgba(245,245,245,0.4)', textAlign:'center', padding:'48px 0', fontFamily:BODY_FONT }}>Your cart is empty. Gear up for the mission.</p>
          ) : items.map((item) => (
            <div key={`${item.productId}-${item.size}-${item.colour}`} style={{ display:'flex', gap:'16px', padding:'16px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              {item.image && <img src={item.image} alt={item.name} style={{ width:'64px', height:'64px', objectFit:'cover', borderRadius:'4px' }} />}
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:HEADING_FONT, fontWeight:700, fontSize:'15px', color:HIGHLIGHT, letterSpacing:'1px', textTransform:'uppercase' as const }}>{item.name}</div>
                <div style={{ fontSize:'12px', color:'rgba(245,245,245,0.4)', marginTop:'2px' }}>{item.size}{item.colour ? ` / ${item.colour}` : ''}</div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'8px' }}>
                  <button onClick={() => updateQuantity(item.productId, item.size, item.colour, item.quantity - 1)} style={{ background:'rgba(255,255,255,0.06)', border:`1px solid ${ACCENT}`, color:TEXT, width:'28px', height:'28px', cursor:'pointer', borderRadius:'4px' }}>{'\u2212'}</button>
                  <span style={{ color:TEXT, fontSize:'14px', minWidth:'20px', textAlign:'center' as const }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.size, item.colour, item.quantity + 1)} style={{ background:'rgba(255,255,255,0.06)', border:`1px solid ${ACCENT}`, color:TEXT, width:'28px', height:'28px', cursor:'pointer', borderRadius:'4px' }}>+</button>
                  <span style={{ marginLeft:'auto', color:TEXT, fontWeight:600 }}>{'\u00A3'}{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
              <button onClick={() => removeFromCart(item.productId, item.size, item.colour)} aria-label={`Remove ${item.name}`} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.2)', cursor:'pointer', fontSize:'1rem', alignSelf:'flex-start' }}>{'\u2715'}</button>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div style={{ padding:'24px', borderTop:'1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px', fontFamily:HEADING_FONT, fontWeight:700, fontSize:'18px', letterSpacing:'1px', textTransform:'uppercase' as const, color:TEXT }}>
              <span>Total</span><span>{'\u00A3'}{total.toFixed(2)}</span>
            </div>
            <button onClick={handleCheckout} style={{ width:'100%', background:ACCENT, color:'#0a0a0a', border:'none', padding:'14px', fontFamily:HEADING_FONT, fontWeight:700, fontSize:'15px', letterSpacing:'1.5px', textTransform:'uppercase' as const, cursor:'pointer', borderRadius:'4px', transition:'all 0.25s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
