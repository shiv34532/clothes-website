/* ==========================================================================
   LITTLE TO LARGE - ADMIN DASHBOARD LOGIC
   ========================================================================= */

let token = getToken();

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

const FASHION_COLOR_PALETTE = [
  { name: 'Crimson Red', hex: '#990000', label: '🔴 Crimson Red' },
  { name: 'Royal Saffron', hex: '#ff9933', label: '🟠 Royal Saffron' },
  { name: 'Mustard Haldi', hex: '#e5a00d', label: '🟡 Mustard / Haldi' },
  { name: 'Emerald Green', hex: '#008055', label: '🟢 Emerald Green' },
  { name: 'Peacock Teal', hex: '#005f73', label: '🦚 Peacock Teal' },
  { name: 'Royal Navy', hex: '#00205b', label: '🔷 Royal Navy' },
  { name: 'Rani Pink', hex: '#c2185b', label: '🌸 Rani Pink' },
  { name: 'Wine Plum', hex: '#4a0e4e', label: '🍇 Wine / Plum' },
  { name: 'Ivory Gold', hex: '#e8d8b0', label: '⚪ Ivory Gold' },
  { name: 'Jet Black', hex: '#111111', label: '⚫ Jet Black' },
  { name: 'Chanderi Gold', hex: '#d4af37', label: '🟤 Chanderi Gold' },
  { name: 'Pastel Mint', hex: '#98d8c8', label: '🌿 Pastel Mint' },
  { name: 'Peach Coral', hex: '#e07a5f', label: '🍑 Peach Coral' },
  { name: 'Royal Purple', hex: '#5c2a9d', label: '💜 Royal Purple' },
  { name: 'Rust Maroon', hex: '#7a1f1d', label: '🪔 Rust Maroon' },
  { name: 'Sky Cyan', hex: '#38bdf8', label: '💎 Sky Blue' }
];

function initAdminColorChips() {
  const container = document.getElementById('mainProdColorChips');
  if (!container) return;
  container.innerHTML = FASHION_COLOR_PALETTE.map(c => `
    <button type="button" onclick="selectMainProductColor('${c.name}', '${c.hex}')" title="${c.name} (${c.hex})" style="display:inline-flex; align-items:center; gap:6px; background:#fff; border:1px solid #cbd5e1; border-radius:18px; padding:3px 10px; font-size:0.75rem; font-weight:600; cursor:pointer; transition:all 0.15s ease;">
      <span style="width:14px; height:14px; border-radius:50%; background:${c.hex}; border:1px solid rgba(0,0,0,0.15); display:inline-block;"></span>
      ${c.name}
    </button>
  `).join('');
}

function selectMainProductColor(name, hex) {
  const nameInput = document.getElementById('prodColorName');
  const pickerInput = document.getElementById('prodColorPicker');
  const hexInput = document.getElementById('prodColorHex');
  if (nameInput) nameInput.value = name;
  if (pickerInput) pickerInput.value = hex;
  if (hexInput) hexInput.value = hex;
  showToast(`Selected primary color: ${name}`, 'info');
}
window.selectMainProductColor = selectMainProductColor;

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
window.escapeHTML = escapeHTML;

function toggleAdminSidebar(e) {
  if (e) e.stopPropagation();
  const sidebar = document.getElementById('adminSidebar');
  const overlay = document.getElementById('adminSidebarOverlay');
  if (sidebar && overlay) {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  }
}

// Verify Admin / Staff on page entry
document.addEventListener('DOMContentLoaded', () => {
  token = getToken();
  const user = getCurrentUser();
  const emailLower = (user && user.email ? user.email : '').toLowerCase().trim();
  const isAuthorized = user && (
    emailLower === 'indiancloths980@ltl.com' ||
    emailLower === 'admin@littlelarge.in' ||
    emailLower.includes('indiancloths980') ||
    emailLower.includes('admin') ||
    emailLower.includes('jethinaitik') ||
    user.role === 'admin' ||
    user.role === 'staff' ||
    user.isStaff
  );

  if (!isAuthorized) {
    showToast('Unauthorized access. Please log in with admin or staff credentials.', 'error');
    setTimeout(() => window.location.href = '/login', 1000);
    return;
  }

  initAdminColorChips();

  // Auto-close sidebar on mobile menu clicks
  const sidebarLinks = document.querySelectorAll('.admin-sidebar-menu a');
  sidebarLinks.forEach(link => {
    link.addEventListener('click', () => {
      const sidebar = document.getElementById('adminSidebar');
      const overlay = document.getElementById('adminSidebarOverlay');
      if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
      }
    });
  });

  // Load active tab
  loadDashboardAnalytics();
  setupSidebarNavigation();
});

function setupSidebarNavigation() {
  const links = document.querySelectorAll('.admin-sidebar-menu a');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetSection = link.getAttribute('data-section');
      if (targetSection) {
        e.preventDefault();
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        showSection(targetSection);
      }
    });
  });
}

function showSection(sectionId) {
  const sections = [
    'analyticsSection', 'ordersSection', 'productsSection', 'inquiriesSection',
    'promotionsSection', 'heroBannersSection', 'errorSection', 'lookbookSection', 'settingsSection',
    'intelligenceSection', 'aiProductStudioSection', 'careersSection',
    'aiAssistantsSection', 'mediaStudioSection', 'policiesSection', 'securitySection'
  ];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = id === sectionId ? 'block' : 'none';
  });

  if (sectionId === 'analyticsSection') loadDashboardAnalytics();
  else if (sectionId === 'ordersSection') loadAdminOrders();
  else if (sectionId === 'productsSection') loadAdminProducts();
  else if (sectionId === 'inquiriesSection') loadAdminInquiries();
  else if (sectionId === 'promotionsSection') {
    loadHomepageSettings();
    loadAdminPromotions();
    loadAdminCoupons();
    prefillPromoDates();
  }
  else if (sectionId === 'heroBannersSection') loadAdminHeroBanners();
  else if (sectionId === 'errorSection') loadAdminErrors();
  else if (sectionId === 'lookbookSection') loadAdminLookbook();
  else if (sectionId === 'settingsSection') loadAdminShippingSettings();
  else if (sectionId === 'careersSection') {
    loadAdminCareers();
    loadCareerApplications();
  }
  else if (sectionId === 'mediaStudioSection') {
    populateStudioMediaDropdowns();
  }
  else if (sectionId === 'policiesSection') {
    loadPolicyForEdit('replacement');
  }
  else if (sectionId === 'securitySection') {
    load2FaStatus();
    loadAdminStaff();
  }
}

/* ==========================================================================
   1. ANALYTICS & DASHBOARD METRICS
   ========================================================================== */
async function loadDashboardAnalytics() {
  try {
    const res = await fetch('/api/admin/analytics', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('metricSales').textContent = `₹${parseFloat(data.metrics.totalSales).toLocaleString('en-IN')}`;
      document.getElementById('metricOrders').textContent = data.metrics.totalOrders;
      document.getElementById('metricPending').textContent = data.metrics.pendingOrders;
      document.getElementById('metricCustomers').textContent = data.metrics.totalCustomers;

      renderLowStockAlerts(data.metrics.lowStock);
      renderSalesChart(data.monthlySales);
      renderInventoryCharts(data.categoryBreakdown); // Render GA charts!
      loadAudienceSegments(); // Load marketing segments
    }
  } catch (err) {
    showToast('Failed to load dashboard analytics', 'error');
  }
}

function renderLowStockAlerts(items) {
  const list = document.getElementById('lowStockList');
  if (!list) return;
  list.innerHTML = '';
  
  if (items.length === 0) {
    list.innerHTML = '<li style="color:var(--success); font-weight:600">✅ All products have healthy stock levels.</li>';
    return;
  }

  items.forEach(it => {
    list.innerHTML += `
      <li style="color:var(--danger); display:flex; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid #eee">
        <span>⚠️ ${it.name}</span>
        <strong>Only ${it.stock} left!</strong>
      </li>
    `;
  });
}

// Draw a beautiful custom CSS bar chart inside dashboard
function renderSalesChart(data) {
  const chartWrapper = document.getElementById('salesChartWrapper');
  if (!chartWrapper) return;
  chartWrapper.innerHTML = '';

  const maxVal = Math.max(...data.map(d => d.sales)) || 1; // Prevent division by zero (NaN)
  
  data.forEach(d => {
    const pctHeight = (d.sales / maxVal) * 85; // cap height at 85%
    chartWrapper.innerHTML += `
      <div style="flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end">
        <span style="font-size:0.75rem; font-weight:700; color:var(--primary); margin-bottom:5px">₹${Math.round(d.sales/1000)}k</span>
        <div style="width:35px; height:${pctHeight}%; background:linear-gradient(180deg, var(--marigold) 0%, var(--primary) 100%); border-radius:6px; transition:height 1s ease"></div>
        <span style="font-size:0.8rem; font-weight:600; color:var(--text-light); margin-top:8px">${d.month}</span>
      </div>
    `;
  });
}

let pieChartInstance = null;
let valuationChartInstance = null;

function renderInventoryCharts(categoryData) {
  if (!categoryData || categoryData.length === 0) return;

  const categories = categoryData.map(d => d.category);
  const itemCounts = categoryData.map(d => d.count);
  const stockLevels = categoryData.map(d => d.total_stock || 0);
  const stockValuations = categoryData.map(d => d.total_value || 0);

  // 1. Render Pie Chart (Inventory Category Share)
  const pieCtx = document.getElementById('inventoryPieChart');
  if (pieCtx) {
    if (pieChartInstance) pieChartInstance.destroy();
    pieChartInstance = new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: categories,
        datasets: [{
          data: itemCounts,
          backgroundColor: [
            'hsl(243, 75%, 25%)', // Indigo
            'hsl(38, 92%, 50%)',  // Marigold
            'hsl(162, 72%, 41%)', // Emerald
            'hsl(354, 78%, 57%)'  // Crimson
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              font: { weight: 'bold', size: 10 }
            }
          }
        }
      }
    });
  }

  // 2. Render Bar Chart (Stock Levels vs Valuations)
  const valCtx = document.getElementById('inventoryValuationChart');
  if (valCtx) {
    if (valuationChartInstance) valuationChartInstance.destroy();
    valuationChartInstance = new Chart(valCtx, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [
          {
            label: 'Total Stock (Units)',
            data: stockLevels,
            backgroundColor: 'rgba(30, 27, 75, 0.7)',
            borderColor: 'hsl(243, 75%, 19%)',
            borderWidth: 1,
            yAxisID: 'y'
          },
          {
            label: 'Stock Value (₹)',
            data: stockValuations,
            backgroundColor: 'rgba(217, 119, 6, 0.7)',
            borderColor: 'hsl(38, 92%, 50%)',
            borderWidth: 1,
            type: 'line',
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: 'Stock (Units)', font: { weight: 'bold' } }
          },
          y1: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'Valuation (₹)', font: { weight: 'bold' } }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { weight: 'bold', size: 10 } }
          }
        }
      }
    });
  }
}

let allAdminOrders = [];

