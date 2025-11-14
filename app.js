const LS_PRODUCTS = 'eshop_products_v1';
const LS_CART = 'eshop_cart_v1';

const qs = s => document.querySelector(s);
const qsa = s => Array.from(document.querySelectorAll(s));
const money = n => '₹' + Number(n).toFixed(2);

// --- sample data ---
const SAMPLE_PRODUCTS = [
  { id: 1, title: "Wireless Headphones", desc: "Comfortable, long battery life", price: 1799.00, stock: 12, image: "https://images.unsplash.com/photo-1518441902111-0a4d0e2b3b9a?auto=format&fit=crop&w=800&q=60" },
  { id: 2, title: "Smart Watch", desc: "Fitness tracking + notifications", price: 2499.50, stock: 8, image: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=800&q=60" },
  { id: 3, title: "Classic Leather Wallet", desc: "Compact, durable design", price: 699.00, stock: 20, image: "https://images.unsplash.com/photo-1616627562334-9f2353f2a2b9?auto=format&fit=crop&w=800&q=60" },
  { id: 4, title: "Bluetooth Speaker", desc: "Loud, portable, water resistant", price: 1299.00, stock: 5, image: "https://images.unsplash.com/photo-1546443046-ed1ce6ffd1ab?auto=format&fit=crop&w=800&q=60" }
];

// --- storage helpers ---
function loadProducts(){
  const raw = localStorage.getItem(LS_PRODUCTS);
  if(!raw){ localStorage.setItem(LS_PRODUCTS, JSON.stringify(SAMPLE_PRODUCTS)); return SAMPLE_PRODUCTS.slice(); }
  try { return JSON.parse(raw); } catch(e){ localStorage.setItem(LS_PRODUCTS, JSON.stringify(SAMPLE_PRODUCTS)); return SAMPLE_PRODUCTS.slice(); }
}
function saveProducts(arr){ localStorage.setItem(LS_PRODUCTS, JSON.stringify(arr)); }
function loadCart(){ try{ return JSON.parse(localStorage.getItem(LS_CART) || '{}'); } catch(e){ return {}; } }
function saveCart(cart){ localStorage.setItem(LS_CART, JSON.stringify(cart)); updateCartUI(); }

// --- app state ---
let products = loadProducts();
let cart = loadCart();
let currentModalProductId = null;

// --- UI elements ---
const grid = qs('#productGrid');
const cartPanel = qs('#cartPanel');
const cartItemsEl = qs('#cartItems');
const cartTotalEl = qs('#cartTotal');
const cartCountEl = qs('#cartCount');

// --- render products ---
function renderProducts(list){
  grid.innerHTML = '';
  if(list.length === 0){ grid.innerHTML = '<div style="grid-column:1/-1;padding:24px;text-align:center;color:var(--muted)">No products found.</div>'; return; }
  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${p.image || 'https://via.placeholder.com/600x400?text=Product'}" alt="${escapeHtml(p.title)}" />
      <div class="title">${escapeHtml(p.title)}</div>
      <div class="desc">${escapeHtml(p.desc || '')}</div>
      <div class="price">${money(p.price)}</div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="btn btn-view" data-id="${p.id}">View</button>
        <button class="btn btn-add" data-id="${p.id}" ${p.stock<=0? 'disabled' : ''}>Add to Cart</button>
      </div>
    `;
    grid.appendChild(card);
  });
  qsa('.btn-view').forEach(b=>b.addEventListener('click', e=> openProductModal(Number(e.currentTarget.dataset.id))));
  qsa('.btn-add').forEach(b=>b.addEventListener('click', e=> addToCart(Number(e.currentTarget.dataset.id))));
}

// --- cart UI ---
function updateCartUI(){
  cart = loadCart();
  const keys = Object.keys(cart);
  cartItemsEl.innerHTML = '';
  let total = 0;
  if(keys.length === 0){
    cartItemsEl.innerHTML = `<div class="small" style="padding:12px;text-align:center">Cart is empty.</div>`;
  }
  keys.forEach(k=>{
    const pid = Number(k);
    const qty = Number(cart[k]);
    const p = products.find(x=>x.id===pid);
    if(!p) return;
    const subtotal = p.price * qty;
    total += subtotal;
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <img src="${p.image||'https://via.placeholder.com/80'}" alt="">
      <div style="flex:1">
        <div style="font-weight:600">${escapeHtml(p.title)}</div>
        <div class="small">Price: ${money(p.price)} • Stock: ${p.stock}</div>
      </div>
      <div style="text-align:right">
        <div><input type="number" min="1" max="${p.stock}" value="${qty}" data-id="${p.id}" class="qtyInput"/></div>
        <div style="margin-top:6px;font-weight:600">${money(subtotal)}</div>
        <div style="margin-top:6px"><button class="btn small secondary btn-remove" data-id="${p.id}">Remove</button></div>
      </div>
    `;
    cartItemsEl.appendChild(el);
  });
  cartTotalEl.textContent = money(total);
  cartCountEl.textContent = keys.reduce((s,k)=>s+Number(cart[k]),0);

  qsa('.qtyInput').forEach(inp => inp.addEventListener('change', e=>{
    const id = e.currentTarget.dataset.id;
    let val = Number(e.currentTarget.value);
    if(isNaN(val) || val<1) val = 1;
    const p = products.find(x=>x.id===Number(id));
    if(p && val > p.stock){ alert('Requested qty exceeds stock'); e.currentTarget.value = p.stock; val = p.stock; }
    cart[id] = val;
    saveCart(cart);
  }));
  qsa('.btn-remove').forEach(b=>b.addEventListener('click', e=>{
    const id = e.currentTarget.dataset.id;
    delete cart[id];
    saveCart(cart);
  }));
}

