/**
 * ==============================================================================
 * PURCHASE DISCOUNT SPINNER (Gamified Offer Wheel Component)
 * Client Controller & HTML5 Canvas Physics Renderer
 * ==============================================================================
 */

(function initPurchaseSpinner() {
  const segments = [
    { label: '5% OFF', value: 5, color: '#e74c3c' },
    { label: '10% OFF', value: 10, color: '#f39c12' },
    { label: '15% OFF', value: 15, color: '#16a085' },
    { label: '20% OFF', value: 20, color: '#2980b9' },
    { label: '25% OFF', value: 25, color: '#8e44ad' },
    { label: '50% OFF', value: 50, color: '#d35400' }
  ];

  const totalSegments = segments.length;
  const arcSize = (2 * Math.PI) / totalSegments;

  // Create UI Elements
  const launcher = document.createElement('div');
  launcher.id = 'spinnerLauncherBtn';
  launcher.innerHTML = `
    <span>🎡 Spin & Win</span>
    <span class="spinner-badge-count" id="spinBadgeCount">0</span>
  `;

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'spinnerModalOverlay';
  modalOverlay.innerHTML = `
    <div class="spinner-modal-container">
      <button class="spinner-close-btn" id="spinnerCloseBtn">&times;</button>
      <h2 style="font-size:1.6rem; color:#0f172a; margin-bottom:0.3rem;">Gamified Lucky Wheel</h2>
      <p style="font-size:0.9rem; color:#64748b;">Spin to win an exclusive instant discount on your order!</p>
      
      <div class="spinner-wheel-wrapper">
        <div class="spinner-pointer"></div>
        <canvas id="spinnerCanvas" width="600" height="600"></canvas>
        <button class="spinner-center-btn" id="spinCenterBtn">SPIN</button>
      </div>

      <div class="spinner-win-card" id="spinnerWinCard">
        <h3 style="color:#b45309; margin-bottom:0.2rem;">🎉 Congratulations!</h3>
        <p id="spinnerWinText" style="font-size:0.95rem; color:#451a03;"></p>
        <div>
          <span class="spinner-win-code" id="spinnerCouponCode"></span>
        </div>
        <button id="copyCouponBtn" style="background:#b45309; color:#fff; border:none; padding:0.4rem 1rem; border-radius:6px; cursor:pointer; font-weight:700; font-size:0.85rem;">Copy Code</button>
      </div>

      <div class="spinner-status-info" id="spinnerStatusText">
        Checking eligibility...
      </div>
      <div class="spinner-rule-tag" id="spinnerRuleTag">
        • Spin 1: Unlocked on first registration/login<br>
        • Spin 2: Unlocked after 5 successful paid orders
      </div>
    </div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(modalOverlay);

  const canvas = document.getElementById('spinnerCanvas');
  const ctx = canvas.getContext('2d');
  const spinCenterBtn = document.getElementById('spinCenterBtn');
  const spinnerCloseBtn = document.getElementById('spinnerCloseBtn');
  const spinBadgeCount = document.getElementById('spinBadgeCount');
  const spinnerStatusText = document.getElementById('spinnerStatusText');
  const spinnerWinCard = document.getElementById('spinnerWinCard');
  const spinnerWinText = document.getElementById('spinnerWinText');
  const spinnerCouponCode = document.getElementById('spinnerCouponCode');
  const copyCouponBtn = document.getElementById('copyCouponBtn');

  let currentRotation = 0;
  let isSpinning = false;
  let userEligibility = null;

  function drawWheel(rotationAngle = 0) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = canvas.width / 2 - 15;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < totalSegments; i++) {
      const angle = rotationAngle + i * arcSize;

      // Draw Segment Slice
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, angle, angle + arcSize);
      ctx.closePath();
      ctx.fillStyle = segments[i].color;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Draw Segment Text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 6;
      ctx.fillText(segments[i].label, radius - 40, 10);
      ctx.restore();
    }

    // Outer Metallic Ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#f1c40f';
    ctx.stroke();
  }

  drawWheel(0);

  // Check Eligibility from Backend API
  async function refreshStatus() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      launcher.style.display = 'none';
      return;
    }

    try {
      const res = await fetch('/api/spinner/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        userEligibility = data;
        spinBadgeCount.textContent = data.spins_remaining;
        
        if (data.spins_remaining > 0) {
          launcher.style.display = 'flex';
          spinCenterBtn.disabled = false;
          spinnerStatusText.innerHTML = `You have <strong style="color:var(--primary)">${data.spins_remaining} spin</strong> ready! Completed Orders: <strong>${data.total_completed_orders}</strong>`;
        } else {
          spinCenterBtn.disabled = true;
          if (data.total_completed_orders < 5 && !data.second_spin_used) {
            const needed = 5 - data.total_completed_orders;
            spinnerStatusText.innerHTML = `Complete <strong>${needed} more order${needed > 1 ? 's' : ''}</strong> to unlock Spin #2!`;
          } else {
            spinnerStatusText.innerHTML = `All eligible spins utilized. Thank you for being a valued shopper!`;
          }
        }
      }
    } catch (err) {
      console.error('Failed to load spinner status:', err);
    }
  }

  // Execute Server-Side Spin Logic
  async function handleSpin() {
    if (isSpinning) return;
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      alert('Please log in to spin the wheel!');
      return;
    }

    isSpinning = true;
    spinCenterBtn.disabled = true;
    spinnerWinCard.style.display = 'none';

    try {
      const res = await fetch('/api/spinner/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: new URLSearchParams(window.location.search).get('id') || null
        })
      });

      const result = await res.json();
      if (!result.success) {
        alert(result.message || 'Unable to spin at this time.');
        isSpinning = false;
        spinCenterBtn.disabled = false;
        return;
      }

      // Backend determined result:
      const targetIndex = result.segment_index; // 0 to 5
      const couponCode = result.coupon_code;
      const discount = result.discount_percentage;

      // Calculate landing angle so top pointer points to target segment
      // Pointer is at -90deg (top: 3 * Math.PI / 2)
      const targetSegmentAngle = targetIndex * arcSize + arcSize / 2;
      const finalAngle = (3 * Math.PI / 2) - targetSegmentAngle;
      const totalRotations = 5 * (2 * Math.PI); // 5 full rounds for suspense
      const targetRotation = totalRotations + finalAngle;

      const duration = 4000; // 4 seconds
      const startTime = performance.now();
      const startAngle = currentRotation % (2 * Math.PI);

      function animateWheel(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out cubic deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);
        currentRotation = startAngle + (targetRotation - startAngle) * easeOut;

        drawWheel(currentRotation);

        if (progress < 1) {
          requestAnimationFrame(animateWheel);
        } else {
          isSpinning = false;
          // Show Reward
          spinnerWinCard.style.display = 'block';
          spinnerWinText.textContent = `You won flat ${discount}% OFF on your next purchase!`;
          spinnerCouponCode.textContent = couponCode;
          refreshStatus();
        }
      }

      requestAnimationFrame(animateWheel);
    } catch (err) {
      console.error('Error during spin execution:', err);
      isSpinning = false;
      spinCenterBtn.disabled = false;
    }
  }

  // Event Listeners
  launcher.addEventListener('click', () => {
    modalOverlay.classList.add('active');
    refreshStatus();
  });

  spinnerCloseBtn.addEventListener('click', () => {
    if (!isSpinning) modalOverlay.classList.remove('active');
  });

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay && !isSpinning) modalOverlay.classList.remove('active');
  });

  spinCenterBtn.addEventListener('click', handleSpin);

  copyCouponBtn.addEventListener('click', () => {
    const code = spinnerCouponCode.textContent;
    navigator.clipboard.writeText(code).then(() => {
      copyCouponBtn.textContent = 'Copied! ✓';
      setTimeout(() => (copyCouponBtn.textContent = 'Copy Code'), 2000);
    });
  });

  // Initial Check on Load
  window.addEventListener('DOMContentLoaded', refreshStatus);
  window.addEventListener('load', refreshStatus);
})();