async function exportOrdersToExcel() {
  try {
    const res = await fetch('/api/admin/orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!data.success || data.orders.length === 0) {
      showToast('No orders found to export', 'error');
      return;
    }

    // Format the orders data for Excel
    const formattedRows = data.orders.map(o => {
      const dateStr = new Date(o.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      const itemsList = (o.items && o.items.length > 0)
        ? o.items.map(it => `${it.product_name || 'Product #' + it.product_id} (Size: ${it.size || 'N/A'}${it.color && it.color !== 'Default' ? ', Color: ' + it.color : ''}, Qty: ${it.quantity}, Unit Price: ₹${parseFloat(it.price).toFixed(2)}, Subtotal: ₹${(parseFloat(it.price) * parseInt(it.quantity)).toFixed(2)})`).join('; ')
        : 'No item details recorded';

      return {
        'Order ID': `#${o.id}`,
        'Customer Name': o.customer_name || 'Guest',
        'Customer Email': o.customer_email || 'N/A',
        'Customer Phone': o.customer_phone || 'N/A',
        'Products Ordered': itemsList,
        'Order Date': dateStr,
        'Total Amount (₹)': parseFloat(o.total_amount),
        'Payment Method': o.payment_method,
        'Payment Status': o.payment_status,
        'Fulfillment Status': o.status,
        'Shipping Address': o.shipping_address
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedRows);
    const workbook = XLSX.utils.book_new();
    const targetSheetName = "Orders Report";
    XLSX.utils.book_append_sheet(workbook, worksheet, targetSheetName);

    // Adjust column widths automatically
    worksheet["!cols"] = [
      { wch: 10 }, // Order ID
      { wch: 20 }, // Customer Name
      { wch: 25 }, // Customer Email
      { wch: 15 }, // Customer Phone
      { wch: 45 }, // Products Ordered
      { wch: 15 }, // Order Date
      { wch: 18 }, // Total Amount
      { wch: 16 }, // Payment Method
      { wch: 16 }, // Payment Status
      { wch: 18 }, // Fulfillment Status
      { wch: 45 }  // Shipping Address
    ];

    // Download file
    XLSX.writeFile(workbook, `L2L_Orders_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Orders report exported to Excel successfully!', 'success');
  } catch (err) {
    showToast('Failed to export orders to Excel', 'error');
  }
}

/* ==========================================================================
   2. ORDER MANAGEMENT
   ========================================================================== */
async function loadAdminOrders() {
  try {
    const res = await fetch('/api/admin/orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      allAdminOrders = data.orders || [];
      const tbody = document.querySelector('#adminOrdersTable tbody');
      tbody.innerHTML = '';

      if (allAdminOrders.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align:center; padding:2rem; color:var(--text-light)">
              No customer orders recorded in the system yet.
            </td>
          </tr>
        `;
        return;
      }

      allAdminOrders.forEach(o => {
        const date = new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        
        let shiprocketColHtml = '';
        if (o.status === 'Shipped' || o.status === 'Delivered') {
          shiprocketColHtml = `
            <span style="font-size:0.8rem; color:var(--success); font-weight:bold"><i class="fas fa-truck"></i> Shipped</span><br>
            <span style="font-size:0.75rem">AWB: <a href="${o.tracking_link || '#'}" target="_blank" style="color:var(--secondary); text-decoration:underline; font-weight:bold">${o.tracking_number || 'Track'}</a></span>
          `;
        } else if (o.status === 'Cancelled') {
          shiprocketColHtml = `<span style="font-size:0.8rem; color:var(--danger)">N/A (Cancelled)</span>`;
        } else {
          shiprocketColHtml = `
            <button onclick="shipOrderViaShiprocket(${o.id})" class="btn" style="padding:0.3rem 0.6rem; font-size:0.75rem; background:var(--secondary); color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer; display:inline-flex; align-items:center; gap:4px">
              <i class="fas fa-rocket"></i> Ship order
            </button>
            <button onclick="shipOrderManually(${o.id})" class="btn" style="padding:0.3rem 0.6rem; font-size:0.75rem; background:#4b5563; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer; display:inline-flex; align-items:center; gap:4px; margin-top:4px">
              <i class="fas fa-edit"></i> Manual AWB
            </button>
            <button onclick="adminCancelOrder(${o.id})" class="btn" style="padding:0.3rem 0.6rem; font-size:0.75rem; background:var(--danger); color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer; display:inline-flex; align-items:center; gap:4px; margin-top:4px">
              <i class="fas fa-ban"></i> Cancel
            </button>
          `;
        }

        // Format ordered products list
        let itemsHtml = '';
        if (o.items && o.items.length > 0) {
          const itemsListHtml = o.items.map(item => {
            let imgUrl = '/images/products/placeholder.jpg';
            try {
              if (item.image_urls) {
                const parsed = typeof item.image_urls === 'string' ? JSON.parse(item.image_urls) : item.image_urls;
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
                  imgUrl = parsed[0];
                }
              }
            } catch (e) {
              imgUrl = '/images/products/placeholder.jpg';
            }
            if (!imgUrl.startsWith('http') && !imgUrl.startsWith('/')) {
              imgUrl = '/' + imgUrl;
            }

            const itemQty = parseInt(item.quantity) || 1;
            const itemPrice = parseFloat(item.price) || 0;
            const itemSubtotal = itemQty * itemPrice;
            const sizeBadge = item.size ? `<span style="background:#f1f5f9; padding:2px 6px; border-radius:3px; font-weight:600; font-size:0.72rem; color:#475569;">Size: ${item.size}</span>` : '';
            const colorBadge = (item.color && item.color !== 'Default') ? `<span style="background:#f8fafc; padding:2px 6px; border-radius:3px; font-size:0.72rem; color:#64748b; margin-left:3px;">${item.color}</span>` : '';

            return `
              <div style="display:flex; gap:10px; align-items:center; padding:6px 0; border-bottom:1px solid #f1f5f9;">
                <img src="${imgUrl}" alt="${item.product_name || 'Product'}" onerror="this.src='/images/favicon.png'" style="width:42px; height:48px; object-fit:cover; border-radius:4px; border:1px solid #e2e8f0; flex-shrink:0;">
                <div style="flex:1; min-width:0; line-height:1.35;">
                  <div style="font-weight:700; font-size:0.83rem; color:var(--text-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${item.product_name || ('Product #' + item.product_id)}">
                    ${item.product_name || ('Product #' + item.product_id)}
                  </div>
                  <div style="margin-top:2px;">
                    ${sizeBadge}${colorBadge}
                    <span style="font-size:0.74rem; font-weight:700; color:var(--primary); margin-left:4px;">Qty: ${itemQty}</span> × ₹${itemPrice.toFixed(2)}
                  </div>
                  <div style="font-size:0.75rem; color:#0f172a; font-weight:600; margin-top:1px;">
                    Subtotal: ₹${itemSubtotal.toFixed(2)}
                  </div>
                </div>
              </div>
            `;
          }).join('');

          itemsHtml = `
            <div style="max-width:320px; min-width:240px;">
              ${itemsListHtml}
              <div style="display:flex; gap:8px; align-items:center; margin-top:6px;">
                <button onclick="openAdminOrderModal(${o.id})" class="btn" style="padding:3px 8px; font-size:0.74rem; background:#f8fafc; color:var(--primary); border:1px solid var(--border-color); border-radius:4px; cursor:pointer; font-weight:700; display:inline-flex; align-items:center; gap:5px;">
                  <i class="fas fa-eye"></i> View Full Details
                </button>
                <a href="/api/orders/${o.id}/invoice" target="_blank" style="color:var(--secondary); text-decoration:underline; font-weight:bold; font-size:0.75rem;">
                  <i class="fas fa-file-invoice"></i> Invoice
                </a>
              </div>
            </div>
          `;
        } else {
          itemsHtml = `
            <div style="padding:8px; background:#f8fafc; border-radius:4px; border:1px dashed #cbd5e1; font-size:0.76rem; color:#64748b; font-style:italic;">
              <i class="fas fa-info-circle"></i> No product details recorded
            </div>
          `;
        }

        tbody.innerHTML += `
          <tr>
            <td><strong>#${o.id}</strong></td>
            <td>
              <strong>${o.customer_name || 'Guest'}</strong><br>
              <span style="font-size:0.78rem; color:var(--text-light)">${o.customer_email || 'No email'}</span>
              ${o.customer_phone ? `<br><span style="font-size:0.75rem; color:var(--text-light)"><i class="fas fa-phone"></i> ${o.customer_phone}</span>` : ''}
              ${o.return_reason ? `
                <div style="margin-top:6px; padding:4px 8px; background:#fff7ed; border-left:3px solid #ea580c; border-radius:3px; font-size:0.75rem; text-align:left; line-height:1.2">
                  <strong style="color:#ea580c">Return Request:</strong><br>
                  <strong>Reason:</strong> ${o.return_reason}<br>
                  <strong>Comments:</strong> ${o.return_comments || 'None'}
                </div>
              ` : ''}
            </td>
            <td>${itemsHtml}</td>
            <td>${date}</td>
            <td><strong>₹${parseFloat(o.total_amount).toFixed(2)}</strong></td>
            <td>
              ${o.payment_method} 
              (${ (o.payment_status === 'Success' || o.payment_status === 'Completed') ? 
                '<span style="color:#16a34a; font-weight:700">Completed</span>' : 
                '<span style="color:#dc2626; font-weight:700">Pending (Unpaid)</span>' })
            </td>
            <td>
              <select onchange="updateOrderStatus(${o.id}, this.value)" class="form-select" style="padding:0.3rem 0.5rem; border-radius:4px; border:1px solid var(--border-color); font-weight:700; color:var(--primary)">
                <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
                <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                <option value="Return Requested" ${o.status === 'Return Requested' ? 'selected' : ''}>Return Requested</option>
                <option value="Return Approved" ${o.status === 'Return Approved' ? 'selected' : ''}>Return Approved</option>
                <option value="Return Rejected" ${o.status === 'Return Rejected' ? 'selected' : ''}>Return Rejected</option>
              </select>
            </td>
            <td>${shiprocketColHtml}</td>
          </tr>
        `;
      });
    }
  } catch (err) {
    showToast('Failed to load orders', 'error');
  }
}

function openAdminOrderModal(orderId) {
  const order = allAdminOrders.find(o => o.id === orderId);
  if (!order) {
    showToast('Order details not found', 'error');
    return;
  }

  const modal = document.getElementById('adminOrderModal');
  const modalTitle = document.getElementById('adminOrderModalTitle');
  const modalBody = document.getElementById('adminOrderModalBody');

  const orderDate = new Date(order.created_at).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  modalTitle.innerHTML = `Order #${order.id} Breakdown <span style="font-size:0.85rem; font-weight:normal; color:var(--text-light); margin-left:8px;">(${orderDate})</span>`;

  let itemsRowsHtml = '';
  if (order.items && order.items.length > 0) {
    itemsRowsHtml = order.items.map(item => {
      let imgUrl = '/images/products/placeholder.jpg';
      try {
        if (item.image_urls) {
          const parsed = typeof item.image_urls === 'string' ? JSON.parse(item.image_urls) : item.image_urls;
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
            imgUrl = parsed[0];
          }
        }
      } catch (e) {
        imgUrl = '/images/products/placeholder.jpg';
      }
      if (!imgUrl.startsWith('http') && !imgUrl.startsWith('/')) {
        imgUrl = '/' + imgUrl;
      }

      const itemQty = parseInt(item.quantity) || 1;
      const itemPrice = parseFloat(item.price) || 0;
      const itemSubtotal = itemQty * itemPrice;

      return `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 8px; text-align:center; width:60px;">
            <img src="${imgUrl}" alt="${item.product_name || 'Product'}" onerror="this.src='/images/favicon.png'" style="width:48px; height:54px; object-fit:cover; border-radius:6px; border:1px solid #cbd5e1;">
          </td>
          <td style="padding:10px 8px;">
            <strong style="color:var(--text-dark); font-size:0.92rem;">${item.product_name || ('Product #' + item.product_id)}</strong>
            ${item.product_category ? `<br><span style="font-size:0.75rem; color:var(--text-light);">${item.product_category}${item.product_subcategory ? ' &rsaquo; ' + item.product_subcategory : ''}</span>` : ''}
          </td>
          <td style="padding:10px 8px; text-align:center;">
            <span style="background:#f1f5f9; padding:3px 8px; border-radius:4px; font-weight:700; font-size:0.8rem; color:#334155;">${item.size || 'N/A'}</span>
            ${(item.color && item.color !== 'Default') ? `<div style="font-size:0.75rem; color:#64748b; margin-top:3px;">${item.color}</div>` : ''}
          </td>
          <td style="padding:10px 8px; text-align:right; font-weight:600; font-size:0.88rem;">
            ₹${itemPrice.toFixed(2)}
          </td>
          <td style="padding:10px 8px; text-align:center; font-weight:700; font-size:0.9rem; color:var(--primary);">
            ${itemQty}
          </td>
          <td style="padding:10px 8px; text-align:right; font-weight:800; font-size:0.92rem; color:var(--text-dark);">
            ₹${itemSubtotal.toFixed(2)}
          </td>
        </tr>
      `;
    }).join('');
  } else {
    itemsRowsHtml = `
      <tr>
        <td colspan="6" style="padding:2rem; text-align:center; color:#64748b; font-style:italic;">
          <i class="fas fa-info-circle"></i> No historical product item details recorded for this order.
        </td>
      </tr>
    `;
  }

  modalBody.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-bottom:1.5rem; background:#f8fafc; padding:1rem; border-radius:8px; border:1px solid var(--border-color); font-size:0.85rem;">
      <div>
        <span style="color:var(--text-light); display:block; font-size:0.78rem;">Customer:</span>
        <strong style="color:var(--text-dark);">${order.customer_name || 'Guest'}</strong>
        <div style="font-size:0.78rem; color:var(--text-light); margin-top:2px;">${order.customer_email || 'No email'}${order.customer_phone ? ' • ' + order.customer_phone : ''}</div>
      </div>
      <div>
        <span style="color:var(--text-light); display:block; font-size:0.78rem;">Payment:</span>
        <strong>${order.payment_method}</strong>
        <span style="font-size:0.78rem; font-weight:700; color:${(order.payment_status === 'Success' || order.payment_status === 'Completed') ? '#16a34a' : '#dc2626'}; margin-left:4px;">(${order.payment_status || 'Pending'})</span>
      </div>
      <div>
        <span style="color:var(--text-light); display:block; font-size:0.78rem;">Order Status:</span>
        <strong style="color:var(--primary);">${order.status}</strong>
      </div>
      <div style="grid-column: 1 / -1;">
        <span style="color:var(--text-light); display:block; font-size:0.78rem;">Shipping Destination:</span>
        <div style="font-weight:600; color:var(--text-dark); line-height:1.4;">${order.shipping_address || 'None provided'}</div>
      </div>
    </div>

    <div style="overflow-x:auto;">
      <table style="width:100%; border-collapse:collapse; margin-bottom:1.5rem;">
        <thead>
          <tr style="background:#f1f5f9; text-align:left; font-size:0.78rem; text-transform:uppercase; letter-spacing:0.5px; color:#475569;">
            <th style="padding:8px; text-align:center;">Product</th>
            <th style="padding:8px;">Details</th>
            <th style="padding:8px; text-align:center;">Size</th>
            <th style="padding:8px; text-align:right;">Unit Price</th>
            <th style="padding:8px; text-align:center;">Qty</th>
            <th style="padding:8px; text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRowsHtml}
        </tbody>
        <tfoot>
          <tr style="background:#f8fafc; border-top:2px solid var(--border-color);">
            <td colspan="5" style="padding:12px 8px; text-align:right; font-weight:800; font-size:1rem; color:var(--primary);">
              Grand Total:
            </td>
            <td style="padding:12px 8px; text-align:right; font-weight:800; font-size:1.15rem; color:var(--primary);">
              ₹${parseFloat(order.total_amount).toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div style="text-align:right; padding-top:10px; border-top:1px solid var(--border-color);">
      <button onclick="closeAdminOrderModal()" class="btn" style="padding:0.5rem 1.5rem; background:#64748b; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">
        Close Details
      </button>
    </div>
  `;

  modal.style.display = 'flex';
}

function closeAdminOrderModal() {
  const modal = document.getElementById('adminOrderModal');
  if (modal) modal.style.display = 'none';
}

async function adminCancelOrder(orderId) {
  if (!confirm(`Are you sure you want to cancel Order #${orderId}? This will automatically restock the items.`)) return;
  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'Cancelled' })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Order cancelled and inventory restocked!', 'success');
      loadAdminOrders();
    } else {
      showToast(data.message || 'Failed to cancel order', 'error');
    }
  } catch (err) {
    showToast('Error cancelling order', 'error');
  }
}

async function shipOrderViaShiprocket(orderId) {
  if (!confirm(`Are you sure you want to create a Shiprocket shipment for Order #${orderId}?`)) {
    return;
  }

  showToast('Connecting to Shiprocket...', 'info');
  try {
    const res = await fetch(`/api/admin/orders/${orderId}/ship`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (data.success) {
      showToast('🎉 Shiprocket Order Created successfully!', 'success');
      loadAdminOrders();
    } else {
      showToast(data.message || 'Shiprocket creation failed', 'error');
    }
  } catch (err) {
    showToast('Failed to connect to Shiprocket API', 'error');
  }
}

async function shipOrderManually(orderId) {
  const trackingNumber = prompt("Enter Courier Tracking Number (AWB):");
  if (!trackingNumber) {
    loadAdminOrders();
    return;
  }
  const trackingLink = prompt("Enter Tracking Link (Optional, leave blank for Delhivery auto-link):");
  
  try {
    showToast('Saving shipment details...', 'info');
    const res = await fetch(`/api/admin/orders/${orderId}/manual-ship`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        tracking_number: trackingNumber.trim(),
        tracking_link: trackingLink ? trackingLink.trim() : `https://www.delhivery.com/track/package/${trackingNumber.trim()}`
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast('🎉 Order successfully marked as Shipped with Tracking AWB!', 'success');
      loadAdminOrders();
    } else {
      showToast(data.message || 'Manual shipment save failed', 'error');
      loadAdminOrders();
    }
  } catch (err) {
    showToast('Failed to save manual shipment details', 'error');
    loadAdminOrders();
  }
}

async function updateOrderStatus(orderId, newStatus) {
  if (newStatus === 'Shipped') {
    shipOrderManually(orderId);
    return;
  }
  
  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Order #${orderId} status updated to ${newStatus}`);
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Error changing order status', 'error');
  }
}

/* ==========================================================================
   3. PRODUCT CRUD OPERATIONS
   ========================================================================== */
let editingProductId = null;
let allProducts = [];

async function loadAdminProducts() {
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (data.success) {
      allProducts = data.products;
      const tbody = document.querySelector('#adminProductsTable tbody');
      tbody.innerHTML = '';

      data.products.forEach(p => {
        const image = formatLocalPath(safeJsonParse(p.image_urls, [])[0] || '/images/products/placeholder.jpg');
        let colorBadges = '';
        if (Array.isArray(p.color_variants) && p.color_variants.length > 0) {
          colorBadges = p.color_variants.map(v => {
            const name = typeof v === 'object' ? (v.color_name || v.name || 'Color') : String(v).trim();
            const hex = typeof v === 'object' && v.color_code ? v.color_code : getColorCssCode(name);
            return `<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${hex}; margin-right:3px; border:1px solid #ccc;" title="${name}"></span>`;
          }).join('');
        } else {
          const colorStr = typeof p.color_variants === 'string' ? p.color_variants : (typeof p.color === 'string' ? p.color : '');
          colorBadges = colorStr ? colorStr.split(',').map(c => `<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${getColorCssCode(c.trim())}; margin-right:3px; border:1px solid #ccc;" title="${c.trim()}"></span>`).join('') : '';
        }
        tbody.innerHTML += `
          <tr>
            <td><img src="${image}" style="width:40px; height:50px; object-fit:cover; border-radius:4px"></td>
            <td>
              <strong>${p.name}</strong><br>
              <span style="font-size:0.75rem; color:#888">${p.category} | ${p.subcategory || 'General'}</span>
              ${colorBadges ? `<div style="display:flex; align-items:center; gap:2px; margin-top:4px;"><span style="font-size:0.7rem; color:#666">Colors:</span> ${colorBadges}</div>` : ''}
            </td>
            <td><strong>₹${p.discount_price || p.price}</strong> ${p.discount_price ? `<br><span style="text-decoration:line-through; font-size:0.75rem; color:#999">₹${p.price}</span>` : ''}</td>
            <td>${p.stock} units</td>
            <td>${p.size_variants}</td>
            <td>
              <button onclick="openEditProductModal(${p.id})" class="btn" style="padding:0.3rem 0.6rem; font-size:0.75rem; background:var(--primary); color:#fff"><i class="fas fa-edit"></i> Edit</button>
              <button onclick="deleteProduct(${p.id})" class="btn" style="padding:0.3rem 0.6rem; font-size:0.75rem; background:var(--danger); color:#fff"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        `;
      });
    }
  } catch (err) {
    console.error('Error loading products list:', err);
    showToast('Failed to load products list', 'error');
  }
}

let manualVariants = [];

function openAddProductModal() {
  editingProductId = null;
  const form = document.getElementById('productForm');
  if (form) form.reset();
  const fileInput = document.getElementById('prodImages');
  if (fileInput) fileInput.value = '';
  const vidInput = document.getElementById('prodVideoFile');
  if (vidInput) vidInput.value = '';
  document.getElementById('productModalTitle').textContent = 'Add New Clothing Product';
  document.getElementById('prodReturnWindow').value = '7';
  document.getElementById('prodImageUrl').value = '';
  document.getElementById('prodVideoUrl').value = '';
  document.getElementById('productAiPreviewArea').style.display = 'none';
  document.getElementById('productAiPrompt').value = '';
  const nameInput = document.getElementById('prodColorName');
  const pickerInput = document.getElementById('prodColorPicker');
  const hexInput = document.getElementById('prodColorHex');
  if (nameInput) nameInput.value = 'Festive Maroon';
  if (pickerInput) pickerInput.value = '#800020';
  if (hexInput) hexInput.value = '#800020';

  // Initialize with 1 default Festive Maroon variant
  manualVariants = [];
  addManualVariantRow({
    color: 'Festive Maroon',
    color_hex: '#800020',
    sku: 'KURTI-MAROON-01',
    price: 2999,
    discount_price: 1499,
    stock: 30,
    size_variants: 'S, M, L, XL',
    image_urls: [],
    is_default: 1
  });

  const vidPrompt = document.getElementById('productVideoAiPrompt');
  if (vidPrompt) vidPrompt.value = '';
  const vidPreviewArea = document.getElementById('productVideoAiPreviewArea');
  if (vidPreviewArea) vidPreviewArea.style.display = 'none';
  const vidPreview = document.getElementById('productVideoAiPreview');
  if (vidPreview) vidPreview.src = '';
  const vidWrap = document.getElementById('videoUploadProgressWrapper');
  if (vidWrap) vidWrap.style.display = 'none';
  renderProductMediaDeletePreview([], '');
  if (window.updateProductVideoPhotoStatus) updateProductVideoPhotoStatus();
  document.getElementById('productModal').style.display = 'flex';
}

let currentEditingProductPhotos = [];
let currentEditingProductVideo = '';

function renderProductMediaDeletePreview(urls, videoUrl) {
  currentEditingProductPhotos = Array.isArray(urls) ? [...urls] : [];
  currentEditingProductVideo = videoUrl || '';

  const listEl = document.getElementById('productMediaPreviewList');
  if (!listEl) return;

  let html = '';

  // Photos
  currentEditingProductPhotos.forEach((imgUrl, idx) => {
    html += `
      <div style="position:relative; width:65px; height:80px; border-radius:6px; overflow:hidden; border:1px solid #cbd5e1; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <img src="${formatLocalPath(imgUrl)}" style="width:100%; height:100%; object-fit:cover;">
        <button type="button" onclick="removeProductPhotoAtIndex(${idx})" style="position:absolute; top:2px; right:2px; background:rgba(220,38,38,0.9); color:#fff; border:none; border-radius:50%; width:20px; height:20px; font-size:10px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;" title="Delete Photo">✕</button>
      </div>
    `;
  });

  // Video
  if (currentEditingProductVideo && currentEditingProductVideo.trim() !== '') {
    html += `
      <div style="position:relative; width:80px; height:80px; border-radius:6px; overflow:hidden; border:1px solid #8b5cf6; background:#1e1b4b; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff; text-align:center; padding:4px;">
        <i class="fas fa-video" style="font-size:18px; color:#a78bfa;"></i>
        <span style="font-size:9px; font-weight:bold; margin-top:2px;">Product Video</span>
        <button type="button" onclick="removeProductVideo()" style="position:absolute; top:2px; right:2px; background:rgba(220,38,38,0.9); color:#fff; border:none; border-radius:50%; width:20px; height:20px; font-size:10px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;" title="Delete Video">✕</button>
      </div>
    `;
  }

  if (currentEditingProductPhotos.length === 0 && (!currentEditingProductVideo || currentEditingProductVideo.trim() === '')) {
    html = '<span style="font-size:0.75rem; color:#94a3b8">No media uploaded yet.</span>';
  }

  listEl.innerHTML = html;
}

function removeProductPhotoAtIndex(idx) {
  if (idx >= 0 && idx < currentEditingProductPhotos.length) {
    currentEditingProductPhotos.splice(idx, 1);
    renderProductMediaDeletePreview(currentEditingProductPhotos, currentEditingProductVideo);
    showToast('Photo removed! Click Save Product to apply.', 'info');
  }
}

function removeProductVideo() {
  currentEditingProductVideo = '';
  const vidInput = document.getElementById('prodVideoUrl');
  if (vidInput) vidInput.value = '';
  const vidPreviewArea = document.getElementById('productVideoAiPreviewArea');
  if (vidPreviewArea) vidPreviewArea.style.display = 'none';
  const vidPreview = document.getElementById('productVideoAiPreview');
  if (vidPreview) vidPreview.src = '';
  renderProductMediaDeletePreview(currentEditingProductPhotos, currentEditingProductVideo);
  showToast('Video removed! Click Save Product to apply.', 'info');
}

