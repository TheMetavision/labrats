import { useStore } from '@nanostores/react';
import { cartItems, cartOpen, cartTotal, cartCount, removeFromCart, updateQuantity, toggleCart } from '../lib/cart';

export default function CartDrawer() {
  const items = useStore(cartItems);
  const isOpen = useStore(cartOpen);
  const total = useStore(cartTotal);
  const count = useStore(cartCount);

  async function handleCheckout() {
    if (items.length === 0) return;
    try {
      const res = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            name: item.name,
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

  const teal = '#00c2d4';
  const yellow = '#f5c518';
  const bg = '#111111';

  return (
    <>
      <button onClick={toggleCart} aria-label={`Cart (${count} items)`}
        style={{ position:'fixed', top:'20px', right:'20px', zIndex:200, background:teal, border:'none', borderRadius:'4px', padding:'10px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', color:'#0a0a0a', fontFamily:"'Barlow Condensed', sans-serif", fontWeight:700, fontSize:'14px', letterSpacing:'1.5px', textTransform:'uppercase' as const, transition:'all 0.25s ease' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        {count > 0 && <span>{count}</span>}
      </button>

      {isOpen && <div onClick={toggleCart} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:998 }} />}

      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:'400px', maxWidth:'90vw', background:bg, zIndex:999, transform:isOpen?'translateX(0)':'translateX(100%)', transition:'transform 0.3s ease', display:'flex', flexDirection:'column', borderLeft:`2px solid ${teal}` }}>
        <div style={{ padding:'24px', borderBottom:'1px solid rgba(255,255,255,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ fontFamily:"'Barlow Condensed', sans-serif", fontWeight:700, fontSize:'20px', letterSpacing:'1px', textTransform:'uppercase' as const, color:yellow, margin:0 }}>Your Cart</h2>
          <button onClick={toggleCart} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'1.5rem' }}>{'\u2715'}</button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }}>
          {items.length === 0 ? (
            <p style={{ color:'rgba(245,245,245,0.4)', textAlign:'center', padding:'48px 0', fontFamily:"'Barlow', sans-serif" }}>Your cart is empty. Gear up for the mission.</p>
          ) : items.map((item) => (
            <div key={`${item.productId}-${item.size}-${item.colour}`} style={{ display:'flex', gap:'16px', padding:'16px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              {item.image && <img src={item.image} alt={item.name} style={{ width:'64px', height:'64px', objectFit:'cover', borderRadius:'4px' }} />}
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontWeight:700, fontSize:'15px', color:yellow, letterSpacing:'1px', textTransform:'uppercase' as const }}>{item.name}</div>
                <div style={{ fontSize:'12px', color:'rgba(245,245,245,0.4)', marginTop:'2px' }}>{item.size}{item.colour ? ` / ${item.colour}` : ''}</div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'8px' }}>
                  <button onClick={() => updateQuantity(item.productId, item.size, item.colour, item.quantity - 1)} style={{ background:'rgba(255,255,255,0.06)', border:`1px solid ${teal}`, color:'#f5f5f5', width:'28px', height:'28px', cursor:'pointer', borderRadius:'4px' }}>{'\u2212'}</button>
                  <span style={{ color:'#f5f5f5', fontSize:'14px', minWidth:'20px', textAlign:'center' as const }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.size, item.colour, item.quantity + 1)} style={{ background:'rgba(255,255,255,0.06)', border:`1px solid ${teal}`, color:'#f5f5f5', width:'28px', height:'28px', cursor:'pointer', borderRadius:'4px' }}>+</button>
                  <span style={{ marginLeft:'auto', color:'#f5f5f5', fontWeight:600 }}>{'\u00A3'}{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
              <button onClick={() => removeFromCart(item.productId, item.size, item.colour)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.2)', cursor:'pointer', fontSize:'1rem', alignSelf:'flex-start' }}>{'\u2715'}</button>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div style={{ padding:'24px', borderTop:'1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px', fontFamily:"'Barlow Condensed', sans-serif", fontWeight:700, fontSize:'18px', letterSpacing:'1px', textTransform:'uppercase' as const, color:'#f5f5f5' }}>
              <span>Total</span><span>{'\u00A3'}{total.toFixed(2)}</span>
            </div>
            <button onClick={handleCheckout} style={{ width:'100%', background:teal, color:'#0a0a0a', border:'none', padding:'14px', fontFamily:"'Barlow Condensed', sans-serif", fontWeight:700, fontSize:'15px', letterSpacing:'1.5px', textTransform:'uppercase' as const, cursor:'pointer', borderRadius:'4px', transition:'all 0.25s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#00e0f0'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = teal; e.currentTarget.style.transform = 'translateY(0)'; }}>
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
