/* ==========================================================================
   LITTLE TO LARGE - COMMON APP JS (STATE & UI TEMPLATES)
   ========================================================================== */

const API_URL = ''; // Relative path for unified host
const SOCIAL_LINKS = {
  facebook: 'https://www.facebook.com/profile.php?id=61592053585440&mibextid=ZbWKwL',
  instagram: '#',
  youtube: 'https://youtube.com/@littletolargee?si=4FiBUAoQKHB8d5Zy',
  twitter: '#'
};

window.escapeHTML = function(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};
function escapeHTML(str) { return window.escapeHTML(str); }

// Global Fetch Interceptor to handle JWT token expiration and redirect to login page
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  try {
    const response = await originalFetch(...args);
    if (response.status === 401 || response.status === 403) {
      const clone = response.clone();
      try {
        const data = await clone.json();
        if (data.message && (data.message.includes('Expired Token') || data.message.includes('Invalid') || data.message.includes('Access Denied') || data.message.includes('Token'))) {
          console.warn('Session expired or invalid token. Logging out...');
          localStorage.removeItem('l2l_token');
          localStorage.removeItem('l2l_user');
          document.cookie = "l2l_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
          
          const pathname = window.location.pathname;
          if (!pathname.includes('login') && pathname !== '/' && !pathname.includes('index')) {
            showToast('Session expired. Please log in again.', 'error');
            setTimeout(() => {
              window.location.href = '/login';
            }, 1500);
          }
        }
      } catch (e) {
        // Response was not JSON, ignore
      }
    }
    return response;
  } catch (err) {
    throw err;
  }
};

// Global System Settings for shipping fee and threshold
window.systemSettings = {
  shipping_fee: 60,
  free_shipping_threshold: 999
};

// Global helper to convert color names to valid CSS colors/gradients
function getColorCssCode(cName) {
  if (!cName) return '#64748b';
  const lower = cName.trim().toLowerCase();
  
  if (lower === 'multicolor' || lower === 'multi' || lower === 'all') {
    return 'linear-gradient(135deg, #ef4444 0%, #3b82f6 33%, #22c55e 66%, #eab308 100%)';
  }
  
  const colorMap = {
    'lime': '#32cd32',
    'lime green': '#32cd32',
    'green': '#16a34a',
    'dark green': '#14532d',
    'olive': '#65a30d',
    'red': '#dc2626',
    'dark red': '#991b1b',
    'maroon': '#800000',
    'navy': '#1e3a8a',
    'navy blue': '#1e3a8a',
    'blue': '#2563eb',
    'sky blue': '#0ea5e9',
    'royal blue': '#1d4ed8',
    'pink': '#ec4899',
    'light pink': '#f472b6',
    'fuchsia': '#d946ef',
    'magenta': '#d946ef',
    'purple': '#a855f7',
    'violet': '#7c3aed',
    'indigo': '#4f46e5',
    'black': '#18181b',
    'charcoal': '#334155',
    'white': '#ffffff',
    'gold': '#eab308',
    'yellow': '#eab308',
    'saffron': '#f97316',
    'orange': '#f97316',
    'mustard': '#d97706',
    'beige': '#f5f5dc',
    'cream': '#fffdd0',
    'peach': '#ffdab9',
    'teal': '#0d9488',
    'cyan': '#06b6d4',
    'brown': '#78350f',
    'tan': '#d2b48c',
    'grey': '#6b7280',
    'gray': '#6b7280',
    'silver': '#9ca3af',
    'lavender': '#e9d5ff',
    'mint': '#6ee7b7',
    'coral': '#fb7185'
  };
  
  return colorMap[lower] || lower;
}

// Global handler for selecting color on a product card
function selectCardColor(event, el, colorName) {
  if (event) event.stopPropagation();
  const card = el.closest('.product-card');
  if (card) {
    card.querySelectorAll('.color-dot').forEach(dot => {
      dot.style.border = '1px solid #ccc';
      dot.classList.remove('active');
    });
    el.style.border = '2px solid var(--primary, #1e1b4b)';
    el.classList.add('active');
    card.dataset.selectedColor = colorName;
  }
}

// Global handler for adding to cart from product card with selected color
function handleAddCartClick(event, btn, product) {
  if (event) event.stopPropagation();
  const card = btn.closest('.product-card');
  const selectedColor = (card && card.dataset.selectedColor) 
    ? card.dataset.selectedColor 
    : (product.selectedColor || (product.color_variants ? product.color_variants.split(',')[0].trim() : (product.color ? product.color.split(',')[0].trim() : 'Default')));
  addToCart(product, 'M', 1, selectedColor);
}

// Initialize synchronously from localStorage cache to prevent race conditions during first render
try {
  const cachedSettings = localStorage.getItem('l2l_settings');
  if (cachedSettings) {
    const parsed = JSON.parse(cachedSettings);
    window.systemSettings.shipping_fee = parseFloat(parsed.shipping_fee || '60');
    window.systemSettings.free_shipping_threshold = parseFloat(parsed.free_shipping_threshold || '999');
  }
} catch (e) {
  console.error('Failed to load settings from localStorage cache:', e);
}