function openEditProductModal(id) {
  const product = allProducts.find(p => p.id === id);
  if (!product) return;
  
  editingProductId = product.id;
  const form = document.getElementById('productForm');
  if (form) form.reset();
  const fileInput = document.getElementById('prodImages');
  if (fileInput) fileInput.value = '';
  const vidInput = document.getElementById('prodVideoFile');
  if (vidInput) vidInput.value = '';

  document.getElementById('productModalTitle').textContent = 'Edit Clothing Product';

  // Prefill form with specific product's data
  document.getElementById('prodName').value = product.name;
  document.getElementById('prodCategory').value = product.category;
  document.getElementById('prodSubcategory').value = product.subcategory || '';
  document.getElementById('prodPrice').value = product.price;
  document.getElementById('prodDiscountPrice').value = product.discount_price || '';
  document.getElementById('prodStock').value = product.stock;
  document.getElementById('prodSizes').value = product.size_variants;
  document.getElementById('prodReturnWindow').value = product.return_window_days !== undefined ? product.return_window_days : '7';
  document.getElementById('prodColorVariants').value = product.color_variants || product.color || '';
  document.getElementById('prodColorImages').value = product.color_images || '';
  document.getElementById('prodDesc').value = product.description;
  
  const urls = safeJsonParse(product.image_urls, []).map(formatLocalPath);
  document.getElementById('prodImageUrl').value = urls.length > 0 ? urls[0] : '';
  const prodVidEl = document.getElementById('prodVideoUrl');
  if (prodVidEl) prodVidEl.value = product.video_url || '';
  document.getElementById('productAiPreviewArea').style.display = 'none';
  document.getElementById('productAiPrompt').value = '';

  // Prefill color variants
  manualVariants = [];
  let vars = [];
  if (Array.isArray(product.color_variants)) {
    vars = product.color_variants;
  } else if (typeof product.color_variants === 'string') {
    vars = safeJsonParse(product.color_variants, []);
  }

  const primaryColor = product.color || (vars[0] ? (vars[0].color || vars[0].color_name) : 'Standard');
  const primaryHex = (vars[0] ? (vars[0].color_hex || vars[0].color_code) : '#800020') || '#800020';
  const nameInput = document.getElementById('prodColorName');
  const pickerInput = document.getElementById('prodColorPicker');
  const hexInput = document.getElementById('prodColorHex');
  if (nameInput) nameInput.value = primaryColor;
  if (pickerInput) pickerInput.value = primaryHex;
  if (hexInput) hexInput.value = primaryHex;

  if (vars && vars.length > 0) {
    vars.forEach(v => {
      manualVariants.push({
        color: v.color || v.color_name || 'Standard',
        color_hex: v.color_hex || v.color_code || '#800020',
        sku: v.sku || `${product.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        price: v.price || product.price,
        discount_price: v.discount_price !== undefined ? v.discount_price : product.discount_price,
        stock: v.stock !== undefined ? v.stock : product.stock,
        size_variants: v.size_variants || product.size_variants,
        image_urls: Array.isArray(v.images || v.image_urls) ? (v.images || v.image_urls) : safeJsonParse(v.image_urls, []),
        is_default: v.is_default ? 1 : (manualVariants.length === 0 ? 1 : 0),
        collapsed: false
      });
    });
  } else {
    // Single color fallback
    manualVariants.push({
      color: product.color || 'Standard',
      color_hex: primaryHex,
      sku: `${product.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}-01`,
      price: product.price,
      discount_price: product.discount_price,
      stock: product.stock,
      size_variants: product.size_variants,
      image_urls: urls,
      is_default: 1,
      collapsed: false
    });
  }

  renderManualVariants();

  const vidPrompt = document.getElementById('productVideoAiPrompt');
  if (vidPrompt) vidPrompt.value = '';
  const vidPreviewArea = document.getElementById('productVideoAiPreviewArea');
  const vidPreview = document.getElementById('productVideoAiPreview');
  if (product.video_url && product.video_url.trim() !== '') {
    if (vidPreviewArea && vidPreview) {
      vidPreview.src = formatLocalPath(product.video_url.trim());
      vidPreviewArea.style.display = 'block';
    }
  } else {
    if (vidPreviewArea && vidPreview) {
      vidPreview.src = '';
      vidPreviewArea.style.display = 'none';
    }
  }

  const vidWrap = document.getElementById('videoUploadProgressWrapper');
  if (vidWrap) vidWrap.style.display = 'none';

  renderProductMediaDeletePreview(urls, product.video_url || '');
  if (window.updateProductVideoPhotoStatus) updateProductVideoPhotoStatus();
  document.getElementById('productModal').style.display = 'flex';
}

// Fast Direct Video Upload Handler with Real-time Progress Bar
async function uploadProductVideoDirectly(input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  
  const wrapper = document.getElementById('videoUploadProgressWrapper');
  const statusText = document.getElementById('videoUploadStatusText');
  const percentText = document.getElementById('videoUploadPercentText');
  const progressBar = document.getElementById('videoUploadProgressBar');
  const urlInput = document.getElementById('prodVideoUrl');

  if (wrapper) wrapper.style.display = 'block';
  if (statusText) statusText.textContent = '⚡ Requesting Upload Signature...';
  if (percentText) percentText.textContent = '0%';
  if (progressBar) progressBar.style.width = '0%';

  try {
    const signRes = await fetch('/api/admin/cloudinary-sign', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const signData = await signRes.json();

    if (!signData.success) {
      if (statusText) statusText.textContent = '❌ Failed to get upload signature';
      showToast('Failed to initialize video upload signature', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signData.api_key);
    formData.append('timestamp', signData.timestamp);
    formData.append('signature', signData.signature);
    formData.append('folder', signData.folder);

    const xhr = new XMLHttpRequest();
    const endpoint = `https://api.cloudinary.com/v1_1/${signData.cloud_name}/video/upload`;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        if (progressBar) progressBar.style.width = percent + '%';
        if (percentText) percentText.textContent = percent + '%';
        if (statusText) statusText.textContent = `🚀 Uploading Video: ${percent}%`;
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const resData = JSON.parse(xhr.responseText);
        if (urlInput) urlInput.value = resData.secure_url;
        if (statusText) statusText.textContent = '✅ Video Uploaded Successfully!';
        if (percentText) percentText.textContent = '100%';
        if (progressBar) progressBar.style.width = '100%';
        showToast('🎉 Video uploaded & linked! Click Save Product.', 'success');
      } else {
        if (statusText) statusText.textContent = '❌ Upload Failed';
        showToast('Video upload failed on Cloudinary', 'error');
      }
    };

    xhr.onerror = () => {
      if (statusText) statusText.textContent = '❌ Network Error during upload';
      showToast('Network error while uploading video', 'error');
    };

    xhr.open('POST', endpoint, true);
    xhr.send(formData);

  } catch (err) {
    if (statusText) statusText.textContent = '❌ Upload Failed';
    showToast('Failed to start video upload', 'error');
  }
}

function closeProductModal() {
  document.getElementById('productModal').style.display = 'none';
  editingProductId = null;
  const form = document.getElementById('productForm');
  if (form) form.reset();
  const fileInput = document.getElementById('prodImages');
  if (fileInput) fileInput.value = '';
  const vidInput = document.getElementById('prodVideoFile');
  if (vidInput) vidInput.value = '';
  document.getElementById('prodImageUrl').value = '';
  document.getElementById('prodVideoUrl').value = '';
  manualVariants = [];
}

/* ==========================================================================
   MULTI-COLOR PRODUCT VARIANTS ACTIONS & DOM RENDERER
   ========================================================================== */
function addManualVariantRow(data = null) {
  const prodName = document.getElementById('prodName')?.value || 'Garment';
  const basePrice = document.getElementById('prodPrice')?.value || '2999';
  const baseDiscount = document.getElementById('prodDiscountPrice')?.value || '1499';
  const baseStock = document.getElementById('prodStock')?.value || '25';
  const baseSizes = document.getElementById('prodSizes')?.value || 'S, M, L, XL';

  const defaultColors = [
    { name: 'Festive Maroon', hex: '#800020' },
    { name: 'Royal Saffron', hex: '#ff9933' },
    { name: 'Emerald Green', hex: '#008055' },
    { name: 'Midnight Navy', hex: '#002244' },
    { name: 'Ivory Gold', hex: '#e8d8b0' }
  ];
  const nextColor = defaultColors[manualVariants.length % defaultColors.length];
  const defaultSku = `${prodName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()}-${nextColor.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

  const newVariant = data ? {
    color: data.color || nextColor.name,
    color_hex: data.color_hex || nextColor.hex,
    sku: data.sku || defaultSku,
    price: data.price !== undefined ? data.price : basePrice,
    discount_price: data.discount_price !== undefined ? data.discount_price : baseDiscount,
    stock: data.stock !== undefined ? data.stock : baseStock,
    size_variants: data.size_variants || baseSizes,
    image_urls: Array.isArray(data.image_urls) ? data.image_urls : (typeof data.image_urls === 'string' ? JSON.parse(data.image_urls || '[]') : []),
    is_default: data.is_default ? 1 : (manualVariants.length === 0 ? 1 : 0),
    collapsed: false
  } : {
    color: nextColor.name,
    color_hex: nextColor.hex,
    sku: defaultSku,
    price: basePrice,
    discount_price: baseDiscount,
    stock: baseStock,
    size_variants: baseSizes,
    image_urls: [],
    is_default: manualVariants.length === 0 ? 1 : 0,
    collapsed: false
  };

  manualVariants.push(newVariant);
  renderManualVariants();
}

function removeManualVariant(idx) {
  if (manualVariants.length <= 1) {
    showToast('At least one color variant is required for a complete product catalog', 'warning');
    return;
  }
  const wasDefault = manualVariants[idx].is_default;
  manualVariants.splice(idx, 1);
  if (wasDefault && manualVariants.length > 0) {
    manualVariants[0].is_default = 1;
  }
  renderManualVariants();
}

function duplicateManualVariant(idx) {
  const source = manualVariants[idx];
  const copy = JSON.parse(JSON.stringify(source));
  copy.color = `${source.color} (Copy)`;
  copy.sku = `${source.sku}-COPY-${Math.floor(Math.random() * 900 + 100)}`;
  copy.is_default = 0;
  copy.collapsed = false;
  manualVariants.push(copy);
  renderManualVariants();
  showToast(`Duplicated variant: ${copy.color}`, 'info');
}

function toggleManualVariantCollapse(idx) {
  manualVariants[idx].collapsed = !manualVariants[idx].collapsed;
  renderManualVariants();
}

function setDefaultManualVariant(idx) {
  manualVariants.forEach((v, i) => { v.is_default = i === idx ? 1 : 0; });
  renderManualVariants();
  showToast(`Default color set to: ${manualVariants[idx].color}`, 'info');
}

function updateManualVariantField(idx, field, value) {
  if (manualVariants[idx]) {
    manualVariants[idx][field] = value;
    if (field === 'color_hex') {
      const swatch = document.getElementById(`varSwatchPreview_${idx}`);
      if (swatch) swatch.style.backgroundColor = value;
    }
  }
}

function addVariantImageUrl(idx) {
  const urlInput = document.getElementById(`varAddUrl_${idx}`);
  if (!urlInput || !urlInput.value.trim()) return;
  const url = urlInput.value.trim();
  if (!manualVariants[idx].image_urls) manualVariants[idx].image_urls = [];
  manualVariants[idx].image_urls.push(url);
  urlInput.value = '';
  renderManualVariants();
}

function removeVariantImage(varIdx, imgIdx) {
  if (manualVariants[varIdx] && manualVariants[varIdx].image_urls) {
    manualVariants[varIdx].image_urls.splice(imgIdx, 1);
    renderManualVariants();
  }
}

function setVariantPrimaryImage(varIdx, imgIdx) {
  if (manualVariants[varIdx] && manualVariants[varIdx].image_urls) {
    const primary = manualVariants[varIdx].image_urls.splice(imgIdx, 1)[0];
    manualVariants[varIdx].image_urls.unshift(primary);
    renderManualVariants();
    showToast('Primary photo updated for variant', 'info');
  }
}

async function handleVariantFilesUpload(event, varIdx) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }

  showToast(`Uploading ${files.length} variant photo(s)...`, 'info');
  try {
    const res = await fetch('/api/admin/upload-media', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.urls)) {
      if (!manualVariants[varIdx].image_urls) manualVariants[varIdx].image_urls = [];
      manualVariants[varIdx].image_urls.push(...data.urls);
      renderManualVariants();
      showToast(`${data.urls.length} variant photo(s) uploaded successfully!`, 'success');
    } else {
      showToast(data.message || 'Failed to upload variant photos', 'error');
    }
  } catch (err) {
    console.error('Variant photo upload error:', err);
    // Fallback to FileReader if network error
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = function(e) {
        if (!manualVariants[varIdx].image_urls) manualVariants[varIdx].image_urls = [];
        manualVariants[varIdx].image_urls.push(e.target.result);
        renderManualVariants();
      };
      reader.readAsDataURL(files[i]);
    }
    showToast('Uploaded photos locally for draft preview', 'info');
  }
}

function selectVariantPresetColor(idx, colorName, colorHex) {
  if (manualVariants[idx]) {
    manualVariants[idx].color = colorName;
    manualVariants[idx].color_hex = colorHex;
    const prodName = document.getElementById('prodName')?.value || 'Garment';
    const cleanProd = prodName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'L2L';
    const cleanColor = colorName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
    manualVariants[idx].sku = `${cleanProd}-${cleanColor}-${Math.floor(100 + Math.random() * 900)}`;
    renderManualVariants();
    showToast(`Variant updated to ${colorName}`, 'info');
  }
}
window.selectVariantPresetColor = selectVariantPresetColor;

function renderManualVariants() {
  const container = document.getElementById('manualVariantsContainer');
  if (!container) return;

  if (manualVariants.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:1.5rem; background:#fff; border-radius:8px; border:1px dashed #cbd5e1; color:#64748b; font-size:0.85rem;">
        No color variants defined yet. Click "Add Color Variant" to add Red, Orange, Navy, etc.
      </div>
    `;
    return;
  }

  container.innerHTML = manualVariants.map((v, idx) => {
    const isCollapsed = Boolean(v.collapsed);
    const isDef = Boolean(v.is_default);
    const images = Array.isArray(v.image_urls) ? v.image_urls : [];

    return `
      <div class="variant-card" style="background:#fff; border:1px solid ${isDef ? 'var(--primary)' : '#cbd5e1'}; border-radius:10px; box-shadow:var(--shadow-sm); overflow:hidden;">
        <!-- Card Header -->
        <div style="background:${isDef ? 'hsl(348,75%,97%)' : '#f8fafc'}; padding:0.8rem 1.2rem; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; flex-wrap:wrap; gap:8px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div id="varSwatchPreview_${idx}" style="width:24px; height:24px; border-radius:50%; background-color:${v.color_hex || '#800020'}; border:2px solid #fff; box-shadow:0 0 0 1px #cbd5e1;"></div>
            <strong style="font-size:0.95rem; color:var(--primary);">${escapeHTML(v.color || 'Variant ' + (idx + 1))}</strong>
            <span style="font-size:0.75rem; color:#64748b; background:#fff; padding:2px 8px; border-radius:12px; border:1px solid #e2e8f0;">SKU: ${escapeHTML(v.sku || 'N/A')}</span>
            ${isDef ? '<span style="background:var(--primary); color:#fff; font-size:0.7rem; font-weight:700; padding:2px 8px; border-radius:10px;">Default Color</span>' : ''}
          </div>

          <div style="display:flex; align-items:center; gap:8px;">
            ${!isDef ? `
              <button type="button" class="btn" onclick="setDefaultManualVariant(${idx})" style="padding:0.25rem 0.6rem; font-size:0.75rem; background:#fff; border:1px solid #cbd5e1;">
                Set as Default
              </button>
            ` : ''}
            <button type="button" class="btn" onclick="duplicateManualVariant(${idx})" style="padding:0.25rem 0.6rem; font-size:0.75rem; background:#fff; border:1px solid #cbd5e1;" title="Duplicate Variant">
              <i class="fas fa-copy"></i>
            </button>
            <button type="button" class="btn" onclick="toggleManualVariantCollapse(${idx})" style="padding:0.25rem 0.6rem; font-size:0.75rem; background:#fff; border:1px solid #cbd5e1;">
              <i class="fas ${isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}"></i>
            </button>
            <button type="button" class="btn btn-danger" onclick="removeManualVariant(${idx})" style="padding:0.25rem 0.6rem; font-size:0.75rem;" title="Remove Variant">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <!-- Card Body -->
        <div style="padding:1.2rem; display:${isCollapsed ? 'none' : 'block'};">
          <!-- Quick Color Preset Palette Chips for this Variant -->
          <div style="margin-bottom:1rem; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; padding:0.6rem 0.8rem;">
            <span style="font-size:0.72rem; font-weight:700; color:#475569; display:block; margin-bottom:5px;">🎨 Select from Ethnic Fashion Color Chart:</span>
            <div style="display:flex; flex-wrap:wrap; gap:5px;">
              ${FASHION_COLOR_PALETTE.map(c => `
                <button type="button" onclick="selectVariantPresetColor(${idx}, '${c.name}', '${c.hex}')" title="${c.name} (${c.hex})" style="display:inline-flex; align-items:center; gap:4px; background:#fff; border:1px solid ${v.color_hex === c.hex ? 'var(--primary)' : '#cbd5e1'}; border-radius:12px; padding:2px 7px; font-size:0.7rem; font-weight:600; cursor:pointer;">
                  <span style="width:10px; height:10px; border-radius:50%; background:${c.hex}; display:inline-block;"></span>
                  ${c.name}
                </button>
              `).join('')}
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1.2fr 1fr 1fr; gap:1rem; margin-bottom:1rem;">
            <div class="form-group">
              <label style="font-weight:700; font-size:0.8rem;">Color Name</label>
              <input type="text" class="form-input" value="${escapeHTML(v.color || '')}" placeholder="e.g. Crimson Red" oninput="updateManualVariantField(${idx}, 'color', this.value)" style="width:100%;" required>
            </div>
            <div class="form-group">
              <label style="font-weight:700; font-size:0.8rem;">Color Swatch (Hex / Picker)</label>
              <div style="display:flex; gap:6px; align-items:center;">
                <input type="color" value="${v.color_hex || '#800020'}" onchange="updateManualVariantField(${idx}, 'color_hex', this.value); this.nextElementSibling.value = this.value;" style="width:36px; height:34px; padding:0; border:1px solid #cbd5e1; border-radius:4px; cursor:pointer;">
                <input type="text" class="form-input" value="${v.color_hex || '#800020'}" oninput="updateManualVariantField(${idx}, 'color_hex', this.value)" style="flex:1; font-family:monospace; font-size:0.8rem;">
              </div>
            </div>
            <div class="form-group">
              <label style="font-weight:700; font-size:0.8rem;">Variant SKU</label>
              <input type="text" class="form-input" value="${escapeHTML(v.sku || '')}" placeholder="e.g. KURTI-RED-01" oninput="updateManualVariantField(${idx}, 'sku', this.value)" style="width:100%;" required>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1.5fr; gap:1rem; margin-bottom:1rem;">
            <div class="form-group">
              <label style="font-weight:700; font-size:0.8rem;">Variant MRP (₹)</label>
              <input type="number" class="form-input" value="${v.price || ''}" placeholder="2999" oninput="updateManualVariantField(${idx}, 'price', this.value)" style="width:100%;" required>
            </div>
            <div class="form-group">
              <label style="font-weight:700; font-size:0.8rem;">Selling Price (₹)</label>
              <input type="number" class="form-input" value="${v.discount_price || ''}" placeholder="1499" oninput="updateManualVariantField(${idx}, 'discount_price', this.value)" style="width:100%;">
            </div>
            <div class="form-group">
              <label style="font-weight:700; font-size:0.8rem;">Stock Units</label>
              <input type="number" class="form-input" value="${v.stock !== undefined ? v.stock : 20}" placeholder="20" min="0" oninput="updateManualVariantField(${idx}, 'stock', parseInt(this.value)||0)" style="width:100%;" required>
            </div>
            <div class="form-group">
              <label style="font-weight:700; font-size:0.8rem;">Available Sizes for this Color</label>
              <input type="text" class="form-input" value="${escapeHTML(v.size_variants || 'S, M, L, XL')}" placeholder="S, M, L, XL" oninput="updateManualVariantField(${idx}, 'size_variants', this.value)" style="width:100%;" required>
            </div>
          </div>

          <!-- Color-Specific Photos Management -->
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:1rem;">
            <label style="font-weight:700; font-size:0.8rem; color:var(--primary); display:block; margin-bottom:6px;">
              📸 Color-Specific Image Gallery (${images.length} photos)
            </label>
            <div style="display:flex; gap:8px; margin-bottom:10px; flex-wrap:wrap; align-items:center;">
              <input type="text" id="varAddUrl_${idx}" class="form-input" placeholder="Paste photo URL (e.g. /images/products/...)" style="flex:1; min-width:240px; font-size:0.8rem;">
              <button type="button" class="btn btn-primary" onclick="addVariantImageUrl(${idx})" style="padding:0.4rem 0.9rem; font-size:0.8rem;">
                Add URL
              </button>
              <label class="btn" style="background:#fff; border:1px solid #cbd5e1; padding:0.4rem 0.9rem; font-size:0.8rem; cursor:pointer;">
                <i class="fas fa-upload"></i> Upload Files
                <input type="file" multiple accept="image/*" style="display:none;" onchange="handleVariantFilesUpload(event, ${idx})">
              </label>
            </div>

            <!-- Image Previews Grid -->
            <div style="display:flex; gap:10px; flex-wrap:wrap; min-height:60px; align-items:center;">
              ${images.length === 0 ? '<span style="font-size:0.75rem; color:#94a3b8; font-style:italic;">No photos attached yet for this color variant.</span>' : ''}
              ${images.map((imgUrl, imgI) => `
                <div style="position:relative; width:64px; height:64px; border:1px solid ${imgI === 0 ? 'var(--primary)' : '#cbd5e1'}; border-radius:6px; overflow:hidden; background:#fff;">
                  <img src="${formatLocalPath(imgUrl)}" alt="Variant Photo" style="width:100%; height:100%; object-fit:cover;">
                  ${imgI === 0 ? '<span style="position:absolute; top:2px; left:2px; background:var(--primary); color:#fff; font-size:0.55rem; padding:1px 3px; border-radius:2px;">Primary</span>' : `
                    <button type="button" onclick="setVariantPrimaryImage(${idx}, ${imgI})" title="Set as primary" style="position:absolute; bottom:2px; left:2px; background:rgba(0,0,0,0.6); color:#fff; border:none; border-radius:2px; font-size:0.55rem; padding:1px 3px; cursor:pointer;">★</button>
                  `}
                  <button type="button" onclick="removeVariantImage(${idx}, ${imgI})" title="Remove photo" style="position:absolute; top:2px; right:2px; background:rgba(239,68,68,0.85); color:#fff; border:none; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; font-size:0.6rem; cursor:pointer;">&times;</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function saveManualProductDraft() {
  document.getElementById('prodStock').value = '0';
  document.getElementById('btnPublishProduct').click();
}

async function handleProductFormSubmit(e) {
  e.preventDefault();

  // Validate Variants
  if (manualVariants.length > 0) {
    const skus = new Set();
    for (const v of manualVariants) {
      if (!v.color || !v.color.trim()) {
        showToast('All color variants must have a valid color name', 'error');
        return;
      }
      if (!v.sku || !v.sku.trim()) {
        showToast(`Variant "${v.color}" is missing a SKU`, 'error');
        return;
      }
      const cleanSku = v.sku.trim().toUpperCase();
      if (skus.has(cleanSku)) {
        showToast(`Duplicate SKU detected: ${cleanSku}. Each variant SKU must be unique across the catalog.`, 'error');
        return;
      }
      skus.add(cleanSku);
    }
  }

  const submitBtn = document.getElementById('btnPublishProduct') || e.target.querySelector('button[type="submit"]');
  if (submitBtn) {
    if (submitBtn.disabled) return;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validating & Publishing...';
  }

  const form = document.getElementById('productForm');
  const formData = new FormData(form);

  // Attach structured color variants
  if (manualVariants.length > 0) {
    formData.append('color_variants', JSON.stringify(manualVariants));
  }
  formData.set('image_urls', JSON.stringify(currentEditingProductPhotos || []));
  const finalVidUrl = (currentEditingProductVideo || document.getElementById('prodVideoUrl')?.value || '').trim();
  formData.set('video_url', finalVidUrl);

  const url = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
  const method = editingProductId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();
    if (data.success) {
      showToast(data.message || 'Product published successfully with color variants!', 'success');
      closeProductModal();
      loadAdminProducts();
    } else {
      showToast(data.message || 'Failed to save product', 'error');
    }
  } catch (err) {
    showToast('Error uploading product data: ' + err.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Validate &amp; Publish';
    }
  }
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to permanently delete this product?')) return;

  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Product deleted successfully');
      loadAdminProducts();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to delete product', 'error');
  }
}

/* ==========================================================================
   4. INQUIRIES MANAGEMENT
   ========================================================================== */
async function loadAdminInquiries() {
  try {
    const res = await fetch('/api/inquiries', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      const tbody = document.querySelector('#adminInquiriesTable tbody');
      tbody.innerHTML = '';

      if (data.inquiries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-light)">No customer support inquiries available.</td></tr>';
        return;
      }

      data.inquiries.forEach(inq => {
        const date = new Date(inq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        tbody.innerHTML += `
          <tr>
            <td>${date}</td>
            <td><strong>${inq.name}</strong><br><span style="font-size:0.75rem; color:#888">${inq.email} | ${inq.phone || 'N/A'}</span></td>
            <td><strong style="color:var(--primary)">${inq.subject || 'General'}</strong></td>
            <td><div style="max-width:350px; font-size:0.85rem">${inq.message}</div></td>
            <td>
              <a href="mailto:${inq.email}?subject=Re: ${inq.subject || 'Little to Large Support'}" class="btn btn-primary" style="padding:0.3rem 0.8rem; font-size:0.75rem">Reply</a>
            </td>
          </tr>
        `;
      });
    }
  } catch (err) {
    showToast('Failed to load customer inquiries', 'error');
  }
}

/* ==========================================================================
   5. MARKETING AUDIENCE SEGMENTATION & SEO SITEMAPS
   ========================================================================== */

async function loadAudienceSegments() {
  try {
    const res = await fetch('/api/admin/segments', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success && data.segments) {
      document.getElementById('segmentEthnic').textContent = `${data.segments.ethnicFans} users`;
      document.getElementById('segmentSpender').textContent = `${data.segments.highSpenders} users`;
      document.getElementById('segmentRepeat').textContent = `${data.segments.repeatBuyers} users`;
    }
  } catch (err) {
    console.error('Failed to load marketing segments:', err);
  }
}

async function generateSitemapSEO() {
  const alertBox = document.getElementById('seoAlertBox');
  alertBox.style.display = 'block';
  alertBox.style.color = 'var(--primary)';
  alertBox.textContent = 'Generating sitemap.xml...';

  try {
    const res = await fetch('/api/admin/seo-generate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      alertBox.style.color = 'var(--success)';
      alertBox.textContent = '🎉 sitemap.xml & robots.txt updated in /public!';
      showToast('Sitemap compiled successfully!');
    } else {
      alertBox.style.color = 'var(--danger)';
      alertBox.textContent = 'Sitemap compilation failed.';
      showToast(data.message, 'error');
    }
  } catch (err) {
    alertBox.style.color = 'var(--danger)';
    alertBox.textContent = 'Connection error.';
    showToast('SEO Sitemap error', 'error');
  }
}

/* ==========================================================================
   6. DYNAMIC HOMEPAGE CONTENT & CAMPAIGN EDITORS
   ========================================================================== */

async function loadHomepageSettings() {
  try {
    const res = await fetch('/api/homepage-settings');
    const data = await res.json();
    if (data.success && data.settings) {
      const s = data.settings;
      document.getElementById('heroTitleInput').value = s.hero_title;
      document.getElementById('heroSubtitleInput').value = s.hero_subtitle || '';
      document.getElementById('heroMediaUrlInput').value = s.media_url || '';
      document.getElementById('heroMediaTypeInput').value = s.media_type || 'image';
      document.getElementById('heroFestivalInput').value = s.festival_mode || 'none';
    }
  } catch (err) {
    showToast('Failed to load homepage settings', 'error');
  }
}

async function handleHeroSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData();
  formData.append('hero_title', document.getElementById('heroTitleInput').value.trim());
  formData.append('hero_subtitle', document.getElementById('heroSubtitleInput').value.trim());
  formData.append('media_url', document.getElementById('heroMediaUrlInput').value.trim());
  formData.append('media_type', document.getElementById('heroMediaTypeInput').value);
  formData.append('festival_mode', document.getElementById('heroFestivalInput').value);
  
  const heroFileInput = document.getElementById('heroFile');
  if (heroFileInput && heroFileInput.files[0]) {
    formData.append('image', heroFileInput.files[0]);
  }

  try {
    const res = await fetch('/api/homepage-settings', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      showToast('Homepage hero configuration updated!', 'success');
      // Reset file input
      if (heroFileInput) heroFileInput.value = '';
      loadHomepageSettings();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to update homepage settings', 'error');
  }
}

async function loadAdminPromotions() {
  try {
    const res = await fetch('/api/admin/promotions', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const tbody = document.querySelector('#adminPromotionsTable tbody');
    tbody.innerHTML = '';

    if (data.success && data.promotions) {
      if (data.promotions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-light)">No active campaigns running.</td></tr>';
        return;
      }

      data.promotions.forEach(p => {
        const start = new Date(p.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const end = new Date(p.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        tbody.innerHTML += `
          <tr>
            <td><strong>${p.priority}</strong></td>
            <td>
              <strong>${p.title}</strong><br>
              <span style="font-size:0.75rem; color:#888">${p.subtitle || ''}</span>
            </td>
            <td>${start} - ${end}</td>
            <td><span style="padding:0.2rem 0.6rem; border-radius:4px; color:#fff; font-size:0.75rem; font-weight:700; background-color:${p.bg_color}">${p.bg_color}</span></td>
            <td>
              <button onclick="deletePromo(${p.id})" class="btn btn-accent" style="padding:0.3rem 0.6rem; font-size:0.75rem; background:var(--danger); color:#fff"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        `;
      });
    }
  } catch (err) {
    showToast('Error loading active campaigns', 'error');
  }
}

async function handlePromoSubmit(e) {
  e.preventDefault();
  
  const title = document.getElementById('promoTitle').value.trim();
  const subtitle = document.getElementById('promoSubtitle').value.trim();
  const bg_color = document.getElementById('promoBgColor').value.trim();
  const priority = parseInt(document.getElementById('promoPriority').value) || 0;
  const start_date = document.getElementById('promoStartDate').value;
  const end_date = document.getElementById('promoEndDate').value;
  const link_url = document.getElementById('promoLinkUrl').value.trim();
  const fileInput = document.getElementById('promoFile');
  const mediaUrlInput = document.getElementById('promoMediaUrl');

  const file = fileInput.files[0];
  const media_url = mediaUrlInput.value.trim();

  if (!file && !media_url) {
    showToast('Please upload an image file OR paste an image URL/path', 'warning');
    return;
  }

  const formData = new FormData();
  formData.append('title', title);
  formData.append('subtitle', subtitle);
  formData.append('bg_color', bg_color);
  formData.append('priority', priority);
  formData.append('start_date', start_date);
  formData.append('end_date', end_date);
  formData.append('link_url', link_url);

  if (file) {
    formData.append('image', file);
  } else {
    formData.append('media_url', media_url);
  }

  try {
    showToast('Creating campaign banner...', 'info');
    const res = await fetch('/api/promotions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      showToast('Campaign launched successfully!', 'success');
      document.getElementById('promoCreateForm').reset();
      loadAdminPromotions();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to create promotion campaign', 'error');
  }
}

async function deletePromo(id) {
  if (!confirm('Are you sure you want to delete this promotion campaign?')) return;
  try {
    const res = await fetch(`/api/promotions/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Promotion deleted');
      loadAdminPromotions();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to delete campaign', 'error');
  }
}

/* ==========================================================================
   7. DIAGNOSTICS & SYSTEM ERROR LOGS
   ========================================================================== */

async function loadAdminErrors() {
  try {
    const res = await fetch('/api/admin/errors', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const tbody = document.querySelector('#adminErrorLogsTable tbody');
    tbody.innerHTML = '';

    if (data.success && data.logs) {
      if (data.logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--success); font-weight:700">✅ No system exceptions logged. All systems operational!</td></tr>';
        return;
      }

      data.logs.forEach(log => {
        const time = new Date(log.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        tbody.innerHTML += `
          <tr>
            <td style="font-size:0.75rem">${time}</td>
            <td><code style="background:#eee; padding:2px 4px; border-radius:3px; font-size:0.8rem">${log.path || '/'}</code></td>
            <td><strong style="color:var(--danger); font-size:0.85rem">${log.message}</strong></td>
            <td><span style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--danger)">${log.severity}</span></td>
            <td><div style="font-size:0.82rem; font-style:italic; color:#444">${log.suggested_fix || 'No solution cached.'}</div></td>
          </tr>
        `;
      });
    }
  } catch (err) {
    showToast('Failed to load system diagnostics logs', 'error');
  }
}

/* ==========================================================================
   8. INTERACTIVE LOOKBOOK CATALOG MANAGER
   ========================================================================== */

async function loadAdminLookbook() {
  try {
    const res = await fetch('/api/lookbook');
    const data = await res.json();
    const grid = document.getElementById('lookbookPagesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (data.success && data.pages) {
      if (data.pages.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-light); grid-column:1/-1; text-align:center">No pages added to lookbook catalog yet. Add your first page using the form above.</p>';
        return;
      }

      data.pages.forEach((page, index) => {
        const isFirst = index === 0;
        const isLast = index === data.pages.length - 1;
        
        const card = document.createElement('div');
        card.style.cssText = 'background:#fff; border:1px solid var(--border-color); border-radius:8px; overflow:hidden; display:flex; flex-direction:column; box-shadow:var(--shadow-sm);';
        card.innerHTML = `
          <div style="height:180px; background-image:url(\'${page.image_url}\'); background-size:cover; background-position:center; background-color:#faf7f2; border-bottom:1px solid #eee"></div>
          <div style="padding:1rem; display:flex; flex-direction:column; gap:0.8rem; flex-grow:1; justify-content:space-between">
            <div>
              <strong style="color:var(--primary); font-size:0.95rem">Page ${page.page_number}</strong>
              <div style="font-size:0.75rem; color:var(--text-light); text-overflow:ellipsis; overflow:hidden; white-space:nowrap" title="${page.image_url}">${page.image_url}</div>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:0.4rem">
              <div style="display:flex; gap:0.4rem">
                <button class="btn btn-accent" style="flex:1; padding:0.4rem !important; font-size:0.75rem !important; cursor:pointer" onclick="reorderLookbook(${page.page_number}, \'up\')" ${isFirst ? 'disabled style="opacity:0.5"' : ''} title="Move page up"><i class="fas fa-arrow-up"></i> Up</button>
                <button class="btn btn-accent" style="flex:1; padding:0.4rem !important; font-size:0.75rem !important; cursor:pointer" onclick="reorderLookbook(${page.page_number}, \'down\')" ${isLast ? 'disabled style="opacity:0.5"' : ''} title="Move page down"><i class="fas fa-arrow-down"></i> Down</button>
              </div>
              <button class="btn btn-danger" style="width:100%; padding:0.4rem !important; font-size:0.75rem !important; cursor:pointer" onclick="deleteLookbookPage(${page.page_number})"><i class="fas fa-trash-alt"></i> Delete Page</button>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });
    }
  } catch (err) {
    showToast('Failed to load lookbook catalogue pages', 'error');
  }
}

// Upload/Update a page handler
document.addEventListener('DOMContentLoaded', () => {
  const uploadForm = document.getElementById('lookbookUploadForm');
  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const pageNumInput = document.getElementById('lookbookPageNum');
      const fileInput = document.getElementById('lookbookFile');
      
      const pageNumber = pageNumInput.value;
      const file = fileInput.files[0];
      
      if (!pageNumber || !file) {
        showToast('Please fill all required upload fields', 'warning');
        return;
      }
      
      const formData = new FormData();
      formData.append('page_number', pageNumber);
      formData.append('image', file);
      
      try {
        showToast('Uploading lookbook catalog page...', 'info');
        const res = await fetch('/api/admin/lookbook/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        
        const data = await res.json();
        if (data.success) {
          showToast(data.message, 'success');
          uploadForm.reset();
          loadAdminLookbook();
        } else {
          showToast(data.message || 'Failed to upload lookbook page', 'error');
        }
      } catch (err) {
        showToast('Error uploading lookbook page', 'error');
      }
    });
  }
});