// --- modal / product view ---
function openProductModal(id){
  const p = products.find(x=>x.id===id);
  if(!p) return;
  currentModalProductId = id;
  const modal = qs('#modal');
  qs('#modalContent').innerHTML = `
    <div style="display:flex;gap:12px;align-items:flex-start">
      <div style="flex:1"><img src="${p.image||'https://via.placeholder.com/600x400'}" alt="${escapeHtml(p.title)}" style="width:100%;border-radius:6px"/></div>
      <div style="flex:1;padding-left:8px">
        <h3 style="margin-top:0">${escapeHtml(p.title)}</h3>
        <p class="small">${escapeHtml(p.desc)}</p>
        <div style="margin:8px 0;font-size:18px;font-weight:700">${money(p.price)}</div>
        <div class="small">Stock: ${p.stock}</div>
        <div style="margin-top:12px">
          <label>Qty</label>
          <input id="modalQty" type="number" min="1" max="${p.stock}" value="1" style="width:80px;padding:6px;border-radius:6px;border:1px solid #ddd"/>
        </div>
      </div>
    </div>
  `;
  modal.hidden = false;
}

function closeModal(){ qs('#modal').hidden = true; currentModalProductId = null; }

// --- cart actions ---
function addToCart(id, qty=1){
  const p = products.find(x=>x.id===id);
  if(!p){ alert('Product not found'); return; }
  const existing = Number(cart[id] || 0);
  const newQty = existing + Number(qty);
  if(newQty > p.stock){ alert('Cannot add — exceeds available stock'); return; }
  cart[id] = newQty;
  saveCart(cart);
  showCart();
}

function showCart(){ cartPanel.hidden = false; updateCartUI(); }
function hideCart(){ cartPanel.hidden = true; }

function showCheckout(){
  const keys = Object.keys(cart);
  if(keys.length === 0){ alert('Cart is empty'); return; }
  const summary = keys.map(k=>{
    const p = products.find(x=>x.id===Number(k));
    const qty = cart[k];
    return `<div style="display:flex;justify-content:space-between">${escapeHtml(p.title)} × ${qty} <span>${money(p.price*qty)}</span></div>`;
  }).join('');
  qs('#checkoutSummary').innerHTML = summary + `<hr><div style="display:flex;justify-content:space-between;font-weight:700"><div>Total</div><div>${cartTotalEl.textContent}</div></div>`;
  qs('#checkoutModal').hidden = false;
}
function hideCheckout(){ qs('#checkoutModal').hidden = true; }