async function loadSystemSettings() {
  try {
    const res = await fetch(`${API_URL}/api/settings`);
    const data = await res.json();
    if (data.success && data.settings) {
      const fee = parseFloat(data.settings.shipping_fee || '60');
      const threshold = parseFloat(data.settings.free_shipping_threshold || '999');
      
      const changed = (window.systemSettings.shipping_fee !== fee || window.systemSettings.free_shipping_threshold !== threshold);
      
      window.systemSettings.shipping_fee = fee;
      window.systemSettings.free_shipping_threshold = threshold;
      localStorage.setItem('l2l_settings', JSON.stringify({ shipping_fee: fee, free_shipping_threshold: threshold }));

      // Hot reload prices on pages if values changed
      if (changed) {
        if (typeof renderCheckoutSummary === 'function') {
          renderCheckoutSummary();
        }
        if (typeof renderPriceSummary === 'function') {
          renderPriceSummary();
        }
      }
    }
  } catch (err) {
    console.error('Failed to load system settings:', err);
  }
}

// Helper function to format relative local image paths and remote Cloudinary URLs
function formatLocalPath(pathStr) {
  if (!pathStr) return '/images/products/placeholder.jpg';
  if (pathStr.includes('res.cloudinary.com') && /\/placeholder(?:\.[a-z0-9]+)?(?:\?.*)?$/i.test(pathStr)) {
    return '/images/products/placeholder.jpg';
  }
  const isVideo = pathStr.includes('/video/upload/') || pathStr.endsWith('.mp4') || pathStr.endsWith('.webm') || pathStr.endsWith('.mov') || pathStr.endsWith('.avi') || pathStr.endsWith('.mkv');
  if (!isVideo && pathStr.includes('res.cloudinary.com') && pathStr.includes('/upload/') && !pathStr.includes('f_auto')) {
    pathStr = pathStr.replace('/upload/', '/upload/f_auto,q_auto,w_800/');
  }
  if (pathStr.startsWith('http://') || pathStr.startsWith('https://') || pathStr.startsWith('data:') || pathStr.startsWith('blob:')) {
    return pathStr;
  }
  if (!pathStr.startsWith('/')) {
    return '/' + pathStr;
  }
  return pathStr;
}

// Fetch settings immediately on import
loadSystemSettings();

// Toast Notification Helper
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.left = '20px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.style.padding = '0.8rem 1.5rem';
  toast.style.borderRadius = '8px';
  toast.style.color = '#fff';
  toast.style.fontWeight = '600';
  toast.style.fontSize = '0.9rem';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  toast.style.animation = 'fadeInUp 0.3s ease';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '0.5rem';

  if (type === 'success') {
    toast.style.backgroundColor = 'hsl(162, 72%, 41%)'; // Emerald Green
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
  } else if (type === 'error') {
    toast.style.backgroundColor = 'hsl(354, 78%, 57%)'; // Crimson Red
    toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
  } else {
    toast.style.backgroundColor = 'hsl(243, 75%, 19%)'; // Royal Indigo
    toast.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
  }

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Safe JSON Parser helper that never throws on 'undefined' or malformed strings
function safeJsonParse(val, fallback = []) {
  if (val === null || val === undefined || val === '' || val === 'undefined' || val === 'null') {
    return fallback;
  }
  if (typeof val !== 'string') {
    return val;
  }
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
}
window.safeJsonParse = safeJsonParse;

// Session Helpers
function getToken() {
  const token = localStorage.getItem('l2l_token');
  return (!token || token === 'undefined' || token === 'null') ? null : token;
}

function saveToken(token, user) {
  if (token && token !== 'undefined') {
    localStorage.setItem('l2l_token', token);
    document.cookie = `l2l_token=${token}; path=/; max-age=86400; SameSite=Lax`;
  }
  if (user && typeof user === 'object') {
    localStorage.setItem('l2l_user', JSON.stringify(user));
  } else if (token && token !== 'undefined') {
    // Attempt to decode user payload directly from JWT token
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        localStorage.setItem('l2l_user', JSON.stringify({
          id: payload.id,
          name: payload.name || payload.email.split('@')[0],
          email: payload.email,
          role: payload.role || (payload.email === 'admin@littlelarge.in' ? 'admin' : 'customer'),
          isStaff: payload.role === 'staff'
        }));
      }
    } catch (e) {}
  }
}

function logout() {
  localStorage.removeItem('l2l_token');
  localStorage.removeItem('l2l_user');
  document.cookie = "l2l_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
  showToast('Logged out successfully', 'info');
  setTimeout(() => {
    window.location.href = '/';
  }, 1000);
}

function getCurrentUser() {
  const userStr = localStorage.getItem('l2l_user');
  if (!userStr || userStr === 'undefined' || userStr === 'null') return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    localStorage.removeItem('l2l_user');
    return null;
  }
}