async function reorderLookbook(pageNumber, direction) {
  try {
    const res = await fetch('/api/admin/lookbook/reorder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ page_number: pageNumber, direction })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadAdminLookbook();
    } else {
      showToast(data.message || 'Failed to reorder page', 'error');
    }
  } catch (err) {
    showToast('Error reordering lookbook page', 'error');
  }
}

async function deleteLookbookPage(pageNumber) {
  if (!confirm(`Are you sure you want to delete Lookbook Page ${pageNumber}? Subsequent pages will automatically shift left.`)) {
    return;
  }
  
  try {
    const res = await fetch('/api/admin/lookbook/delete', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ page_number: pageNumber })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || 'Page deleted', 'success');
      loadAdminLookbook();
    } else {
      showToast(data.message || 'Failed to delete page', 'error');
    }
  } catch (err) {
    showToast('Error deleting lookbook page', 'error');
  }
}

function prefillPromoDates() {
  const startDateInput = document.getElementById('promoStartDate');
  const endDateInput = document.getElementById('promoEndDate');
  if (startDateInput && endDateInput && !startDateInput.value) {
    const now = new Date();
    const tzoffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now - tzoffset)).toISOString().slice(0, 16);
    startDateInput.value = localISOTime;

    // Set end date to 30 days in future
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const localFutureTime = (new Date(future - tzoffset)).toISOString().slice(0, 16);
    endDateInput.value = localFutureTime;
  }
}