// --- admin / seed ---
function toggleAdmin(){ const p = qs('#adminPanel'); p.hidden = !p.hidden; }
function seedSample(){
  if(!confirm('Reset products to sample data? This will overwrite your stored products.')) return;
  products = SAMPLE_PRODUCTS.slice();
  saveProducts(products);
  renderProducts(products);
  saveCart({});
}

// --- helpers ---
function escapeHtml(s = ''){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]); }

// --- init ---
document.addEventListener('DOMContentLoaded', ()=>{
  products = loadProducts();
  cart = loadCart();
  renderProducts(products);
  updateCartUI();

  qs('#search').addEventListener('input', e=>{
    const q = e.target.value.trim().toLowerCase();
    let filtered = products.filter(p => p.title.toLowerCase().includes(q) || (p.desc||'').toLowerCase().includes(q));
    const sort = qs('#sort').value;
    if(sort === 'price-asc') filtered = filtered.sort((a,b)=>a.price-b.price);
    if(sort === 'price-desc') filtered = filtered.sort((a,b)=>b.price-a.price);
    renderProducts(filtered);
  });
  qs('#sort').addEventListener('change', ()=> qs('#search').dispatchEvent(new Event('input')));

  qs('#btnCartToggle').addEventListener('click', showCart);
  qs('#btnCloseCart').addEventListener('click', hideCart);
  qs('#btnContinue').addEventListener('click', hideCart);
  qs('#btnClearCart').addEventListener('click', ()=> { if(confirm('Clear cart?')) saveCart({}); });

  qs('#modalClose').addEventListener('click', closeModal);
  qs('#modalAdd').addEventListener('click', ()=>{
    if(!currentModalProductId) return;
    const qty = Number(qs('#modalQty').value || 1);
    addToCart(currentModalProductId, qty);
    closeModal();
  });

  qs('#btnAdminToggle').addEventListener('click', toggleAdmin);
  qs('#adminForm').addEventListener('submit', ev=>{
    ev.preventDefault();
    const title = qs('#pTitle').value.trim();
    const image = qs('#pImage').value.trim();
    const desc = qs('#pDesc').value.trim();
    const price = parseFloat(qs('#pPrice').value);
    const stock = parseInt(qs('#pStock').value,10);
    if(!title || isNaN(price) || isNaN(stock)) { alert('Fill title, price, stock'); return; }
    const newId = products.length ? Math.max(...products.map(p=>p.id)) + 1 : 1;
    const newP = { id: newId, title, image: image || '', desc, price, stock };
    products.push(newP);
    saveProducts(products);
    renderProducts(products);
    qs('#adminForm').reset();
    alert('Product added');
  });
  qs('#btnSeed').addEventListener('click', seedSample);

  qs('#btnCheckout').addEventListener('click', showCheckout);
  qs('#checkoutCancel').addEventListener('click', hideCheckout);
  qs('#checkoutForm').addEventListener('submit', ev=>{
    ev.preventDefault();
    const name = qs('#cName').value.trim();
    const addr = qs('#cAddress').value.trim();
    const email = qs('#cEmail').value.trim();
    if(!name || !addr || !email){ alert('Fill shipping fields'); return; }
    Object.keys(cart).forEach(k=>{
      const p = products.find(x=>x.id===Number(k));
      if(p){ p.stock = Math.max(0, p.stock - Number(cart[k])); }
    });
    saveProducts(products);
    saveCart({});
    renderProducts(products);
    hideCheckout();
    alert('Order placed (mock). Thank you — demo only.');
  });

  document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if(e.target === m) m.hidden = true; }));
});

// expose for console
window.eshop = { products, cart, reload: ()=>{ products = loadProducts(); cart = loadCart(); renderProducts(products); updateCartUI(); } };