// Cart Management Helpers
function getCart() {
  const cartStr = localStorage.getItem('l2l_cart');
  if (!cartStr || cartStr === 'undefined' || cartStr === 'null') return [];
  try {
    return JSON.parse(cartStr);
  } catch (e) {
    localStorage.removeItem('l2l_cart');
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem('l2l_cart', JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product, size = 'M', qty = 1, color = 'Default', variantData = null) {
  if (!getToken()) {
    showToast('Please login or register to add outfits to your family box!', 'error');
    setTimeout(() => {
      window.location.href = '/login';
    }, 1200);
    return;
  }
  if (product.stock !== undefined && parseInt(product.stock) <= 0) {
    showToast(`Sorry, ${product.name} is currently Out of Stock!`, 'error');
    return;
  }
  const cart = getCart();

  const variantColor = variantData ? (variantData.color_name || color) : color;
  const variantSku = variantData ? (variantData.sku || null) : null;
  const variantPrice = variantData && variantData.price ? (variantData.discount_price || variantData.price) : (product.discount_price || product.price);
  
  let variantImage = '/images/products/placeholder.jpg';
  if (variantData && Array.isArray(variantData.image_urls) && variantData.image_urls.length > 0) {
    variantImage = variantData.image_urls[0];
  } else if (variantData && variantData.image) {
    variantImage = variantData.image;
  } else {
    try {
      const parsed = typeof product.image_urls === 'string' ? JSON.parse(product.image_urls || '[]') : (product.image_urls || []);
      if (parsed[0]) variantImage = parsed[0];
    } catch (e) {}
  }

  const index = cart.findIndex(item => item.product_id === product.id && item.size === size && (item.color || 'Default') === variantColor && (variantSku ? item.variant_sku === variantSku : true));

  if (index > -1) {
    cart[index].quantity += qty;
  } else {
    cart.push({
      product_id: product.id,
      name: product.name,
      price: variantPrice,
      image: variantImage,
      size: size,
      color: variantColor,
      color_code: variantData ? variantData.color_code : null,
      variant_sku: variantSku,
      quantity: qty,
      stock: variantData && variantData.stock !== undefined ? variantData.stock : product.stock
    });
  }

  saveCart(cart);
  showToast(`${product.name} (${size} | ${variantColor}) added to cart!`);
}

function removeFromCart(productId, size, color = 'Default', variantSku = null) {
  let cart = getCart();
  cart = cart.filter(item => !(item.product_id === productId && item.size === size && (item.color || 'Default') === color && (variantSku ? item.variant_sku === variantSku : true)));
  saveCart(cart);
  showToast('Item removed from cart', 'info');
}

function updateCartQty(productId, size, color, qty) {
  const cart = getCart();
  const index = cart.findIndex(item => item.product_id === productId && item.size === size && (item.color || 'Default') === color);
  if (index > -1) {
    cart[index].quantity = parseInt(qty);
    if (cart[index].quantity <= 0) {
      cart.splice(index, 1);
    }
    saveCart(cart);
  }
}

function clearCart() {
  localStorage.removeItem('l2l_cart');
  updateCartBadge();
}

function updateCartBadge() {
  const cart = getCart();
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const badges = document.querySelectorAll('.cart-badge');
  badges.forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
    
    // Trigger CSS bounce animation
    badge.classList.remove('badge-bounce');
    void badge.offsetWidth; // Force reflow
    badge.classList.add('badge-bounce');
  });
}