async function loadAdminCoupons() {
  try {
    const res = await fetch('/api/coupons');
    const data = await res.json();
    const tbody = document.querySelector('#adminCouponsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (data.success && data.coupons) {
      if (data.coupons.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-light)">No coupon codes created yet.</td></tr>';
        return;
      }

      data.coupons.forEach(c => {
        let discountText = '';
        if (c.discount_type === 'percentage') {
          discountText = `${Math.round(c.discount_value)}%`;
        } else {
          discountText = `₹${Math.round(c.discount_value)}`;
        }

        tbody.innerHTML += `
          <tr>
            <td><strong>${c.code}</strong></td>
            <td>${discountText}</td>
            <td style="font-size:0.8rem">${c.description || ''}</td>
            <td><span style="padding:0.2rem 0.5rem; background:#e1e1e1; font-weight:700; border-radius:4px; font-size:0.75rem">${c.tag}</span></td>
            <td>
              <button onclick="deleteCoupon(${c.id})" class="btn btn-accent" style="padding:0.3rem 0.6rem; font-size:0.75rem; background:var(--danger); color:#fff"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        `;
      });
    }
  } catch (err) {
    showToast('Error loading coupons list', 'error');
  }
}

async function handleCouponSubmit(e) {
  e.preventDefault();

  const code = document.getElementById('couponCode').value.trim();
  const discount_type = document.getElementById('couponDiscountType').value;
  const discount_value = parseFloat(document.getElementById('couponDiscountValue').value);
  const description = document.getElementById('couponDescription').value.trim();
  const tag = document.getElementById('couponTag').value.trim();

  if (!code || isNaN(discount_value) || discount_value <= 0) {
    showToast('Please enter valid coupon details', 'error');
    return;
  }

  try {
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ code, discount_type, discount_value, description, tag })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Coupon code created successfully!', 'success');
      document.getElementById('couponCreateForm').reset();
      loadAdminCoupons();
    } else {
      showToast(data.message || 'Failed to create coupon', 'error');
    }
  } catch (err) {
    showToast('Error saving coupon code', 'error');
  }
}

async function deleteCoupon(id) {
  if (!confirm('Are you sure you want to delete this coupon code? Customers will no longer be able to apply it.')) return;
  try {
    const res = await fetch(`/api/coupons/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Coupon code deleted');
      loadAdminCoupons();
    } else {
      showToast(data.message || 'Failed to delete coupon', 'error');
    }
  } catch (err) {
    showToast('Error deleting coupon code', 'error');
  }
}

/* ==========================================================================
   9. SHIPPING & DELIVERY SETTINGS
   ========================================================================== */
async function loadAdminShippingSettings() {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.success && data.settings) {
      document.getElementById('settingShippingFee').value = data.settings.shipping_fee || '60';
      document.getElementById('settingFreeThreshold').value = data.settings.free_shipping_threshold || '999';
    } else {
      showToast(data.message || 'Failed to load shipping settings', 'error');
    }
  } catch (err) {
    showToast('Error connecting to settings API', 'error');
  }

  // Load Shiprocket configurations
  try {
    const res = await fetch('/api/admin/shiprocket-config', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('shiprocketEmail').value = data.email || '';
      document.getElementById('shiprocketPickup').value = data.pickup_location || 'Primary';
    }
  } catch (err) {
    console.error('Failed to load Shiprocket settings:', err);
  }

  // Also load Email Automation configurations
  loadEmailSettings();
  // Load PIN Code settings
  loadAdminPincodeSettings();
}

async function loadAdminPincodeSettings() {
  try {
    const res = await fetch('/api/admin/pincodes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      const allowedEl = document.getElementById('settingAllowedPincodes');
      const msgEl = document.getElementById('settingPincodeErrMsg');
      if (allowedEl) allowedEl.value = data.allowed_pincodes || '36, 37, 38, 39';
      if (msgEl) msgEl.value = data.pincode_error_message || 'Delivery is currently unavailable to this PIN Code.';
    }
  } catch (err) {
    console.error('Failed to load PIN code settings:', err);
  }
}

async function saveAdminPincodeSettings(e) {
  e.preventDefault();
  const allowed_pincodes = document.getElementById('settingAllowedPincodes').value.trim();
  const pincode_error_message = document.getElementById('settingPincodeErrMsg').value.trim();

  if (!allowed_pincodes) {
    showToast('Please enter allowed PIN codes or ALL', 'error');
    return;
  }

  try {
    const res = await fetch('/api/admin/pincodes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ allowed_pincodes, pincode_error_message })
    });
    const data = await res.json();
    if (data.success) {
      showToast('🎉 PIN Code delivery settings saved successfully!', 'success');
    } else {
      showToast(data.message || 'Failed to save PIN code settings', 'error');
    }
  } catch (err) {
    showToast('Error saving PIN code settings', 'error');
  }
}

function setAdminPincodePreset(preset) {
  const allowedEl = document.getElementById('settingAllowedPincodes');
  const msgEl = document.getElementById('settingPincodeErrMsg');

  if (preset === 'ALL') {
    allowedEl.value = 'ALL';
    msgEl.value = 'Delivery is currently unavailable to this PIN Code.';
  } else if (preset === 'GUJARAT') {
    allowedEl.value = '36, 37, 38, 39';
    msgEl.value = 'We currently deliver only to PIN Codes in Gujarat.';
  } else if (preset === 'MH') {
    allowedEl.value = '40, 41, 42, 43, 44';
    msgEl.value = 'We currently deliver only to PIN Codes in Maharashtra.';
  } else if (preset === 'DELHI') {
    allowedEl.value = '11, 12, 20';
    msgEl.value = 'We currently deliver only to PIN Codes in Delhi NCR.';
  }
  showToast(`Applied preset: ${preset}`, 'info');
}

async function testAdminPincode() {
  const pinInput = document.getElementById('adminTestPincodeInput');
  const resultEl = document.getElementById('adminTestPincodeResult');
  const pin = pinInput ? pinInput.value.trim() : '';

  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    resultEl.style.display = 'block';
    resultEl.style.backgroundColor = '#fef2f2';
    resultEl.style.color = '#991b1b';
    resultEl.style.border = '1px solid #fca5a5';
    resultEl.innerHTML = '❌ Please enter a valid 6-digit numeric PIN Code to test.';
    return;
  }

  try {
    const res = await fetch(`/api/pincode/check?pincode=${encodeURIComponent(pin)}`);
    const data = await res.json();
    resultEl.style.display = 'block';
    if (data.success) {
      resultEl.style.backgroundColor = '#f0fdf4';
      resultEl.style.color = '#166534';
      resultEl.style.border = '1px solid #86efac';
      resultEl.innerHTML = `✅ <strong>PIN ${pin} is SERVICEABLE!</strong> Customers at this PIN Code CAN place orders.`;
    } else {
      resultEl.style.backgroundColor = '#fef2f2';
      resultEl.style.color = '#991b1b';
      resultEl.style.border = '1px solid #fca5a5';
      resultEl.innerHTML = `❌ <strong>PIN ${pin} is NOT SERVICEABLE.</strong><br>Customer Error Message: "${data.message || 'Unavailable'}"`;
    }
  } catch (err) {
    resultEl.style.display = 'block';
    resultEl.style.backgroundColor = '#fffbeb';
    resultEl.style.color = '#92400e';
    resultEl.style.border = '1px solid #fde68a';
    resultEl.innerHTML = '⚠️ Error checking PIN code serviceability.';
  }
}

async function saveShippingSettings(e) {
  e.preventDefault();
  const shipping_fee = parseFloat(document.getElementById('settingShippingFee').value);
  const free_shipping_threshold = parseFloat(document.getElementById('settingFreeThreshold').value);

  try {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ shipping_fee, free_shipping_threshold })
    });
    const data = await res.json();
    if (data.success) {
      showToast('🎉 Shipping settings saved successfully!', 'success');
      localStorage.setItem('l2l_settings', JSON.stringify({ shipping_fee, free_shipping_threshold }));
      if (window.systemSettings) {
        window.systemSettings.shipping_fee = shipping_fee;
        window.systemSettings.free_shipping_threshold = free_shipping_threshold;
      }
    } else {
      showToast(data.message || 'Failed to save shipping settings', 'error');
    }
  } catch (err) {
    showToast('Error saving shipping settings', 'error');
  }
}

async function saveShiprocketSettings(e) {
  e.preventDefault();
  const email = document.getElementById('shiprocketEmail').value;
  const password = document.getElementById('shiprocketPassword').value;
  const pickup_location = document.getElementById('shiprocketPickup').value;

  try {
    showToast('Verifying connection with Shiprocket API...', 'info');
    const res = await fetch('/api/admin/shiprocket-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ email, password, pickup_location })
    });
    const data = await res.json();
    if (data.success) {
      showToast('🎉 Shiprocket Configured and Connected successfully!', 'success');
      document.getElementById('shiprocketPassword').value = ''; // clear input
      loadAdminShippingSettings();
    } else {
      showToast(data.message || 'Connection failed', 'error');
    }
  } catch (err) {
    showToast('Error saving Shiprocket settings', 'error');
  }
}

/* ==========================================================================
   10. EMAIL AUTOMATION & GMAIL NOTIFICATIONS
   ========================================================================== */
async function loadEmailSettings() {
  try {
    const res = await fetch('/api/admin/email-settings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      const emailInput = document.getElementById('settingSmtpEmail');
      const badge = document.getElementById('smtpPassStatusBadge');
      const activeEmail = data.smtp_email || (data.emailSettings && data.emailSettings.smtp_email);
      const isConfigured = data.is_configured || (data.emailSettings && data.emailSettings.hasPassword);
      if (emailInput && activeEmail) {
        emailInput.value = activeEmail;
      }
      if (badge) {
        if (isConfigured) {
          badge.innerHTML = '🟢 <span style="color:#16a34a; font-weight:700">Google App Password is configured & active.</span>';
        } else {
          badge.innerHTML = '🟡 <span style="color:#d97706; font-weight:700">Google App Password not configured yet. System running in safe simulated mode.</span>';
        }
      }
    }
  } catch (err) {
    console.error('Failed to load email settings:', err);
  }
}

async function saveEmailSettings(e) {
  e.preventDefault();
  const smtp_email = document.getElementById('settingSmtpEmail').value.trim();
  const smtp_password = document.getElementById('settingSmtpPassword').value.trim();

  try {
    showToast('Saving email credentials...', 'info');
    const res = await fetch('/api/admin/email-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ smtp_email, smtp_password })
    });
    const data = await res.json();
    if (data.success) {
      showToast('🎉 Email settings saved successfully!', 'success');
      document.getElementById('settingSmtpPassword').value = '';
      loadEmailSettings();
    } else {
      showToast(data.message || 'Failed to save email settings', 'error');
    }
  } catch (err) {
    showToast('Error saving email settings', 'error');
  }
}

async function sendTestEmail() {
  const recipientInput = document.getElementById('testEmailRecipient');
  const test_email = recipientInput ? recipientInput.value.trim() : '';
  if (!test_email || !test_email.includes('@')) {
    showToast('Please enter a valid recipient email address!', 'error');
    return;
  }

  showToast('Sending test email...', 'info');
  try {
    const res = await fetch('/api/admin/email-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ test_email })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || 'Test email sent successfully!', 'success');
    } else {
      showToast(data.message || 'Failed to send test email', 'error');
    }
  } catch (err) {
    showToast('Network error sending test email', 'error');
  }
}

async function broadcastPromotions() {
  const offer_title = document.getElementById('promoOfferTitle').value.trim();
  const discount_code = document.getElementById('promoDiscountCode').value.trim();
  const banner_message = document.getElementById('promoBannerMsg').value.trim();

  if (!confirm(`Are you sure you want to broadcast "${offer_title}" with coupon "${discount_code}" to all customer inboxes?`)) {
    return;
  }

  showToast('Broadcasting promotional offers to shoppers...', 'info');
  try {
    const res = await fetch('/api/admin/broadcast-promotions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: offer_title,
        subtitle: banner_message,
        coupon_code: discount_code,
        discount_text: banner_message
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`🎉 ${data.message}`, 'success');
    } else {
      showToast(data.message || 'Broadcast failed', 'error');
    }
  } catch (err) {
    showToast('Error broadcasting promotional campaign', 'error');
  }
}

async function handleAdminPasswordChange(e) {
  e.preventDefault();
  const oldPassword = document.getElementById('adminOldPassword').value;
  const newPassword = document.getElementById('adminNewPassword').value;
  const confirmPassword = document.getElementById('adminConfirmPassword').value;

  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match!', 'error');
    return;
  }

  try {
    const res = await fetch('/api/auth/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ oldPassword, newPassword })
    });
    
    const data = await res.json();
    if (data.success) {
      showToast('🎉 Admin password updated successfully!', 'success');
      document.getElementById('changePasswordForm').reset();
    } else {
      showToast(data.message || 'Failed to update password', 'error');
    }
  } catch (err) {
    showToast('Error updating password', 'error');
  }
}

// Generate banner/product image via Pollinations.ai API
function generateBannerImage(type) {
  let promptId, previewAreaId, previewImgId, targetInputId;
  
  if (type === 'hero') {
    promptId = 'heroAiPrompt';
    previewAreaId = 'heroAiPreviewArea';
    previewImgId = 'heroAiPreview';
    targetInputId = 'heroMediaUrlInput';
  } else if (type === 'promo') {
    promptId = 'promoAiPrompt';
    previewAreaId = 'promoAiPreviewArea';
    previewImgId = 'promoAiPreview';
    targetInputId = 'promoMediaUrl';
  } else if (type === 'product') {
    promptId = 'productAiPrompt';
    previewAreaId = 'productAiPreviewArea';
    previewImgId = 'productAiPreview';
    targetInputId = 'prodImageUrl';
  }

  const promptInput = document.getElementById(promptId);
  const prompt = promptInput ? promptInput.value.trim() : '';

  if (!prompt) {
    showToast('Please type a descriptive prompt first!', 'warning');
    return;
  }

  showToast('Generating AI Image... please wait a few seconds.', 'info');
  
  const previewArea = document.getElementById(previewAreaId);
  const previewImg = document.getElementById(previewImgId);
  const targetInput = document.getElementById(targetInputId);
  
  const seed = Math.floor(Math.random() * 1000000);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1080&nologo=true&seed=${seed}`;

  if (previewImg && previewArea) {
    previewImg.src = url;
    previewArea.style.display = 'block';
    
    // Assign instantly so the admin doesn't have to wait for preview download to click save
    if (targetInput) {
      targetInput.value = url;
      if (typeof updateProductVideoPhotoStatus === 'function') updateProductVideoPhotoStatus();
    }
    
    previewImg.onload = () => {
      showToast('🎉 AI Image successfully generated and applied!', 'success');
      if (typeof updateProductVideoPhotoStatus === 'function') updateProductVideoPhotoStatus();
    };
  }
}

// Helper: Detect active product photo from file input, URL input, AI preview, or existing gallery
async function getActiveProductPhoto() {
  const fileInput = document.getElementById('prodImages');
  if (fileInput && fileInput.files && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const dataUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => resolve(URL.createObjectURL(file));
      reader.readAsDataURL(file);
    });
    return {
      type: 'file',
      src: dataUrl,
      name: file.name
    };
  }

  const urlInput = document.getElementById('prodImageUrl');
  if (urlInput && urlInput.value && urlInput.value.trim() !== '') {
    return {
      type: 'url',
      src: urlInput.value.trim(),
      name: 'Pasted URL'
    };
  }

  const aiImg = document.getElementById('productAiPreview');
  if (aiImg && aiImg.src && aiImg.src.trim() !== '' && !aiImg.src.endsWith('/admin.html') && !aiImg.src.endsWith('/admin')) {
    return {
      type: 'ai',
      src: aiImg.src,
      name: 'AI Generated Image'
    };
  }

  if (typeof currentEditingProductPhotos !== 'undefined' && currentEditingProductPhotos.length > 0) {
    return {
      type: 'existing',
      src: currentEditingProductPhotos[0],
      name: 'Existing Product Photo'
    };
  }

  return null;
}

// Update the photo status indicator badge inside the video generator box
function updateProductVideoPhotoStatus() {
  const statusEl = document.getElementById('productVideoPhotoStatus');
  if (!statusEl) return;

  const fileInput = document.getElementById('prodImages');
  const urlInput = document.getElementById('prodImageUrl');
  const aiImg = document.getElementById('productAiPreview');
  const hasExisting = typeof currentEditingProductPhotos !== 'undefined' && currentEditingProductPhotos.length > 0;

  if (fileInput && fileInput.files && fileInput.files.length > 0) {
    statusEl.innerHTML = '<i class="fas fa-check-circle" style="color:#10b981"></i> Photo Ready (' + fileInput.files[0].name.substring(0, 18) + ')';
    statusEl.style.color = '#047857';
    statusEl.style.background = '#d1fae5';
  } else if (urlInput && urlInput.value && urlInput.value.trim() !== '') {
    statusEl.innerHTML = '<i class="fas fa-check-circle" style="color:#10b981"></i> Image URL Ready';
    statusEl.style.color = '#047857';
    statusEl.style.background = '#d1fae5';
  } else if (aiImg && aiImg.src && aiImg.src.trim() !== '' && !aiImg.src.endsWith('/admin.html') && !aiImg.src.endsWith('/admin')) {
    statusEl.innerHTML = '<i class="fas fa-check-circle" style="color:#10b981"></i> AI Image Ready';
    statusEl.style.color = '#047857';
    statusEl.style.background = '#d1fae5';
  } else if (hasExisting) {
    statusEl.innerHTML = '<i class="fas fa-check-circle" style="color:#10b981"></i> Product Photo Ready';
    statusEl.style.color = '#047857';
    statusEl.style.background = '#d1fae5';
  } else {
    statusEl.innerHTML = '<i class="fas fa-camera" style="color:#b45309"></i> Upload/Paste Photo Above First';
    statusEl.style.color = '#b45309';
    statusEl.style.background = '#fef3c7';
  }
}

