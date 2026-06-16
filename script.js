/* ─── Navigation scroll state ─── */
const nav = document.getElementById('nav');
let lastScrollY = 0;
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 24);
  lastScrollY = window.scrollY;
}, { passive: true });

/* ─── Color pickers ─── */
document.querySelectorAll('.swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    const targetId = swatch.dataset.target;
    const labelId = swatch.dataset.labelTarget;
    const img = document.getElementById(targetId);
    const label = document.getElementById(labelId);

    if (img) {
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.18s ease';
      img.src = swatch.dataset.img;
      img.onload = () => { img.style.opacity = '1'; };
    }
    if (label) label.textContent = swatch.dataset.colorName;

    const siblings = swatch.closest('.product-swatches').querySelectorAll('.swatch');
    siblings.forEach(s => {
      s.classList.remove('swatch--active');
      s.setAttribute('aria-pressed', 'false');
    });
    swatch.classList.add('swatch--active');
    swatch.setAttribute('aria-pressed', 'true');
  });
});

/* ─── Pack size selectors ─── */
document.querySelectorAll('.pack-selector').forEach(selector => {
  selector.querySelectorAll('.pack-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selector.querySelectorAll('.pack-btn').forEach(b => b.classList.remove('pack-btn--active'));
      btn.classList.add('pack-btn--active');

      const card = btn.closest('.product-card');
      const addBtn = card.querySelector('.add-to-cart');
      if (addBtn) {
        addBtn.dataset.price = btn.dataset.price;
        const packName = btn.dataset.packName;
        const productName = addBtn.dataset.name;
        addBtn.dataset.name = productName.replace(/ — .*/, '') + (packName ? ` — ${packName}` : '');
      }
    });
  });
});

/* ─── Cart state ─── */
const cartState = { items: [] };

const cartDrawer = document.getElementById('cart-drawer');
const cartOverlay = document.getElementById('cart-overlay');
const cartBody = document.getElementById('cart-body');
const cartBadge = document.getElementById('cart-badge');
const cartTotalEl = document.getElementById('cart-total');

function openCart() {
  cartDrawer.classList.add('open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  cartOverlay.classList.add('active');
  cartOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  document.getElementById('cart-close').focus();
}

function closeCart() {
  cartDrawer.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  cartOverlay.classList.remove('active');
  cartOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function renderCart() {
  const totalQty = cartState.items.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cartState.items.reduce((s, i) => s + i.price * i.qty, 0);

  cartBadge.textContent = totalQty;
  cartBadge.classList.toggle('visible', totalQty > 0);
  cartTotalEl.textContent = `$${totalPrice.toFixed(2)}`;

  if (cartState.items.length === 0) {
    cartBody.innerHTML = '<p class="cart-empty">Your bag is empty.</p>';
    return;
  }

  cartBody.innerHTML = cartState.items.map((item, idx) => `
    <div class="cart-item">
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}${item.qty > 1 ? ` <span style="opacity:.55">×${item.qty}</span>` : ''}</p>
        <p class="cart-item-meta">£${(item.price * item.qty).toFixed(2)}</p>
      </div>
      <button class="cart-item-remove" data-idx="${idx}" aria-label="Remove ${item.name}">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  `).join('');

  cartBody.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx, 10);
      const item = cartState.items[idx];
      if (item.qty > 1) {
        item.qty -= 1;
      } else {
        cartState.items.splice(idx, 1);
      }
      renderCart();
    });
  });
}

document.getElementById('cart-trigger').addEventListener('click', openCart);
document.getElementById('cart-close').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && cartDrawer.classList.contains('open')) closeCart();
});

document.querySelectorAll('.add-to-cart').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.name;
    const price = parseFloat(btn.dataset.price);
    const existing = cartState.items.find(i => i.name === name && i.price === price);
    if (existing) {
      existing.qty += 1;
    } else {
      cartState.items.push({ name, price, qty: 1 });
    }
    renderCart();
    openCart();

    if (typeof fbq === 'function') {
      fbq('track', 'AddToCart', {
        content_name: name,
        content_ids: [name.replace(/\s+/g, '_').toLowerCase()],
        content_type: 'product',
        value: price,
        currency: 'USD'
      });
    }
    if (typeof gtag_report_conversion === 'function') {
      gtag_report_conversion();
    }
  });
});

/* ─── Smooth scroll for anchor links ─── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      closeCart();
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, cartDrawer.classList.contains('open') ? 320 : 0);
    }
  });
});