// Wishlist Helpers
async function toggleWishlistItem(productId) {
  const token = getToken();
  if (!token) {
    // Local fallback for guest
    let wishlist = getLocalWishlist();
    const index = wishlist.indexOf(productId);
    if (index > -1) {
      wishlist.splice(index, 1);
      saveLocalWishlist(wishlist);
      showToast('Removed from wishlist', 'info');
      return false;
    } else {
      wishlist.push(productId);
      saveLocalWishlist(wishlist);
      showToast('Added to wishlist!');
      return true;
    }
  }

  try {
    const res = await fetch(`${API_URL}/api/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ product_id: productId })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message);
      return data.added;
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to sync wishlist', 'error');
  }
}

function getLocalWishlist() {
  const listStr = localStorage.getItem('l2l_wishlist');
  return listStr ? JSON.parse(listStr) : [];
}

function saveLocalWishlist(list) {
  localStorage.setItem('l2l_wishlist', JSON.stringify(list));
}

// Layout Render Engine
function renderHeaderFooter() {
  const user = getCurrentUser();
  const isAdmin = user && user.email === 'admin@littlelarge.in';

  // Inject theme-color meta tag dynamically for seamless mobile status bar matching
  if (!document.querySelector('meta[name="theme-color"]')) {
    const themeMeta = document.createElement('meta');
    themeMeta.name = 'theme-color';
    themeMeta.content = '#1e1b4b';
    document.head.appendChild(themeMeta);
  }

  // Inject font awesome link in head dynamically if missing
  if (!document.querySelector('link[href*="cdnjs.cloudflare.com/ajax/libs/font-awesome"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(link);
  }

  // Find header & footer tags
  const headerTag = document.querySelector('header');
  const footerTag = document.querySelector('footer');

  if (headerTag) {
    const avatarImg = user && user.avatar_url ? user.avatar_url : 'https://cdn-icons-png.flaticon.com/512/147/147144.png';
    headerTag.innerHTML = `
      <div class="top-bar">
        <span class="topbar-desktop">🚚 Free Shipping across India on orders above ₹999 | <span class="topbar-highlight">Festive Sale: Up to 40% OFF</span></span>
        <span class="topbar-mobile">🚚 Free Shipping > ₹999 &nbsp;•&nbsp; <span>40% OFF FESTIVE SALE</span></span>
      </div>
      <div class="container navbar" style="max-width: 1400px; width: 100%; box-sizing: border-box;">
        <button class="hamburger-btn" onclick="toggleNavDrawer()"><i class="fas fa-bars"></i></button>
        
        <a href="/" class="logo" style="display: inline-flex; align-items: center; gap: 8px;">
          <img src="images/favicon.png" alt="Little to Large Logo" style="height: 32px; width: 32px; border-radius: 4px; object-fit: cover;">
          <span>Little <span class="logo-accent">to</span> Large</span>
        </a>
        
        <nav class="nav-links" style="display:flex; align-items:center; gap:16px; font-size:0.92rem; font-weight:600;">
          <a href="/products?category=Women">Women</a>
          <a href="/products?category=Men">Men</a>
          <a href="/products?category=Kids">Kids</a>
          <a href="/products?subcategory=Family Sets">Family Sets</a>
          <a href="/products?style=Ethnic">Festive Wear</a>
          <a href="/lookbook">Lookbook</a>
          <a href="javascript:void(0)" onclick="openSizeAdvisorModal()" class="nav-highlight"><i class="fas fa-ruler-combined"></i> Size Guide</a>
        </nav>
        
        <div class="nav-actions">
          <button class="mobile-search-toggle" onclick="toggleMobileSearch()"><i class="fas fa-search"></i></button>
          
          <div class="search-container-relative" style="max-width: 280px; width: 100%;">
            <form class="search-bar" action="/products" method="GET" style="display:flex; align-items:center;">
              <input type="text" id="desktopSearchInput" name="search" placeholder="Search ethnic, silk, kurtas..." autocomplete="off" required style="border-right: none;" oninput="handleSearchAutocomplete(this.value, 'desktopSearchSuggestions')">
              <button type="button" onclick="document.getElementById('visualSearchInput').click()" title="Visual Search" style="background: #fff; color: var(--primary); padding-right: 5px;"><i class="fas fa-camera"></i></button>
              <button type="submit"><i class="fas fa-search"></i></button>
            </form>
            <div class="search-suggestions-dropdown" id="desktopSearchSuggestions"></div>
          </div>
          <input type="file" id="visualSearchInput" accept="image/*" style="display:none;" onchange="handleVisualSearch(this)">
          
          <a href="/account" class="action-icon" title="My Account" style="display:flex; align-items:center">
            ${user ? `<img src="${avatarImg}" class="header-avatar" alt="Avatar">` : `<i class="far fa-user"></i>`}
          </a>
          
          <a href="/account?tab=wishlist" class="action-icon desktop-only-icon" title="Wishlist">
            <i class="far fa-heart"></i>
          </a>

          <a href="/cart" class="action-icon" title="Cart">
            <i class="fas fa-shopping-bag"></i>
            <span class="badge cart-badge">0</span>
          </a>

          ${isAdmin ? `<a href="/admin" class="btn btn-primary desktop-only-btn" style="padding: 0.4rem 1rem; font-size: 0.8rem;">Admin</a>` : ''}
          ${user ? `<button onclick="logout()" class="btn btn-accent desktop-only-btn" style="padding: 0.4rem 1rem; font-size: 0.8rem;">Logout</button>` : `<a href="/login" class="btn btn-primary desktop-only-btn" style="padding: 0.4rem 1rem; font-size: 0.8rem;">Login</a>`}
        </div>
      </div>
      
      <!-- Mobile Search Container -->
      <div class="mobile-search-container" id="mobileSearchContainer">
        <div class="search-container-relative" style="width: 100%;">
          <form style="display:flex; width:100%; gap:5px" action="/products" method="GET">
            <input type="text" id="mobileSearchInput" name="search" placeholder="Search ethnic, kurtas, sarees..." style="flex:1; padding:0.5rem 1rem; border:1px solid var(--border-color); border-radius:50px 0 0 50px; border-right: none;" autocomplete="off" required oninput="handleSearchAutocomplete(this.value, 'mobileSearchSuggestions')">
            <button type="button" onclick="document.getElementById('visualSearchInput').click()" style="background:#fff; border:1px solid var(--border-color); border-left:none; border-right:none; color:var(--primary); padding:0 10px;"><i class="fas fa-camera"></i></button>
            <button type="submit" class="btn btn-primary" style="padding:0.5rem 1.2rem; border-radius:0 50px 50px 0"><i class="fas fa-search"></i></button>
          </form>
          <div class="search-suggestions-dropdown" id="mobileSearchSuggestions"></div>
        </div>
      </div>
    `;
  }

  // --- Visual Search Logic ---
  window.handleVisualSearch = async function(input) {
    if (!input.files || input.files.length === 0) return;
    
    // Show a loading overlay
    const overlay = document.createElement('div');
    overlay.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.9);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center"><i class="fas fa-spinner fa-spin" style="font-size:3rem;color:var(--primary);margin-bottom:1rem"></i><h2 style="color:var(--primary)">AI is analyzing your style...</h2></div>';
    document.body.appendChild(overlay);

    const formData = new FormData();
    formData.append('image', input.files[0]);

    try {
      const res = await fetch('/api/visual-search', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.success && data.products && data.products.length > 0) {
        // Redirect to products page with custom visualSearch query parameter and ids
        const ids = data.products.map(p => p.id).join(',');
        window.location.href = `/products?visualSearch=true&ids=${ids}`;
      } else {
        alert('Could not find matching clothes for this image. Try another photo!');
        document.body.removeChild(overlay);
      }
    } catch (err) {
      alert('Visual search failed.');
      document.body.removeChild(overlay);
    }
  };

  // Inject mobile drawer to body if missing so it has global viewport stacking context
  if (!document.getElementById('navDrawer')) {
    const overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';
    overlay.id = 'drawerOverlay';
    overlay.onclick = toggleNavDrawer;
    document.body.appendChild(overlay);

    const drawer = document.createElement('div');
    drawer.className = 'nav-drawer';
    drawer.id = 'navDrawer';
    
    const avatarImg = user && user.avatar_url ? user.avatar_url : 'https://cdn-icons-png.flaticon.com/512/147/147144.png';
    drawer.innerHTML = `
        <!-- Header Profile Block -->
        <div class="drawer-header">
          <button class="drawer-close-btn" onclick="toggleNavDrawer()"><i class="fas fa-times"></i></button>
          ${user ? `
            <div class="drawer-user-info">
              <img src="${avatarImg}" alt="User Avatar" onerror="this.src='https://cdn-icons-png.flaticon.com/512/147/147144.png'">
              <div>
                <div class="drawer-user-name">${user.name}</div>
                <div class="drawer-user-email">${user.email}</div>
              </div>
            </div>
          ` : `
            <div class="drawer-user-info">
              <div class="guest-icon"><i class="far fa-user"></i></div>
              <div>
                <div class="drawer-user-name">Welcome Guest</div>
                <div class="drawer-user-email">Shop premium clothes</div>
              </div>
            </div>
            <a href="/login" class="drawer-login-btn" onclick="toggleNavDrawer()">Login / Sign Up</a>
          `}
        </div>

        <div class="drawer-body">
          <!-- Section 1: Quick Actions -->
          <div class="drawer-links-group">
            <a href="/" class="drawer-link" onclick="toggleNavDrawer()"><i class="fas fa-home"></i> Home</a>
            <a href="/products" class="drawer-link" onclick="toggleNavDrawer()"><i class="fas fa-shopping-bag"></i> Shop All Collections</a>
            <a href="/lookbook" class="drawer-link" onclick="toggleNavDrawer()"><i class="fas fa-book-open"></i> Interactive Lookbook</a>
            <a href="/account" class="drawer-link" onclick="toggleNavDrawer()"><i class="fas fa-user-circle"></i> My Profile Settings</a>
            ${user ? `<a href="/orders" class="drawer-link" onclick="toggleNavDrawer()"><i class="fas fa-box"></i> My Orders History</a>` : ''}
            <a href="/account?tab=wishlist" class="drawer-link" onclick="toggleNavDrawer()"><i class="fas fa-heart"></i> My Wishlist</a>
            <a href="/cart" class="drawer-link" onclick="toggleNavDrawer()"><i class="fas fa-shopping-cart"></i> My Shopping Bag</a>
          </div>

          <!-- Section 2: Shop by Category -->
          <div class="drawer-section-title">Shop Categories</div>
          <div class="drawer-links-group">
            <a href="/products?category=Women" class="drawer-link" onclick="toggleNavDrawer()"><i class="fas fa-female"></i> Women's Wear</a>
            <a href="/products?category=Men" class="drawer-link" onclick="toggleNavDrawer()"><i class="fas fa-male"></i> Men's Wear</a>
            <a href="/products?category=Kids" class="drawer-link" onclick="toggleNavDrawer()"><i class="fas fa-child"></i> Kids & Toddlers</a>
            <a href="/products?subcategory=Family Sets" class="drawer-link" onclick="toggleNavDrawer()"><i class="fas fa-users"></i> Family Matching Sets</a>
            <a href="/products?style=Ethnic" class="drawer-link" onclick="toggleNavDrawer()"><i class="fas fa-sparkles"></i> Festive & Ethnic</a>
            <a href="/products?style=Wedding" class="drawer-link" onclick="toggleNavDrawer()"><i class="fas fa-gem"></i> Wedding Collections</a>
            <a href="javascript:void(0)" class="drawer-link" onclick="toggleNavDrawer(); openSizeAdvisorModal();"><i class="fas fa-ruler-combined"></i> Size & Fit Advisor</a>
          </div>

          <!-- Section 3: More Info -->
          <div class="drawer-section-title">More Info</div>
          <div class="drawer-links-group">
            <a href="/offers" class="drawer-link" onclick="toggleNavDrawer()"><i class="fas fa-tags"></i> Promo Offers & Deals</a>
            <a href="/about" class="drawer-link" onclick="toggleNavDrawer()"><i class="fas fa-info-circle"></i> Our Brand Story</a>
            <a href="/contact" class="drawer-link" onclick="toggleNavDrawer()"><i class="fas fa-headset"></i> Contact Us</a>
            <a href="/careers" class="drawer-link" onclick="toggleNavDrawer()"><i class="fas fa-briefcase"></i> Careers & Internships</a>
          </div>

          <!-- Section 4: Admin & Logout -->
          ${isAdmin ? `
            <a href="/admin" class="drawer-link" onclick="toggleNavDrawer()" style="background:#e0f2fe; color:#0369a1; font-weight:700;"><i class="fas fa-user-shield"></i> Admin Control Panel</a>
          ` : ''}
          ${user ? `
            <a href="#" class="drawer-link logout-link" onclick="toggleNavDrawer(); logout();"><i class="fas fa-sign-out-alt"></i> Logout</a>
          ` : ''}
        </div>
    `;
    document.body.appendChild(drawer);
  }

  if (footerTag) {
    footerTag.innerHTML = `
      <div class="container footer-grid">
        <div class="footer-col">
          <div class="footer-logo" style="display: inline-flex; align-items: center; gap: 8px;">
            <img src="images/favicon.png" alt="Little to Large Logo" style="height: 32px; width: 32px; border-radius: 4px; object-fit: cover;">
            <span>Little <span class="logo-accent">to</span> Large</span>
          </div>
          <p>India's premium family clothing store. We bring comfortable, beautiful ethnic and western outfits from infants to adults. Designed to grow and scale with Indian family values.</p>
          <p style="font-size:0.8rem; margin-top:0.6rem; color:rgba(255,255,255,0.7); font-weight:600">GSTIN: 24DDFPG6913P1Z8</p>
          <div class="social-links">
            <a href="${SOCIAL_LINKS.facebook}" target="_blank" rel="noopener noreferrer" class="social-icon" aria-label="Visit our Facebook page"><i class="fab fa-facebook-f"></i></a>
            <a href="${SOCIAL_LINKS.instagram}" class="social-icon"><i class="fab fa-instagram"></i></a>
            <a href="${SOCIAL_LINKS.youtube}" class="social-icon"><i class="fab fa-youtube"></i></a>
            <a href="${SOCIAL_LINKS.twitter}" class="social-icon"><i class="fab fa-twitter"></i></a>
          </div>
        </div>
        <div class="footer-col">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="/products">Collections</a></li>
            <li><a href="/about">Our Brand Story</a></li>
            <li><a href="/contact">Contact Us</a></li>
            <li><a href="/careers">Careers & Internships</a></li>
            <li><a href="/policies?tab=replacement">Replacement Policy</a></li>
            <li><a href="/policies?tab=terms">Terms & Conditions</a></li>
            <li><a href="/policies?tab=shipping">Shipping Policy</a></li>
            <li><a href="/policies?tab=privacy">Privacy Policy</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h3>Family Wardrobe</h3>
          <ul>
            <li><a href="/products?category=Men">Men's Apparel</a></li>
            <li><a href="/products?category=Women">Women's Sarees & Dresses</a></li>
            <li><a href="/products?category=Kids">Kids' Ethnic & Toddler Sets</a></li>
            <li><a href="/products?category=Accessories">Premium Accessories</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h3>Customer Trust & Grievance</h3>
          <p>
            📞 Support: <strong>+91 7383874045</strong><br>
            ✉️ Email: <a href="mailto:indiancloths980@gmail.com" style="color:var(--accent); text-decoration:underline; font-weight:700;">indiancloths980@gmail.com</a>
          </p>
          <a href="mailto:indiancloths980@gmail.com" style="display:inline-flex; align-items:center; gap:6px; margin:6px 0 10px 0; padding:6px 14px; background:var(--accent); color:#ffffff; border-radius:4px; font-size:0.8rem; font-weight:700; text-decoration:none;"><i class="fas fa-envelope"></i> Email Support Directly</a>
          <p style="font-size:0.75rem; margin-top:0.4rem; color:rgba(255,255,255,0.7); line-height:1.4">
            <strong>Grievance Officer:</strong> Reenaben<br>
            Email: <a href="mailto:indiancloths980@gmail.com" style="color:rgba(255,255,255,0.9); text-decoration:underline;">indiancloths980@gmail.com</a><br>
            <strong>Registered Office:</strong> HQ Little to Large, Sector 4, Gandhidham, Gujarat - 370201
          </p>
          <p style="margin-top: 0.8rem; font-size: 0.8rem; color: rgba(255,255,255,0.5)">🔒 Safe Payments: UPI, Credit Card, Cash on Delivery</p>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="container">
          <p>&copy; 2026 Little to Large E-Commerce. Made with ❤️ in India. All Rights Reserved.</p>
        </div>
      </div>
      <!-- Cookie Consent Banner -->
      <div id="cookieConsentBanner" class="cookie-banner" style="display: none;">
        <div class="cookie-content">
          <p>🍪 We use cookies to optimize your family shopping experience, manage your active bag, and secure payments. By continuing, you agree to our privacy policy.</p>
          <div class="cookie-buttons">
            <button onclick="acceptCookies(true)" class="btn-cookie accept">Accept All</button>
            <button onclick="acceptCookies(false)" class="btn-cookie reject">Essential Only</button>
          </div>
        </div>
      </div>
    `;
  }

  updateCartBadge();
}

// Navigate directly to product detail on card video click (avoids media switching conflicts)
function toggleCardVideo(event, productId, wrapper) {
  if (event && event.stopPropagation) {
    event.stopPropagation();
  }
  window.location.href = `/product-detail?id=${productId}`;
}

// Unmute/play an inline video inside a wrapper without navigating
function toggleInlineVideo(event, wrapper) {
  const video = wrapper ? wrapper.querySelector('video') : null;
  if (!video) return;
  event.stopPropagation();

  // Pause and mute all other videos first
  document.querySelectorAll('video').forEach(v => {
    if (v !== video) {
      try { v.pause(); v.muted = true; v.style.opacity = '0'; } catch(e){}
    }
  });

  if (video.paused) {
    try {
      video.muted = false;
      video.volume = 1;
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
      video.style.opacity = '1';
    } catch (e) {}
  } else {
    try { video.pause(); video.muted = true; video.style.opacity = '0'; } catch(e){}
  }
}

// Global Cookie Consent actions
window.acceptCookies = function(allowAll) {
  localStorage.setItem("cookie_preference", allowAll ? "accepted" : "essential_only");
  const banner = document.getElementById("cookieConsentBanner");
  if (banner) banner.style.display = "none";
};

window.checkCookiePreference = function() {
  if (!localStorage.getItem("cookie_preference")) {
    const banner = document.getElementById("cookieConsentBanner");
    if (banner) banner.style.display = "block";
  }
};

// Injected Header/Footer execution on DOM load
document.addEventListener('DOMContentLoaded', () => {
  renderHeaderFooter();
  setupChatbotUI();
  checkCookiePreference();
});

// Chatbot UI dynamic loader (External Integration)
function setupChatbotUI() {
  if (window.location.pathname.includes('admin')) return;

  const script = document.createElement('script');
  script.src = 'https://www.noupe.com/embed/019ef86078af765e89d9a700fd6f73d533b6.js';
  script.async = true;
  document.head.appendChild(script);
}

function toggleNavDrawer() {
  const drawer = document.getElementById('navDrawer');
  const overlay = document.getElementById('drawerOverlay');
  if (drawer && overlay) {
    const isActive = drawer.classList.toggle('active');
    overlay.classList.toggle('active');
    
    if (isActive) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }
  }
}

function toggleMobileSearch() {
  const searchContainer = document.getElementById('mobileSearchContainer');
  if (searchContainer) {
    searchContainer.classList.toggle('active');
  }
}

// Hover-to-Play Video Handler for Product Cards (Fail-safe: Never turns black)
function handleCardVideoHover(wrapper, isHover) {
  if (!wrapper) return;
  const videoEl = wrapper.querySelector('.card-hover-video');
  if (!videoEl || !videoEl.src || videoEl.src.includes('null') || videoEl.src.includes('undefined')) return;

  if (isHover) {
    const playPromise = videoEl.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        videoEl.style.display = 'block';
      }).catch(err => {
        videoEl.style.display = 'none';
      });
    }
  } else {
    videoEl.pause();
    videoEl.style.display = 'none';
  }
}

// Clean URL preservation for Google SEO indexing and direct user navigation
// Note: URLs remain intact (e.g. /products, /product-detail?id=123) for proper canonical indexing.

/* ==========================================================================
   AI LIVE SEARCH SUGGESTIONS & SIZE ADVISOR MODAL ENGINE
   ========================================================================== */

let autocompleteDebounceTimer = null;
window.handleSearchAutocomplete = function(val, dropdownId) {
  clearTimeout(autocompleteDebounceTimer);
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) return;

  const query = (val || '').trim();
  if (query.length < 2) {
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
    return;
  }

  autocompleteDebounceTimer = setTimeout(async () => {
    try {
      const res = await fetch(`/api/ml/suggestions?prefix=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        dropdown.innerHTML = data.suggestions.map(s => `
          <div class="search-suggestion-item" onclick="selectSuggestion('${s.replace(/'/g, "\\'")}')">
            <i class="fas fa-search"></i>
            <span>${s}</span>
          </div>
        `).join('');
        dropdown.style.display = 'block';
      } else {
        dropdown.style.display = 'none';
      }
    } catch (e) {
      dropdown.style.display = 'none';
    }
  }, 200);
};