// Generate Product Video DIRECTLY from the product's uploaded/entered photo
async function generateProductVideo() {
  const btn = document.getElementById('btnGenerateProductVideo');
  const styleSelect = document.getElementById('productVideoAiStyle');
  const previewArea = document.getElementById('productVideoAiPreviewArea');
  const previewVideo = document.getElementById('productVideoAiPreview');
  const targetInput = document.getElementById('prodVideoUrl');

  const photo = await getActiveProductPhoto();
  if (!photo) {
    showToast('⚠️ Pehle product ka photo upload karein ya paste karein, fir us photo se video banega!', 'warning');
    const fileInput = document.getElementById('prodImages');
    if (fileInput) {
      fileInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      fileInput.focus();
    }
    return;
  }

  const style = styleSelect ? styleSelect.value : 'zoom_pan';
  const prodName = document.getElementById('prodName')?.value?.trim() || 'Exclusive Fashion';
  const prodCat = document.getElementById('prodCategory')?.value?.trim() || '';
  const prodPrice = document.getElementById('prodPrice')?.value?.trim() || '';

  const originalBtnHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rendering Video from Photo...';
  }

  showToast('🎬 Aapke product photo se video ban raha hai... 3-4 seconds wait karein.', 'info');

  try {
    const videoUrl = await generateCanvasMotionReel(photo.src, prodName, style, {
      category: prodCat,
      price: prodPrice
    });

    if (!videoUrl) {
      throw new Error('Video generation failed to return a valid URL');
    }

    // Set video URL in input field & state
    if (targetInput) targetInput.value = videoUrl;
    currentEditingProductVideo = videoUrl;

    // Show preview player
    if (previewVideo && previewArea) {
      previewVideo.src = formatLocalPath(videoUrl);
      previewArea.style.display = 'block';
      previewVideo.load();
      previewVideo.play().catch(() => {});
    }

    // Update media delete preview gallery
    renderProductMediaDeletePreview(currentEditingProductPhotos, currentEditingProductVideo);

    showToast('🎉 Product photo se video successfully ban gaya!', 'success');
  } catch (err) {
    console.error('Photo-to-video generation error:', err);
    showToast(`Failed to generate video: ${err.message || 'Please verify image'}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml || '<i class="fas fa-magic"></i> Generate Video from Photo';
    }
  }
}

// Render dynamic animated video from exact image using HTML5 Canvas & MediaRecorder
async function generateCanvasMotionReel(imgSrc, titleText, style, meta = {}) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas context unavailable'));

    const img = new Image();
    const isRemote = typeof imgSrc === 'string' && (imgSrc.startsWith('http://') || imgSrc.startsWith('https://'));
    if (isRemote) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = async () => {
      try {
        const stream = canvas.captureStream(30);
        let mime = 'video/webm;codecs=vp9';
        if (typeof MediaRecorder.isTypeSupported === 'function') {
          if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) mime = 'video/webm;codecs=vp9';
          else if (MediaRecorder.isTypeSupported('video/webm')) mime = 'video/webm';
          else if (MediaRecorder.isTypeSupported('video/mp4')) mime = 'video/mp4';
          else mime = '';
        }

        let recorder;
        try {
          recorder = mime ? new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2500000 }) : new MediaRecorder(stream);
        } catch (recErr) {
          try {
            recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
          } catch (recErr2) {
            recorder = new MediaRecorder(stream);
          }
        }

        const chunks = [];
        recorder.ondataavailable = e => { if (e.data && e.data.size > 0) chunks.push(e.data); };

        recorder.onstop = async () => {
          try {
            const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });

            // Upload directly to Cloudinary using signature endpoint
            try {
              const signRes = await fetch('/api/admin/cloudinary-sign', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const signData = await signRes.json();

              if (signData && signData.success) {
                const formData = new FormData();
                formData.append('file', blob, 'product-video.webm');
                formData.append('api_key', signData.api_key);
                formData.append('timestamp', signData.timestamp);
                formData.append('signature', signData.signature);
                formData.append('folder', signData.folder);

                const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloud_name}/video/upload`, {
                  method: 'POST',
                  body: formData
                });
                const uploadData = await uploadRes.json();

                if (uploadData && uploadData.secure_url) {
                  return resolve(uploadData.secure_url);
                }
              }
            } catch (cloudErr) {
              console.warn('Cloudinary upload fallback to local Blob:', cloudErr);
            }

            // Fallback to local Blob URL so video always works
            resolve(URL.createObjectURL(blob));
          } catch (e) {
            console.warn('Video blob fallback:', e);
            resolve(URL.createObjectURL(new Blob(chunks, { type: 'video/webm' })));
          }
        };

        recorder.start();

        const duration = 3500; // 3.5 seconds
        const startTime = performance.now();

        function renderFrame(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // 1. Draw luxury studio gradient background
          const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
          bgGrad.addColorStop(0, '#0f172a');
          bgGrad.addColorStop(0.5, '#1e1b4b');
          bgGrad.addColorStop(1, '#090d16');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // 2. Draw ambient blurred photo background for seamless immersion
          ctx.save();
          try {
            ctx.filter = 'blur(35px) brightness(0.6)';
          } catch (filterErr) {}
          const imgAspect = img.width / img.height;
          const canAspect = canvas.width / canvas.height;
          let bgW, bgH;
          if (imgAspect > canAspect) {
            bgH = canvas.height;
            bgW = bgH * imgAspect;
          } else {
            bgW = canvas.width;
            bgH = bgW / imgAspect;
          }
          ctx.drawImage(img, (canvas.width - bgW) / 2, (canvas.height - bgH) / 2, bgW, bgH);
          ctx.restore();

          // 3. Motion calculation based on selected style
          let scale = 1.0;
          let panX = 0;
          let panY = 0;
          let tilt = 0;

          if (style === 'turntable_3d') {
            scale = 1.02 + 0.06 * Math.sin(progress * Math.PI);
            panX = Math.sin(progress * Math.PI * 2) * 14;
            panY = Math.cos(progress * Math.PI * 2) * 8;
            tilt = Math.sin(progress * Math.PI * 2) * 0.02;
          } else if (style === 'spotlight_sheen') {
            scale = 1.0 + progress * 0.12;
            panY = -progress * 25;
          } else if (style === 'story_reel') {
            scale = 1.02 + progress * 0.16;
            panY = -progress * 30;
          } else {
            // Default: zoom_pan (Cinematic Zoom & Pan)
            scale = 1.0 + progress * 0.22;
            panY = -progress * 45;
          }

          // 4. Draw crisp foreground garment photo with drop shadow
          ctx.save();
          ctx.translate(canvas.width / 2 + panX, canvas.height / 2 - 40 + panY);
          ctx.rotate(tilt);
          ctx.scale(scale, scale);

          // Calculate fitted image dimensions
          let fgW, fgH;
          const maxW = canvas.width * 0.88;
          const maxH = canvas.height * 0.72;

          if (img.width / maxW > img.height / maxH) {
            fgW = maxW;
            fgH = maxW / imgAspect;
          } else {
            fgH = maxH;
            fgW = maxH * imgAspect;
          }

          ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
          ctx.shadowBlur = 28;
          ctx.shadowOffsetY = 14;

          ctx.drawImage(img, -fgW / 2, -fgH / 2, fgW, fgH);
          ctx.restore();

          // 5. Studio light shimmer / spotlight sweep
          if (style === 'spotlight_sheen') {
            const spotY = 250 + progress * (canvas.height - 400);
            const spotGrad = ctx.createRadialGradient(canvas.width / 2, spotY, 30, canvas.width / 2, spotY, 260);
            spotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
            spotGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.08)');
            spotGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = spotGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else {
            const shimmerX = (progress * 2.2 - 0.6) * canvas.width;
            const shimGrad = ctx.createLinearGradient(shimmerX - 120, 0, shimmerX + 120, canvas.height);
            shimGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            shimGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.16)');
            shimGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = shimGrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // 6. Top branding header
          const topGrad = ctx.createLinearGradient(0, 0, 0, 160);
          topGrad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
          topGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
          ctx.fillStyle = topGrad;
          ctx.fillRect(0, 0, canvas.width, 160);

          ctx.textAlign = 'center';
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 20px "Outfit", sans-serif';
          ctx.fillText('L I T T L E   T O   L A R G E', canvas.width / 2, 60);

          ctx.fillStyle = '#c4b5fd';
          ctx.font = '600 12px "Outfit", sans-serif';
          ctx.fillText('PREMIUM FASHION SHOWCASE', canvas.width / 2, 85);

          // 7. Bottom product information vignette & card
          const botGrad = ctx.createLinearGradient(0, canvas.height - 280, 0, canvas.height);
          botGrad.addColorStop(0, 'rgba(15, 23, 42, 0)');
          botGrad.addColorStop(0.4, 'rgba(15, 23, 42, 0.82)');
          botGrad.addColorStop(1, 'rgba(10, 15, 26, 0.96)');
          ctx.fillStyle = botGrad;
          ctx.fillRect(0, canvas.height - 280, canvas.width, 280);

          // Product Title
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 26px "Outfit", sans-serif';
          const cleanTitle = (titleText || 'Exclusive Apparel').length > 28 ? 
                             (titleText || '').substring(0, 26) + '...' : 
                             (titleText || 'Exclusive Apparel');
          ctx.fillText(cleanTitle, canvas.width / 2, canvas.height - 140);

          // Product Subtitle / Category & Price
          const priceText = meta.price ? '₹' + meta.price : '';
          const catText = meta.category ? meta.category.toUpperCase() : 'EXCLUSIVE COLLECTION';
          const subText = priceText ? `${catText}  •  ${priceText}` : catText;

          ctx.fillStyle = '#cbd5e1';
          ctx.font = '600 15px "Outfit", sans-serif';
          ctx.fillText(subText, canvas.width / 2, canvas.height - 105);

          // Animated badge pill at bottom
          ctx.fillStyle = '#7c3aed';
          const badgeW = 200;
          const badgeH = 30;
          const badgeX = (canvas.width - badgeW) / 2;
          const badgeY = canvas.height - 70;
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 15);
          } else {
            ctx.rect(badgeX, badgeY, badgeW, badgeH);
          }
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px "Outfit", sans-serif';
          ctx.fillText('✦ 100% ORIGINAL QUALITY ✦', canvas.width / 2, badgeY + 19);

          if (progress < 1) {
            requestAnimationFrame(renderFrame);
          } else {
            recorder.stop();
          }
        }

        requestAnimationFrame(renderFrame);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (e) => {
      console.error('Product photo load failed for video generation:', e, imgSrc);
      reject(new Error('Product photo failed to load. Please verify the image file.'));
    };
    img.src = (imgSrc && (imgSrc.startsWith('data:') || imgSrc.startsWith('blob:'))) ? imgSrc : formatLocalPath(imgSrc);
  });
}

// Danger: Reset all sales, orders, reviews, inquiries, and customer accounts (except admin)
async function triggerCompleteStoreReset() {
  const confirm1 = confirm("⚠️ DANGER: Are you absolutely sure you want to delete all orders, transaction history, wishlist items, support inquiries, and customer accounts? This will reset all analytics charts to 0!");
  if (!confirm1) return;

  const confirm2 = prompt("To verify, please type 'RESET ALL DATA' in all caps:");
  if (confirm2 !== 'RESET ALL DATA') {
    showToast('Reset cancelled. Verification text did not match.', 'warning');
    return;
  }

  showToast('Cleaning up database tables...', 'info');

  try {
    const res = await fetch('/api/admin/reset-all-data', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (data.success) {
      showToast('🎉 ' + data.message, 'success');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      showToast(data.message || 'Reset failed', 'error');
    }
  } catch (err) {
    showToast('Failed to connect to reset API', 'error');
  }
}

// Phase 4: AI Merchant Intelligence Logic
async function loadIntelligenceReport() {
  const container = document.getElementById('intelligenceReportContainer');
  const btn = document.getElementById('btnRunIntelligence');
  
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing Store Data...';
  container.innerHTML = '<div style="text-align:center; padding:3rem 0; color:var(--text-light)"><i class="fas fa-spinner fa-spin" style="font-size:3rem; margin-bottom:1rem;"></i><h3>AI is analyzing sales, predicting trends, and formatting pricing insights...</h3></div>';

  try {
    const res = await fetch('/api/admin/intelligence', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    const data = await res.json();
    if (data.success) {
      container.innerHTML = data.report;
      showToast('Intelligence Report Generated!');
    } else {
      container.innerHTML = `<div style="color:var(--danger); text-align:center;">Failed to generate report: ${data.message}</div>`;
      showToast(data.message, 'error');
    }
  } catch (err) {
    container.innerHTML = `<div style="color:var(--danger); text-align:center;">Error communicating with AI Merchant system.</div>`;
    showToast('Error fetching report', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-bolt"></i> Run AI Analysis';
  }
}

/* ==========================================================================
   CAREERS & INTERNSHIP MANAGEMENT CONTROLLER
   ========================================================================== */
let adminCareersList = [];

async function loadAdminCareers() {
  try {
    const res = await fetch('/api/admin/careers', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      adminCareersList = data.careers || [];
      renderAdminCareersTable(adminCareersList);
    }
  } catch (err) {
    showToast('Failed to load career listings', 'error');
  }
}

function renderAdminCareersTable(careers) {
  const tbody = document.getElementById('adminCareersTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (careers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:#64748b;">No active or archived careers found.</td></tr>';
    return;
  }
  careers.forEach(c => {
    const statusBadge = c.status === 'open' 
      ? '<span style="background:#dcfce7; color:#166534; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700;">Open</span>'
      : '<span style="background:#f1f5f9; color:#64748b; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700;">Closed</span>';
    
    tbody.innerHTML += `
      <tr>
        <td>
          <div style="font-weight:700; color:var(--primary);">${escapeHTML(c.title)}</div>
          <div style="font-size:0.8rem; color:#64748b;">${escapeHTML(c.role)}</div>
        </td>
        <td>
          <div style="font-weight:600;">${escapeHTML(c.department || 'Fashion')}</div>
          <div style="font-size:0.8rem; color:var(--primary); font-weight:700;">${escapeHTML(c.employment_type || 'Full-time')}</div>
        </td>
        <td>
          <div style="font-size:0.85rem;">${escapeHTML(c.location || 'Gandhidham / Hybrid')}</div>
          <div style="font-size:0.8rem; color:#16a34a; font-weight:700;">${escapeHTML(c.stipend_or_salary || 'Competitive')}</div>
        </td>
        <td>
          <div style="font-size:0.85rem; font-weight:600;">${escapeHTML(c.timeline_deadline || 'Open Until Filled')}</div>
          <small style="color:#64748b;">${escapeHTML(c.experience || '0-2 Yrs')}</small>
        </td>
        <td>${statusBadge}</td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn" onclick="openEditCareerForm(${c.id})" style="padding:0.3rem 0.6rem; font-size:0.75rem; background:#f1f5f9; color:var(--primary);" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="btn" onclick="deleteCareer(${c.id})" style="padding:0.3rem 0.6rem; font-size:0.75rem; background:#fee2e2; color:#b91c1c;" title="Delete"><i class="fas fa-trash-alt"></i></button>
          </div>
        </td>
      </tr>
    `;
  });
}

function openNewCareerForm() {
  document.getElementById('careerEditId').value = '';
  document.getElementById('careerFormTitle').textContent = 'Post New Opportunity';
  document.getElementById('adminCareerForm').reset();
  document.getElementById('careerStatus').value = 'open';
  document.getElementById('careerFormCard').style.display = 'block';
  document.getElementById('careerTitle').focus();
}

function openEditCareerForm(id) {
  const c = adminCareersList.find(item => item.id === id);
  if (!c) return;
  document.getElementById('careerEditId').value = c.id;
  document.getElementById('careerFormTitle').textContent = `Edit Opportunity: ${c.title}`;
  document.getElementById('careerTitle').value = c.title;
  document.getElementById('careerRole').value = c.role;
  document.getElementById('careerDept').value = c.department || 'Fashion & Design';
  document.getElementById('careerType').value = c.employment_type || 'Full-time';
  document.getElementById('careerLocation').value = c.location || '';
  document.getElementById('careerExperience').value = c.experience || '';
  document.getElementById('careerSalary').value = c.stipend_or_salary || '';
  document.getElementById('careerDeadline').value = c.timeline_deadline || '';
  document.getElementById('careerStatus').value = c.status || 'open';
  document.getElementById('careerRequirements').value = c.requirements || '';
  document.getElementById('careerDescription').value = c.description || '';
  document.getElementById('careerFormCard').style.display = 'block';
  document.getElementById('careerFormCard').scrollIntoView({ behavior: 'smooth' });
}

function closeCareerForm() {
  document.getElementById('careerFormCard').style.display = 'none';
  document.getElementById('adminCareerForm').reset();
}

async function handleCareerFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('careerEditId').value;
  const payload = {
    title: document.getElementById('careerTitle').value.trim(),
    role: document.getElementById('careerRole').value.trim(),
    department: document.getElementById('careerDept').value,
    employment_type: document.getElementById('careerType').value,
    location: document.getElementById('careerLocation').value.trim(),
    experience: document.getElementById('careerExperience').value.trim(),
    stipend_or_salary: document.getElementById('careerSalary').value.trim(),
    timeline_deadline: document.getElementById('careerDeadline').value,
    status: document.getElementById('careerStatus').value,
    requirements: document.getElementById('careerRequirements').value.trim(),
    description: document.getElementById('careerDescription').value.trim()
  };

  const btn = document.getElementById('btnSaveCareer');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

  try {
    const url = id ? `/api/admin/careers/${id}` : '/api/admin/careers';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast(id ? 'Career opportunity updated!' : 'Career opportunity posted!', 'success');
      closeCareerForm();
      loadAdminCareers();
    } else {
      showToast(data.message || 'Operation failed', 'error');
    }
  } catch (err) {
    showToast('Failed to save career opportunity', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Save Opportunity';
  }
}

async function deleteCareer(id) {
  if (!confirm('Are you sure you want to delete this career listing?')) return;
  try {
    const res = await fetch(`/api/admin/careers/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Career opening deleted', 'success');
      loadAdminCareers();
    } else {
      showToast(data.message || 'Failed to delete', 'error');
    }
  } catch (err) {
    showToast('Failed to delete career', 'error');
  }
}

async function loadCareerApplications() {
  try {
    const res = await fetch('/api/admin/career-applications', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      renderAdminApplicationsTable(data.applications || []);
    }
  } catch (err) {
    console.warn('Failed to load applications:', err.message);
  }
}

function renderAdminApplicationsTable(apps) {
  const tbody = document.getElementById('adminApplicationsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (apps.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:#64748b;">No applications submitted yet.</td></tr>';
    return;
  }
  apps.forEach(a => {
    const link = a.portfolio_or_resume_url 
      ? `<a href="${escapeHTML(a.portfolio_or_resume_url)}" target="_blank" style="color:var(--primary); font-weight:600;"><i class="fas fa-external-link-alt"></i> View Link</a>`
      : '<span style="color:#94a3b8;">None</span>';
    tbody.innerHTML += `
      <tr>
        <td style="font-weight:700; color:#1e293b;">${escapeHTML(a.applicant_name)}</td>
        <td>
          <div style="font-weight:600; color:var(--primary);">${escapeHTML(a.job_title || 'General Influx')}</div>
          <small style="color:#64748b;">${escapeHTML(a.job_role || '')}</small>
        </td>
        <td>
          <div><a href="mailto:${escapeHTML(a.email)}" style="color:#2563eb;">${escapeHTML(a.email)}</a></div>
          <div style="font-size:0.8rem; color:#64748b;"><i class="fas fa-phone-alt"></i> ${escapeHTML(a.phone)}</div>
        </td>
        <td>${link}</td>
        <td style="font-size:0.8rem; max-width:260px; color:#475569;">${escapeHTML(a.cover_note || '-')}</td>
        <td style="font-size:0.8rem; color:#64748b;">${new Date(a.created_at).toLocaleDateString('en-IN')}</td>
      </tr>
    `;
  });
}

/* ==========================================================================
   MODE B: AI-ASSISTED PRODUCT CREATION CONTROLLER
   ========================================================================== */
let aiStudioSelectedFiles = [];

function handleAiStudioFiles(e) {
  const files = Array.from(e.target.files);
  if (!files || files.length === 0) return;
  aiStudioSelectedFiles = files.slice(0, 3);
  renderAiStudioUploadPreviews();
}

function renderAiStudioUploadPreviews() {
  const container = document.getElementById('aiStudioUploadPreviews');
  if (!container) return;
  container.innerHTML = '';
  if (aiStudioSelectedFiles.length === 0) {
    container.innerHTML = '<span style="font-size:0.8rem; color:#94a3b8; font-style:italic;">No photos uploaded yet. Select 1 to 3 images to begin.</span>';
    return;
  }
  aiStudioSelectedFiles.forEach((file, idx) => {
    const url = URL.createObjectURL(file);
    container.innerHTML += `
      <div style="position:relative; width:80px; height:80px; border-radius:8px; overflow:hidden; border:2px solid var(--primary); box-shadow:var(--shadow-sm);">
        <img src="${url}" style="width:100%; height:100%; object-fit:cover;">
        <span style="position:absolute; top:2px; left:2px; background:var(--primary); color:#fff; font-size:0.65rem; padding:1px 4px; border-radius:4px; font-weight:700;">#${idx+1}</span>
        <button type="button" onclick="removeAiStudioFile(${idx})" style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.6); color:#fff; border:none; border-radius:50%; width:16px; height:16px; font-size:9px; cursor:pointer; display:flex; align-items:center; justify-content:center;">&times;</button>
      </div>
    `;
  });
}

function removeAiStudioFile(idx) {
  aiStudioSelectedFiles.splice(idx, 1);
  renderAiStudioUploadPreviews();
}

async function runAiProductAnalysis() {
  if (aiStudioSelectedFiles.length === 0) {
    showToast('Please select at least 1 product photograph', 'warning');
    return;
  }

  const btn = document.getElementById('btnRunAiAnalysis');
  const status = document.getElementById('aiStudioLoadingStatus');
  btn.disabled = true;
  status.style.display = 'block';

  try {
    const formData = new FormData();
    aiStudioSelectedFiles.forEach(file => {
      formData.append('images', file);
    });

    const res = await fetch('/api/admin/ai/analyze-images', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();

    if (data.success) {
      showToast('AI analysis completed!', 'success');
      populateAiReviewScreen(data);
    } else {
      showToast(data.message || 'Analysis failed', 'error');
    }
  } catch (err) {
    showToast('Failed to run AI analysis: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    status.style.display = 'none';
  }
}

function populateAiReviewScreen(data) {
  const container = document.getElementById('aiStudioReviewContainer');
  if (!container) return;
  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth' });

  const aiSug = data.ai_suggestions || {};
  const obsVis = data.observed_visuals || {};

  // 1. Observed Colors
  const colorsBox = document.getElementById('aiReviewColors');
  if (colorsBox) {
    colorsBox.innerHTML = '';
    const colors = data.observed_colors || obsVis.dominant_colors || ['Multicolor'];
    colors.forEach(c => {
      colorsBox.innerHTML += `<span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:12px; font-size:0.75rem; font-weight:700;">${escapeHTML(c)}</span>`;
    });
  }

  // 2. Pattern
  const patBox = document.getElementById('aiReviewPattern');
  if (patBox) patBox.textContent = data.pattern_and_craft || obsVis.detected_pattern || 'Printed Ethnic';

  // 3. Occasions
  const occBox = document.getElementById('aiReviewOccasions');
  const occs = data.occasions || aiSug.occasions || ['Festive', 'Traditional'];
  if (occBox) occBox.textContent = Array.isArray(occs) ? occs.join(', ') : occs;

  // 4. Pairings
  const pairBox = document.getElementById('aiReviewPairings');
  const pairs = data.suggested_outfit_pairings || ['Mojaris', 'Earrings', 'Potli Bag'];
  if (pairBox) pairBox.textContent = Array.isArray(pairs) ? pairs.join(' • ') : pairs;

  // 5. Pre-fill form
  const title = data.title_suggestion || aiSug.title || 'Handcrafted Festive Ethnic Kurta & Outfit';
  const cat = data.category || aiSug.category || 'Women';
  const subcat = data.subcategory || aiSug.subcategory || 'Ethnic Wear';
  const desc = data.detailed_description || aiSug.detailed_description || data.short_description || aiSug.short_description || 'Exquisite handcrafted Indian ethnic outfit crafted for festive celebrations and family gatherings.';
  const seo = data.seo_title || aiSug.seo_title || (title + ' | Little to Large');
  const kw = data.search_keywords || aiSug.search_keywords || 'ethnic wear, festive kurta, indian family clothes';

  document.getElementById('aiProdName').value = title;
  document.getElementById('aiProdCategory').value = cat;
  document.getElementById('aiProdSubcategory').value = subcat;
  document.getElementById('aiProdDesc').value = desc;
  document.getElementById('aiProdSeoTitle').value = seo;
  document.getElementById('aiProdKeywords').value = Array.isArray(kw) ? kw.join(', ') : kw;

  // Sensible pricing defaults to avoid blank numbers (Administrator must confirm!)
  document.getElementById('aiProdMrp').value = 2499;
  document.getElementById('aiProdPrice').value = 1199;
  document.getElementById('aiProdStock').value = 35;
  document.getElementById('aiProdSizes').value = 'S, M, L, XL, XXL';
  document.getElementById('aiProdReturnWindow').value = 7;
  calculateAiDiscount();

  // Assets grid
  const assetsGrid = document.getElementById('aiStudioAssetsGrid');
  const uploadedUrls = data.uploaded_image_urls || [];
  document.getElementById('aiProdImagesJson').value = JSON.stringify(uploadedUrls);
  
  if (assetsGrid) {
    assetsGrid.innerHTML = '';
    uploadedUrls.forEach((u, i) => {
      assetsGrid.innerHTML += `
        <div style="flex-shrink:0; text-align:center;">
          <img src="${u}" style="width:100px; height:100px; object-fit:cover; border-radius:8px; border:2px solid #cbd5e1;">
          <div style="font-size:0.7rem; color:#64748b; margin-top:2px;">Photo #${i+1}</div>
        </div>
      `;
    });
  }
}

