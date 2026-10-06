const ADMIN_EMAIL = 'admin@littlelarge.in';
const TOKEN_KEY = 'l2l_admin_app_token';
const API_KEY = 'l2l_admin_app_api';
const state = { token: localStorage.getItem(TOKEN_KEY), apiBase: localStorage.getItem(API_KEY) || 'http://localhost:3000' };
const $ = (selector) => document.querySelector(selector);

function apiUrl(path) { return `${state.apiBase.replace(/\/$/, '')}${path}`; }
function headers(extra = {}) { return { ...extra, Authorization: `Bearer ${state.token}` }; }
function setStatus(message, isError = true) { $('#loginStatus').textContent = message; $('#loginStatus').style.color = isError ? 'var(--coral)' : '#397755'; }
function toast(message, isError = false) { const el = $('#toast'); el.textContent = message; el.style.background = isError ? 'var(--coral)' : 'var(--ink)'; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 3200); }
function setLoading(button, loading, label) { button.disabled = loading; button.dataset.label ||= button.innerHTML; button.innerHTML = loading ? 'Publishing...' : (label || button.dataset.label); }

function showStudio() { $('#loginView').hidden = true; $('#studioView').hidden = false; $('#connectionPill').classList.remove('offline'); loadCatalog(); }
function showLogin() { $('#studioView').hidden = true; $('#loginView').hidden = false; }
function signOut() { localStorage.removeItem(TOKEN_KEY); state.token = null; showLogin(); }

async function login(event) {
  event.preventDefault();
  const email = $('#loginEmail').value.trim().toLowerCase();
  const password = $('#loginPassword').value;
  if (email !== ADMIN_EMAIL) { setStatus('This app is reserved for the store administrator.'); return; }
  const button = event.submitter;
  setLoading(button, true, 'Enter Studio');
  try {
    const response = await fetch(apiUrl('/api/auth/login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const data = await response.json();
    if (!response.ok || !data.success || data.user?.email !== ADMIN_EMAIL) throw new Error(data.message || 'Admin login failed');
    state.token = data.token; localStorage.setItem(TOKEN_KEY, state.token); setStatus(''); showStudio();
  } catch (error) { setStatus(error.message.includes('Failed to fetch') ? 'Cannot reach the website API. Check the connection setting.' : error.message); }
  finally { setLoading(button, false, 'Enter Studio'); }
}

async function publishProduct(event) {
  event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button[type="submit"]');
  const files = [...form.querySelector('[name="images"]').files, ...form.querySelector('[name="video"]').files];
  const oversized = files.find(file => file.size > 10 * 1024 * 1024);
  if (oversized) { toast(`${oversized.name} is larger than 10 MB. Compress it and try again.`, true); return; }
  setLoading(button, true);
  try { const response = await fetch(apiUrl('/api/products'), { method: 'POST', headers: headers(), body: new FormData(form) }); const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.message || 'Product could not be published'); form.reset(); form.querySelector('[name="size_variants"]').value = 'S,M,L,XL'; form.querySelector('[name="return_window_days"]').value = '7'; toast('Product is live on the website.'); loadCatalog(); } catch (error) { toast(error.message, true); } finally { setLoading(button, false); }
}

function dateValue(offsetDays) { const date = new Date(Date.now() + offsetDays * 86400000); return date.toISOString().slice(0, 10); }
async function publishBanner(event) {
  event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button[type="submit"]'); const body = new FormData(form); if (!body.get('image')?.name && !body.get('media_url')) { toast('Choose a banner image or add an image URL.', true); return; } setLoading(button, true);
  try { const response = await fetch(apiUrl('/api/promotions'), { method: 'POST', headers: headers(), body }); const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.message || 'Banner could not be published'); form.reset(); form.querySelector('[name="start_date"]').value = dateValue(0); form.querySelector('[name="end_date"]').value = dateValue(30); form.querySelector('[name="priority"]').value = '10'; form.querySelector('[name="bg_color"]').value = '#122b27'; toast('Banner is live on the storefront.'); } catch (error) { toast(error.message, true); } finally { setLoading(button, false); }
}

async function loadCatalog() { const list = $('#catalogList'); list.innerHTML = '<div class="loading-state">Loading catalog...</div>'; try { const response = await fetch(apiUrl('/api/products')); const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.message || 'Could not load catalog'); const products = data.products.slice(0, 12); list.innerHTML = products.length ? products.map(productCard).join('') : '<div class="loading-state">No products published yet.</div>'; } catch (error) { list.innerHTML = `<div class="loading-state">${error.message}</div>`; } }
function productCard(product) { let image = '/images/products/placeholder.jpg'; try { image = JSON.parse(product.image_urls || '[]')[0] || image; } catch (_) {} return `<article class="catalog-item"><img src="${escapeHtml(image)}" alt=""><div><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.category)} · ₹${Number(product.discount_price || product.price).toLocaleString('en-IN')} · ${product.stock} in stock</small></div></article>`; }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char])); }

function setup() {
  $('#loginForm').addEventListener('submit', login); $('#productForm').addEventListener('submit', publishProduct); $('#bannerForm').addEventListener('submit', publishBanner); $('#logoutButton').addEventListener('click', signOut); $('#refreshCatalog').addEventListener('click', loadCatalog); $('#settingsButton').addEventListener('click', () => { $('#apiBaseInput').value = state.apiBase; $('#settingsDialog').showModal(); });
  $('#saveSettings').addEventListener('click', (event) => { event.preventDefault(); const value = $('#apiBaseInput').value.trim().replace(/\/$/, ''); if (!value) return; state.apiBase = value; localStorage.setItem(API_KEY, value); $('#settingsDialog').close(); toast('Website API connection saved.'); });
  document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => { document.querySelectorAll('.tab').forEach(item => item.classList.toggle('active', item === tab)); document.querySelectorAll('.tab-panel').forEach(panel => { panel.hidden = panel.id !== tab.dataset.tab; panel.classList.toggle('active-panel', panel.id === tab.dataset.tab); }); if (tab.dataset.tab === 'catalogTab') loadCatalog(); }));
  $('#bannerForm [name="start_date"]').value = dateValue(0); $('#bannerForm [name="end_date"]').value = dateValue(30);
  if (state.token) showStudio();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
document.addEventListener('DOMContentLoaded', setup);