window.selectSuggestion = function(text) {
  const desktopInput = document.getElementById('desktopSearchInput');
  const mobileInput = document.getElementById('mobileSearchInput');
  if (desktopInput) desktopInput.value = text;
  if (mobileInput) mobileInput.value = text;
  window.location.href = `/products?search=${encodeURIComponent(text)}`;
};

document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-container-relative')) {
    const d1 = document.getElementById('desktopSearchSuggestions');
    const d2 = document.getElementById('mobileSearchSuggestions');
    if (d1) d1.style.display = 'none';
    if (d2) d2.style.display = 'none';
  }
});

// Size & Fit Advisor Modal Functions
window.openSizeAdvisorModal = function(defaultCat = 'Women') {
  ensureSizeAdvisorModalDOM();
  const overlay = document.getElementById('sizeAdvisorModalOverlay');
  if (overlay) {
    overlay.classList.add('active');
    selectSizeAdvisorTab(defaultCat);
  }
};

window.closeSizeAdvisorModal = function() {
  const overlay = document.getElementById('sizeAdvisorModalOverlay');
  if (overlay) overlay.classList.remove('active');
};

let activeAdvisorCategory = 'Women';
let activeAdvisorFit = 'regular';

window.selectSizeAdvisorTab = function(cat) {
  activeAdvisorCategory = cat;
  document.querySelectorAll('.size-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });

  const chestGroup = document.getElementById('advisorChestGroup');
  const waistGroup = document.getElementById('advisorWaistGroup');
  const kidsGroup = document.getElementById('advisorKidsGroup');
  const chestLabel = document.getElementById('advisorChestLabel');

  if (cat === 'Kids') {
    if (chestGroup) chestGroup.style.display = 'none';
    if (waistGroup) waistGroup.style.display = 'none';
    if (kidsGroup) kidsGroup.style.display = 'grid';
  } else {
    if (chestGroup) chestGroup.style.display = 'block';
    if (waistGroup) waistGroup.style.display = 'block';
    if (kidsGroup) kidsGroup.style.display = 'none';
    if (chestLabel) chestLabel.textContent = cat === 'Women' ? 'Bust Measurement (Inches):' : 'Chest Measurement (Inches):';
  }

  const resCard = document.getElementById('sizeResultCard');
  if (resCard) resCard.style.display = 'none';
};

window.selectFitChip = function(el, fit) {
  activeAdvisorFit = fit;
  document.querySelectorAll('.fit-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
};

window.calculateSizeAdvice = async function() {
  const chestVal = document.getElementById('advisorChestInput')?.value;
  const waistVal = document.getElementById('advisorWaistInput')?.value;
  const ageVal = document.getElementById('advisorAgeInput')?.value;
  const heightVal = document.getElementById('advisorHeightInput')?.value;

  const payload = {
    category: activeAdvisorCategory,
    fit: activeAdvisorFit,
    chest: chestVal ? parseFloat(chestVal) : null,
    waist: waistVal ? parseFloat(waistVal) : null,
    age_years: ageVal ? parseFloat(ageVal) : null,
    height_cm: heightVal ? parseFloat(heightVal) : null
  };

  try {
    const res = await fetch('/api/ml/size-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    const resCard = document.getElementById('sizeResultCard');
    if (resCard && data.success) {
      resCard.style.display = 'block';
      resCard.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem">
          <div>
            <span style="font-size:0.8rem; text-transform:uppercase; font-weight:700; color:var(--text-light)">Recommended Size</span>
            <div style="font-size:1.8rem; font-weight:800; color:var(--primary)">Size ${data.recommended_size}</div>
          </div>
          <div style="background:var(--success-light); color:var(--success); padding:0.4rem 0.9rem; border-radius:50px; font-weight:700; font-size:0.85rem">
            <i class="fas fa-check-circle"></i> ${data.confidence}% Fit Match
          </div>
        </div>
        <p style="font-size:0.9rem; color:var(--text-dark); margin-bottom:0.8rem">${data.reason}</p>
        <div style="display:flex; gap:10px">
          <button onclick="applyAdvisorSize('${data.recommended_size}')" class="btn btn-primary" style="padding:0.5rem 1.2rem; font-size:0.85rem">Select Size ${data.recommended_size}</button>
          <button onclick="closeSizeAdvisorModal()" class="btn" style="padding:0.5rem 1rem; font-size:0.85rem; background:#eee">Done</button>
        </div>
      `;
    }
  } catch (err) {
    showToast('Failed to calculate size advice', 'error');
  }
};

window.applyAdvisorSize = function(size) {
  const chips = document.querySelectorAll('.size-chip, .size-filter-chip');
  chips.forEach(c => {
    if (c.textContent.trim() === size) {
      c.click();
    }
  });
  closeSizeAdvisorModal();
  showToast(`Selected size ${size} based on your measurements!`);
};

function ensureSizeAdvisorModalDOM() {
  if (document.getElementById('sizeAdvisorModalOverlay')) return;
  const overlay = document.createElement('div');
  overlay.className = 'size-modal-overlay';
  overlay.id = 'sizeAdvisorModalOverlay';
  overlay.innerHTML = `
    <div class="size-modal-card">
      <div class="size-modal-header">
        <h3><i class="fas fa-ruler-combined" style="color:var(--marigold)"></i> Indian Garment Size & Fit Advisor</h3>
        <button onclick="closeSizeAdvisorModal()" style="background:none; border:none; font-size:1.3rem; color:var(--text-light); cursor:pointer"><i class="fas fa-times"></i></button>
      </div>
      <div class="size-modal-body">
        <p style="font-size:0.88rem; color:var(--text-light); margin-bottom:1.2rem">
          Get verified size recommendations tailored to Indian ethnic garment tailoring and festive comfort allowance.
        </p>

        <div class="size-tabs">
          <button class="size-tab-btn active" data-cat="Women" onclick="selectSizeAdvisorTab('Women')">Women's Wear</button>
          <button class="size-tab-btn" data-cat="Men" onclick="selectSizeAdvisorTab('Men')">Men's Wear</button>
          <button class="size-tab-btn" data-cat="Kids" onclick="selectSizeAdvisorTab('Kids')">Kids & Toddler</button>
        </div>

        <div id="advisorInputsContainer" style="display:grid; gap:1rem;">
          <div id="advisorChestGroup">
            <label id="advisorChestLabel" style="font-size:0.85rem; font-weight:700; display:block; margin-bottom:4px">Bust Measurement (Inches):</label>
            <input type="number" id="advisorChestInput" placeholder="e.g. 36" style="width:100%; padding:0.6rem 0.9rem; border:1px solid var(--border-color); border-radius:8px">
          </div>
          <div id="advisorWaistGroup">
            <label style="font-size:0.85rem; font-weight:700; display:block; margin-bottom:4px">Waist Measurement (Inches, optional):</label>
            <input type="number" id="advisorWaistInput" placeholder="e.g. 30" style="width:100%; padding:0.6rem 0.9rem; border:1px solid var(--border-color); border-radius:8px">
          </div>
          <div id="advisorKidsGroup" style="display:none; grid-template-columns: 1fr 1fr; gap:10px;">
            <div>
              <label style="font-size:0.85rem; font-weight:700; display:block; margin-bottom:4px">Child Age (Years):</label>
              <input type="number" step="0.5" id="advisorAgeInput" placeholder="e.g. 3.5" style="width:100%; padding:0.6rem 0.9rem; border:1px solid var(--border-color); border-radius:8px">
            </div>
            <div>
              <label style="font-size:0.85rem; font-weight:700; display:block; margin-bottom:4px">Height (cm, optional):</label>
              <input type="number" id="advisorHeightInput" placeholder="e.g. 98" style="width:100%; padding:0.6rem 0.9rem; border:1px solid var(--border-color); border-radius:8px">
            </div>
          </div>

          <div>
            <label style="font-size:0.85rem; font-weight:700; display:block; margin-bottom:4px">Fit Preference:</label>
            <div class="fit-options">
              <span class="fit-chip" onclick="selectFitChip(this, 'slim')">Slim (+1" ease)</span>
              <span class="fit-chip active" onclick="selectFitChip(this, 'regular')">Festive Regular (+2.5" ease)</span>
              <span class="fit-chip" onclick="selectFitChip(this, 'relaxed')">Relaxed (+4" ease)</span>
            </div>
          </div>

          <button onclick="calculateSizeAdvice()" class="btn btn-primary" style="margin-top:0.5rem; padding:0.75rem; font-weight:700; width:100%">
            <i class="fas fa-magic"></i> Calculate My Perfect Size
          </button>
        </div>

        <div id="sizeResultCard" class="size-result-card"></div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSizeAdvisorModal();
  });
}