function calculateAiDiscount() {
  const mrp = parseFloat(document.getElementById('aiProdMrp').value) || 0;
  const selling = parseFloat(document.getElementById('aiProdPrice').value) || 0;
  const badge = document.getElementById('aiDiscountBadge');
  if (!badge) return;
  if (mrp > 0 && selling > 0 && mrp >= selling) {
    const pct = Math.round(((mrp - selling) / mrp) * 100);
    badge.textContent = `Discount: ${pct}% OFF`;
    badge.style.color = '#16a34a';
  } else if (selling > mrp) {
    badge.textContent = '⚠️ Selling price is higher than MRP!';
    badge.style.color = '#dc2626';
  } else {
    badge.textContent = 'Discount: --%';
  }
}

async function saveAiProductDraft() {
  document.getElementById('aiProdStock').value = 0;
  await submitAiProductForm(true);
}

async function handleAiProductPublish(e) {
  e.preventDefault();
  await submitAiProductForm(false);
}

async function submitAiProductForm(isDraft) {
  const btn = document.getElementById('btnPublishAiProduct');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
  }

  try {
    const name = document.getElementById('aiProdName').value.trim();
    const category = document.getElementById('aiProdCategory').value;
    const subcategory = document.getElementById('aiProdSubcategory').value.trim();
    const price = parseFloat(document.getElementById('aiProdMrp').value);
    const discount_price = parseFloat(document.getElementById('aiProdPrice').value);
    const stock = parseInt(document.getElementById('aiProdStock').value);
    const size_variants = document.getElementById('aiProdSizes').value.trim();
    const return_window_days = parseInt(document.getElementById('aiProdReturnWindow').value) || 7;
    const description = document.getElementById('aiProdDesc').value.trim();
    const imageUrls = document.getElementById('aiProdImagesJson').value || '[]';
    const videoUrl = document.getElementById('aiProdVideoUrl').value || '';

    const payload = {
      name,
      category,
      subcategory,
      price,
      discount_price,
      stock,
      size_variants,
      return_window_days,
      description,
      image_urls: imageUrls,
      video_url: videoUrl
    };

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    let data;
    const resText = await res.text();
    try {
      data = JSON.parse(resText);
    } catch (e) {
      throw new Error(`Server returned status ${res.status}: ${resText.slice(0, 100)}`);
    }

    if (data.success) {
      showToast(isDraft ? 'Draft product saved!' : '🎉 Product published to catalog!', 'success');
      showSection('productsSection');
      loadAdminProducts();
    } else {
      showToast(data.message || 'Failed to save product', 'error');
    }
  } catch (err) {
    showToast('Failed to save product: ' + err.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-check-circle"></i> Approve & Publish to Store Catalog';
    }
  }
}

/* ==========================================================================
   ADMIN AI ASSISTANTS CONTROLLER
   ========================================================================== */
async function handleMarketingAssistantSubmit(e) {
  e.preventDefault();
  const theme = document.getElementById('mktTheme').value;
  const target = document.getElementById('mktTarget').value;
  const offer = document.getElementById('mktOffer').value;
  const btn = document.getElementById('btnGenMarketing');

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Campaign...';

  try {
    const res = await fetch('/api/admin/ai/assistant/marketing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ theme, target_category: target, offer })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('mktCampaignHeadline').textContent = data.campaign_name || 'Festive Launch';
      document.getElementById('mktCaptionText').textContent = data.instagram_caption || data.social_caption || '';
      document.getElementById('mktResultBox').style.display = 'block';
      showToast('Campaign copy generated!', 'success');
    } else {
      showToast(data.message || 'Generation failed', 'error');
    }
  } catch (err) {
    showToast('Failed to generate marketing copy', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate Campaign Drafts';
  }
}

function copyMktCaption() {
  const text = document.getElementById('mktCaptionText').textContent;
  navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard!', 'success'));
}

async function handleSupportAssistantSubmit(e) {
  e.preventDefault();
  const customer = document.getElementById('suppCustomer').value;
  const subject = document.getElementById('suppSubject').value;
  const message = document.getElementById('suppMessage').value;
  const btn = document.getElementById('btnGenSupport');

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Drafting Reply...';

  try {
    const res = await fetch('/api/admin/ai/assistant/support-reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ customer, subject, message })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('suppDraftArea').value = data.draft_reply || '';
      document.getElementById('suppResultBox').style.display = 'block';
      showToast('Support reply drafted!', 'success');
    } else {
      showToast(data.message || 'Drafting failed', 'error');
    }
  } catch (err) {
    showToast('Failed to draft support reply', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-envelope-open-text"></i> Draft Official Reply';
  }
}

function copySupportDraft() {
  const text = document.getElementById('suppDraftArea').value;
  navigator.clipboard.writeText(text).then(() => showToast('Draft copied!', 'success'));
}

/* ==========================================================================
   IMAGE & VIDEO STUDIO CONTROLLER
   ========================================================================== */
let studioCleanCustomFile = null;

function populateStudioMediaDropdowns() {
  const cleanSelect = document.getElementById('studioCleanImageSelect');
  const vidSelect = document.getElementById('studioVideoProductSelect');
  if (!allProducts || allProducts.length === 0) return;

  if (cleanSelect) {
    cleanSelect.innerHTML = '<option value="">-- Choose from Catalog Product Photos --</option>';
    allProducts.forEach(p => {
      let urls = [];
      try { urls = JSON.parse(p.image_urls || '[]'); } catch (e) {}
      if (urls.length > 0) {
        cleanSelect.innerHTML += `<option value="${urls[0]}">${escapeHTML(p.name)} (${urls[0]})</option>`;
      }
    });
  }

  if (vidSelect) {
    vidSelect.innerHTML = '<option value="">-- Choose Product for Video --</option>';
    allProducts.forEach(p => {
      vidSelect.innerHTML += `<option value="${p.id}">${escapeHTML(p.name)} - ₹${p.discount_price || p.price}</option>`;
    });
  }
}

function updateStudioCleanSource(val) {
  if (val) {
    studioCleanCustomFile = null;
    const fileInput = document.getElementById('studioCleanFileInput');
    if (fileInput) fileInput.value = '';
  }
}

function handleStudioCleanFileUpload(e) {
  if (e.target.files && e.target.files[0]) {
    studioCleanCustomFile = e.target.files[0];
    const select = document.getElementById('studioCleanImageSelect');
    if (select) select.value = '';
  }
}

async function runStudioClean() {
  const btn = document.getElementById('btnRunStudioClean');
  const preset = document.getElementById('studioCanvasPreset').value;
  let imageSource = null;

  if (studioCleanCustomFile) {
    imageSource = studioCleanCustomFile;
  } else {
    imageSource = document.getElementById('studioCleanImageSelect').value;
  }

  if (!imageSource) {
    showToast('Please select or upload a product image first', 'warning');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cleaning Canvas...';

  try {
    let res;
    if (studioCleanCustomFile) {
      const fd = new FormData();
      fd.append('image', studioCleanCustomFile);
      fd.append('preset', preset);
      res = await fetch('/api/admin/ai/studio-clean', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
    } else {
      res = await fetch('/api/admin/ai/studio-clean', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ image_path: imageSource, preset })
      });
    }

    const data = await res.json();
    if (data.success && data.cleaned_image_url) {
      document.getElementById('studioCleanResultImg').src = data.cleaned_image_url + '?t=' + Date.now();
      document.getElementById('studioCleanDownloadLink').href = data.cleaned_image_url;
      document.getElementById('studioCleanPreviewBox').style.display = 'block';
      showToast('Studio canvas cleaned successfully!', 'success');
    } else {
      showToast(data.message || 'Clean failed', 'error');
    }
  } catch (err) {
    showToast('Failed to clean image: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-magic"></i> Clean onto Studio Canvas';
  }
}

function updateStudioVideoFields(prodId) {
  const p = allProducts.find(item => item.id == prodId);
  if (!p) return;
  document.getElementById('studioVideoHeadline').value = p.name;
  if (p.price && p.discount_price && p.price > p.discount_price) {
    const pct = Math.round(((p.price - p.discount_price) / p.price) * 100);
    document.getElementById('studioVideoDiscount').value = `Special ${pct}% OFF • ₹${p.discount_price}`;
  } else {
    document.getElementById('studioVideoDiscount').value = `Special ₹${p.discount_price || p.price}`;
  }
}

async function runStudioVideo() {
  const prodId = document.getElementById('studioVideoProductSelect').value;
  const p = allProducts.find(item => item.id == prodId);
  if (!p) {
    showToast('Please select a product from the catalog', 'warning');
    return;
  }

  let urls = [];
  try { urls = JSON.parse(p.image_urls || '[]'); } catch (e) {}
  if (urls.length === 0) {
    showToast('Selected product has no images to compose video', 'warning');
    return;
  }

  const btn = document.getElementById('btnRunStudioVideo');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rendering 10s Promo Video...';

  try {
    const headline = document.getElementById('studioVideoHeadline').value;
    const discount = document.getElementById('studioVideoDiscount').value;

    const res = await fetch('/api/admin/ai/create-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        product_id: p.id,
        image_path: urls[0],
        headline,
        price_text: `₹${p.discount_price || p.price}`,
        discount_text: discount
      })
    });
    const data = await res.json();
    if (data.success && data.video_url) {
      document.getElementById('studioVideoResultAsset').src = data.video_url + '?t=' + Date.now();
      document.getElementById('studioVideoDownloadLink').href = data.video_url;
      document.getElementById('studioVideoPreviewBox').style.display = 'block';
      showToast('10-second promo video generated!', 'success');
    } else {
      showToast(data.message || 'Video composition failed', 'error');
    }
  } catch (err) {
    showToast('Failed to compose video: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-play-circle"></i> Render 10-Second Promo Video';
  }
}

async function runStudioConcepts() {
  const cleanSelect = document.getElementById('studioCleanImageSelect');
  let imageSource = cleanSelect ? cleanSelect.value : null;
  if (!imageSource && allProducts.length > 0) {
    let urls = [];
    try { urls = JSON.parse(allProducts[0].image_urls || '[]'); } catch (e) {}
    if (urls.length > 0) imageSource = urls[0];
  }

  if (!imageSource) {
    showToast('Please select a product photo from the studio selector above', 'warning');
    return;
  }

  const btn = document.getElementById('btnRunStudioConcepts');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating 5 Concept Variations...';

  try {
    const res = await fetch('/api/admin/ai/studio-concepts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ image_path: imageSource })
    });
    const data = await res.json();
    if (data.success && data.concepts) {
      renderStudioConcepts(data.concepts);
      showToast('5 Concept variations generated!', 'success');
    } else {
      showToast(data.message || 'Concepts generation failed', 'error');
    }
  } catch (err) {
    showToast('Failed to generate concepts: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-images"></i> Generate 5 Concepts for Selected Image';
  }
}

function renderStudioConcepts(concepts) {
  const grid = document.getElementById('studioConceptsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  concepts.forEach(c => {
    grid.innerHTML += `
      <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; overflow:hidden; box-shadow:var(--shadow-sm); display:flex; flex-direction:column;">
        <div style="position:relative; width:100%; height:220px; background:#000;">
          <img src="${c.concept_url}?t=${Date.now()}" alt="${escapeHTML(c.concept_title)}" style="width:100%; height:100%; object-fit:contain;">
          <span style="position:absolute; bottom:6px; left:6px; right:6px; background:rgba(0,0,0,0.7); color:#fef08a; font-size:0.65rem; padding:2px 6px; border-radius:4px; text-align:center; font-weight:600;">
            ${escapeHTML(c.watermark)}
          </span>
        </div>
        <div style="padding:0.8rem; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="font-weight:700; font-size:0.85rem; color:var(--primary);">${escapeHTML(c.concept_title)}</div>
            <div style="font-size:0.75rem; color:#64748b; margin-top:2px;">${escapeHTML(c.angle_or_pose)}</div>
          </div>
          <div style="margin-top:8px;">
            <a href="${c.concept_url}" download="concept.webp" class="btn" style="padding:0.25rem 0.6rem; font-size:0.72rem; width:100%; text-align:center; background:#fff; border:1px solid #cbd5e1;">
              <i class="fas fa-download"></i> Save Concept
            </a>
          </div>
        </div>
      </div>
    `;
  });
}

/* ==========================================================================
   10. STORE POLICIES CMS & LEGAL TERMS
   ========================================================================== */
let currentLoadedPolicies = {};

async function loadPolicyForEdit(key = 'replacement', btnEl = null) {
  const keyInput = document.getElementById('currentPolicyKey');
  if (keyInput) keyInput.value = key;

  if (btnEl) {
    document.querySelectorAll('.btn-policy-tab').forEach(b => {
      b.classList.remove('active');
      b.style.background = '#fff';
      b.style.borderColor = '#e2e8f0';
    });
    btnEl.classList.add('active');
    btnEl.style.background = '#f8fafc';
    btnEl.style.borderColor = '#cbd5e1';
  }

  try {
    const res = await fetch(`/api/policies/${key}`);
    const data = await res.json();
    if (data.success && data.policy) {
      const titleInput = document.getElementById('policyTitleInput');
      const contentInput = document.getElementById('policyContentInput');
      const badge = document.getElementById('policyLastUpdatedBadge');
      if (titleInput) titleInput.value = data.policy.title || '';
      if (contentInput) contentInput.value = data.policy.content || '';
      const updatedDate = data.policy.updated_at ? new Date(data.policy.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently';
      if (badge) badge.textContent = `Last Updated: ${updatedDate}`;
    }
  } catch (err) {
    showToast('Failed to load policy terms', 'error');
  }
}

async function savePolicyChanges(e) {
  e.preventDefault();
  const key = document.getElementById('currentPolicyKey').value;
  const title = document.getElementById('policyTitleInput').value.trim();
  const content = document.getElementById('policyContentInput').value.trim();

  const btn = document.getElementById('btnSavePolicy');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  }

  try {
    const res = await fetch(`/api/admin/policies/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, content })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Store policy updated successfully!', 'success');
      loadPolicyForEdit(key);
    } else {
      showToast(data.message || 'Failed to update policy', 'error');
    }
  } catch (err) {
    showToast('Failed to save policy: ' + err.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> Save Policy Changes';
    }
  }
}

function previewCurrentPolicyModal() {
  const title = document.getElementById('policyTitleInput')?.value || 'Store Policy';
  const content = document.getElementById('policyContentInput')?.value || '';
  const previewWin = window.open('', '_blank');
  if (previewWin) {
    previewWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Preview: ${escapeHTML(title)}</title>
        <link rel="stylesheet" href="/css/style.css">
        <link rel="stylesheet" href="/css/ux-premium.css">
        <style>body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 2.5rem; max-width: 850px; margin: 0 auto; line-height: 1.8; color: #1e293b; }</style>
      </head>
      <body>
        <h1 style="color:hsl(348,75%,26%); font-family:'Playfair Display', serif; font-size:2rem; margin-bottom:0.5rem;">${escapeHTML(title)}</h1>
        <hr style="border:none; border-top:1px solid #e2e8f0; margin:1.5rem 0;">
        <div style="font-size:0.95rem;">${content}</div>
      </body>
      </html>
    `);
    previewWin.document.close();
  }
}

/* ==========================================================================
   11. ADMIN TWO-FACTOR AUTHENTICATION (TOTP / RFC 6238)
   ========================================================================== */
let activeMfaSecret = '';
let activeMfaRecoveryCodes = [];

async function load2FaStatus() {
  try {
    const res = await fetch('/api/admin/2fa/status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      const badge = document.getElementById('mfaStatusBadge');
      const text = document.getElementById('mfaUpdatedText');
      const container = document.getElementById('mfaActionsContainer');

      if (badge && text && container) {
        if (data.enabled) {
          badge.textContent = 'MFA Active & Protected';
          badge.style.background = '#16a34a';
          text.textContent = `Authenticator linked and active (Last verified: ${new Date(data.updated_at).toLocaleDateString()})`;
          container.innerHTML = `
            <button class="btn btn-danger" onclick="disable2FaPrompt()" style="width:100%; padding:0.6rem; font-weight:700;">
              <i class="fas fa-lock-open"></i> Disable Two-Factor Authentication
            </button>
          `;
        } else {
          badge.textContent = 'MFA Disabled';
          badge.style.background = '#ef4444';
          text.textContent = 'No authenticator app currently linked to this admin account.';
          container.innerHTML = `
            <button class="btn btn-primary" onclick="startTotpEnrollment()" style="width:100%; padding:0.7rem; font-weight:700;">
              <i class="fas fa-qrcode"></i> Setup Two-Factor Authentication
            </button>
          `;
        }
      }
    }
  } catch (err) {
    console.error('Failed to load 2FA status:', err);
  }
}

async function startTotpEnrollment() {
  try {
    const res = await fetch('/api/admin/2fa/setup', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      activeMfaSecret = data.secret;
      activeMfaRecoveryCodes = data.recoveryCodes || [];

      document.getElementById('mfaQrImage').src = data.qrCode;
      document.getElementById('mfaSecretText').textContent = data.secret;
      document.getElementById('mfaVerificationCode').value = '';
      document.getElementById('mfaEnrollmentBox').style.display = 'block';
      document.getElementById('mfaRecoveryCodesBox').style.display = 'none';
      document.getElementById('mfaVerificationCode').focus();
    } else {
      showToast(data.message || 'Failed to initiate 2FA setup', 'error');
    }
  } catch (err) {
    showToast('Failed to start 2FA: ' + err.message, 'error');
  }
}

function cancelTotpEnrollment() {
  const box = document.getElementById('mfaEnrollmentBox');
  if (box) box.style.display = 'none';
  activeMfaSecret = '';
  activeMfaRecoveryCodes = [];
}

async function handleMfaVerify(e) {
  e.preventDefault();
  const code = document.getElementById('mfaVerificationCode').value.trim();
  if (code.length !== 6) {
    showToast('Please enter a 6-digit code from your authenticator app', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/admin/2fa/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        secret: activeMfaSecret,
        token: code,
        recoveryCodes: activeMfaRecoveryCodes
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Two-factor authentication successfully enabled!', 'success');
      const list = document.getElementById('mfaRecoveryCodesList');
      if (list) list.innerHTML = activeMfaRecoveryCodes.map(c => `<code>${c}</code>`).join('');
      const recBox = document.getElementById('mfaRecoveryCodesBox');
      if (recBox) recBox.style.display = 'block';
      load2FaStatus();
    } else {
      showToast(data.message || 'Invalid verification code', 'error');
    }
  } catch (err) {
    showToast('Failed to verify code: ' + err.message, 'error');
  }
}

function copyRecoveryCodes() {
  if (activeMfaRecoveryCodes.length > 0) {
    navigator.clipboard.writeText(activeMfaRecoveryCodes.join('\n'));
    showToast('Recovery codes copied to clipboard!', 'success');
  }
}

async function disable2FaPrompt() {
  const pwd = prompt('Enter your admin account password to disable Two-Factor Authentication:');
  if (!pwd) return;

  try {
    const res = await fetch('/api/admin/2fa/disable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ password: pwd })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Two-factor authentication disabled', 'info');
      load2FaStatus();
    } else {
      showToast(data.message || 'Failed to disable 2FA', 'error');
    }
  } catch (err) {
    showToast('Error disabling 2FA: ' + err.message, 'error');
  }
}

/* ==========================================================================
   12. ADMIN STAFF & SCOPED ROLES MANAGEMENT
   ========================================================================== */
let allStaffMembers = [];

async function loadAdminStaff() {
  try {
    const res = await fetch('/api/admin/staff', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      allStaffMembers = data.staff || [];
      const tbody = document.querySelector('#adminStaffTable tbody');
      if (!tbody) return;
      tbody.innerHTML = '';

      if (allStaffMembers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-light); padding:2rem;">No additional staff members created yet. Click "Add Staff Member" to delegate roles.</td></tr>';
        return;
      }

      allStaffMembers.forEach(s => {
        let perms = [];
        try { perms = JSON.parse(s.permissions || '[]'); } catch (e) { perms = [s.permissions]; }

        const validity = (s.valid_from || s.valid_until) 
          ? `${s.valid_from || 'Always'} to ${s.valid_until || 'Indefinite'}`
          : 'Permanent Active';

        tbody.innerHTML += `
          <tr>
            <td>
              <strong>${escapeHTML(s.name)}</strong><br>
              <span style="font-size:0.75rem; color:#64748b;">${escapeHTML(s.email)}</span>
            </td>
            <td>
              <strong>${escapeHTML(s.role_title)}</strong><br>
              <span style="font-size:0.75rem; color:#64748b;">${escapeHTML(s.department)}</span>
            </td>
            <td>
              <div style="display:flex; gap:4px; flex-wrap:wrap;">
                ${perms.map(p => `<span style="background:#f1f5f9; color:#334155; font-size:0.7rem; padding:2px 6px; border-radius:4px;">${escapeHTML(p.replace('_write', ' (Write)').replace('_read', ' (Read)'))}</span>`).join('')}
              </div>
            </td>
            <td style="font-size:0.8rem; color:#475569;">${escapeHTML(validity)}</td>
            <td>
              <div style="display:flex; gap:6px;">
                <button class="btn" onclick="openStaffModal(${s.id})" style="padding:0.25rem 0.6rem; font-size:0.75rem; background:#fff; border:1px solid #cbd5e1;">Edit</button>
                <button class="btn btn-danger" onclick="deleteStaffUser(${s.id})" style="padding:0.25rem 0.6rem; font-size:0.75rem;">Delete</button>
              </div>
            </td>
          </tr>
        `;
      });
    }
  } catch (err) {
    showToast('Failed to load staff members', 'error');
  }
}

function openStaffModal(id = null) {
  const form = document.getElementById('adminStaffForm');
  if (form) form.reset();
  const editIdInput = document.getElementById('staffEditId');
  if (editIdInput) editIdInput.value = id ? String(id) : '';

  if (id) {
    const s = allStaffMembers.find(m => m.id === id);
    if (s) {
      document.getElementById('staffModalTitle').textContent = 'Edit Staff Member';
      document.getElementById('staffName').value = s.name;
      document.getElementById('staffEmail').value = s.email;
      document.getElementById('staffEmail').disabled = true;
      document.getElementById('staffDepartment').value = s.department || 'Fashion & Merchandising';
      document.getElementById('staffRoleTitle').value = s.role_title || 'Catalog Merchandiser';
      document.getElementById('staffValidFrom').value = s.valid_from || '';
      document.getElementById('staffValidUntil').value = s.valid_until || '';
      document.getElementById('staffPwdHelp').textContent = '(Leave blank to keep unchanged)';

      let perms = [];
      try { perms = JSON.parse(s.permissions || '[]'); } catch (e) { perms = [s.permissions]; }
      document.querySelectorAll('input[name="staffPerm"]').forEach(cb => {
        cb.checked = perms.includes(cb.value);
      });
    }
  } else {
    document.getElementById('staffModalTitle').textContent = 'Add Staff Member';
    document.getElementById('staffEmail').disabled = false;
    document.getElementById('staffPwdHelp').textContent = '(Required for new staff)';
    document.querySelectorAll('input[name="staffPerm"]').forEach(cb => cb.checked = true);
  }

  document.getElementById('staffModal').style.display = 'flex';
}

function closeStaffModal() {
  document.getElementById('staffModal').style.display = 'none';
  const form = document.getElementById('adminStaffForm');
  if (form) form.reset();
  const emailInput = document.getElementById('staffEmail');
  if (emailInput) emailInput.disabled = false;
}

async function handleStaffFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('staffEditId').value;
  const name = document.getElementById('staffName').value.trim();
  const email = document.getElementById('staffEmail').value.trim();
  const password = document.getElementById('staffPassword').value;
  const department = document.getElementById('staffDepartment').value;
  const role_title = document.getElementById('staffRoleTitle').value.trim();
  const valid_from = document.getElementById('staffValidFrom').value || null;
  const valid_until = document.getElementById('staffValidUntil').value || null;

  const permissions = Array.from(document.querySelectorAll('input[name="staffPerm"]:checked')).map(cb => cb.value);

  const payload = { name, email, department, role_title, permissions, valid_from, valid_until };
  if (password && password.trim() !== '') payload.password = password;

  const url = id ? `/api/admin/staff/${id}` : '/api/admin/staff';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || 'Staff member saved!', 'success');
      closeStaffModal();
      loadAdminStaff();
    } else {
      showToast(data.message || 'Failed to save staff member', 'error');
    }
  } catch (err) {
    showToast('Failed to save staff: ' + err.message, 'error');
  }
}

async function deleteStaffUser(id) {
  if (!confirm('Are you sure you want to permanently remove this staff member?')) return;
  try {
    const res = await fetch(`/api/admin/staff/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Staff member removed successfully');
      loadAdminStaff();
    } else {
      showToast(data.message || 'Failed to delete staff member', 'error');
    }
  } catch (err) {
    showToast('Failed to delete staff: ' + err.message, 'error');
  }
}

/* ==========================================================================
   HERO BANNERS MANAGEMENT LOGIC
   ========================================================================== */
let allHeroBanners = [];

async function loadAdminHeroBanners() {
  try {
    const res = await fetch('/api/admin/hero-banners', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      allHeroBanners = data.banners;
      const tbody = document.querySelector('#adminHeroBannersTable tbody');
      if (!tbody) return;
      tbody.innerHTML = '';

      if (data.banners.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:#888">No active hero banners found. Add a banner above!</td></tr>';
        return;
      }

      data.banners.forEach(b => {
        const mediaTag = b.media_type === 'video' ? 
          `<video src="${formatLocalPath(b.media_url)}" style="width:70px; height:45px; object-fit:cover; border-radius:4px" muted></video>` :
          `<img src="${formatLocalPath(b.media_url)}" style="width:70px; height:45px; object-fit:cover; border-radius:4px" onerror="this.src='images/hero_vacation.png'">`;

        tbody.innerHTML += `
          <tr>
            <td><strong style="color:var(--primary)">#${b.priority}</strong></td>
            <td>${mediaTag}</td>
            <td><strong>${b.title}</strong><br><span style="font-size:0.75rem; color:#666">${b.subtitle || ''}</span></td>
            <td><span style="font-size:0.8rem; font-weight:700; color:var(--accent)">${b.cta_text || 'Shop Now'}</span><br><span style="font-size:0.75rem; color:#888">${b.link_url || 'products.html'}</span></td>
            <td>
              <button onclick="editHeroBanner(${b.id})" class="btn" style="padding:0.3rem 0.6rem; font-size:0.75rem; background:var(--primary); color:#fff"><i class="fas fa-edit"></i> Edit</button>
              <button onclick="deleteHeroBanner(${b.id})" class="btn" style="padding:0.3rem 0.6rem; font-size:0.75rem; background:var(--danger); color:#fff"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        `;
      });
    }
  } catch (err) {
    console.error('Failed to load hero banners:', err);
  }
}

function switchHeroMediaType(type) {
  const imgContainer = document.getElementById('heroImageInputContainer');
  const vidContainer = document.getElementById('heroVideoInputContainer');
  if (!imgContainer || !vidContainer) return;
  if (type === 'video') {
    imgContainer.style.display = 'none';
    vidContainer.style.display = 'flex';
  } else {
    imgContainer.style.display = 'flex';
    vidContainer.style.display = 'none';
  }
}

async function handleHeroBannerSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('heroBannerId').value;
  const isVideoMode = document.querySelector('input[name="heroMediaTypeRadio"]:checked')?.value === 'video';

  const formData = new FormData();
  formData.append('title', document.getElementById('heroBannerTitle').value);
  formData.append('subtitle', document.getElementById('heroBannerSubtitle').value);
  formData.append('cta_text', document.getElementById('heroBannerCta').value);
  formData.append('link_url', document.getElementById('heroBannerLinkUrl').value);
  formData.append('priority', document.getElementById('heroBannerPriority').value);

  if (isVideoMode) {
    formData.append('media_type', 'video');
    const vidFile = document.getElementById('heroBannerVideoFile');
    const vidUrl = document.getElementById('heroBannerVideoUrl').value;
    if (vidFile && vidFile.files.length > 0) {
      formData.append('file', vidFile.files[0]);
    } else if (vidUrl) {
      formData.append('media_url', vidUrl.trim());
    }
  } else {
    formData.append('media_type', 'image');
    const imgFile = document.getElementById('heroBannerFile');
    const imgUrl = document.getElementById('heroBannerMediaUrl').value;
    if (imgFile && imgFile.files.length > 0) {
      formData.append('file', imgFile.files[0]);
    } else if (imgUrl) {
      formData.append('media_url', imgUrl.trim());
    }
  }

  const url = id ? `/api/hero-banners/${id}` : '/api/hero-banners';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method: method,
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      document.getElementById('heroBannerForm').reset();
      document.getElementById('heroBannerId').value = '';
      switchHeroMediaType('image');
      loadAdminHeroBanners();
    } else {
      showToast(data.message || 'Failed to save banner', 'error');
    }
  } catch (err) {
    showToast('Failed to connect to banner server', 'error');
  }
}

function editHeroBanner(id) {
  const b = allHeroBanners.find(banner => banner.id === id);
  if (!b) return;
  document.getElementById('heroBannerId').value = b.id;
  document.getElementById('heroBannerTitle').value = b.title || '';
  document.getElementById('heroBannerSubtitle').value = b.subtitle || '';
  document.getElementById('heroBannerCta').value = b.cta_text || '';
  document.getElementById('heroBannerLinkUrl').value = b.link_url || '';
  document.getElementById('heroBannerPriority').value = b.priority || 1;

  if (b.media_type === 'video') {
    const radio = document.querySelector('input[name="heroMediaTypeRadio"][value="video"]');
    if (radio) radio.checked = true;
    switchHeroMediaType('video');
    document.getElementById('heroBannerVideoUrl').value = b.media_url || '';
  } else {
    const radio = document.querySelector('input[name="heroMediaTypeRadio"][value="image"]');
    if (radio) radio.checked = true;
    switchHeroMediaType('image');
    document.getElementById('heroBannerMediaUrl').value = b.media_url || '';
  }
  window.scrollTo({ top: document.getElementById('heroBannerForm').offsetTop - 100, behavior: 'smooth' });
}

async function deleteHeroBanner(id) {
  if (!confirm('Are you sure you want to delete this hero banner?')) return;
  try {
    const res = await fetch(`/api/hero-banners/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Banner deleted successfully');
      loadAdminHeroBanners();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Failed to delete banner', 'error');
  }
}
