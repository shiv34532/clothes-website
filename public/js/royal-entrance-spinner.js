/**
 * LITTLE TO LARGE - ROYAL RED GATE ENTRANCE, DIWALI SKY-SHOTS & DISCOUNT SPINNER
 * Author: Antigravity Core UX Team
 */

(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // 1. DIWALI SKY-SHOT CRACKERS & FIREWORKS PARTICLES ENGINE
  // -------------------------------------------------------------------------
  let canvas, ctx;
  let animId = null;
  let rockets = [];
  let particles = [];
  let isFireworksActive = false;

  const FESTIVE_COLORS = [
    '#fbbf24', '#f59e0b', '#ef4444', '#10b981', 
    '#38bdf8', '#ec4899', '#f43f5e', '#a855f7', '#ffffff'
  ];

  class SkyRocket {
    constructor(startX, startY, targetY, color) {
      this.x = startX;
      this.y = startY;
      this.targetY = targetY;
      this.color = color;
      this.speed = 10 + Math.random() * 5;
      this.exploded = false;
      this.trail = [];
    }

    update() {
      this.trail.push({ x: this.x, y: this.y, alpha: 1 });
      if (this.trail.length > 8) this.trail.shift();

      this.y -= this.speed;
      this.speed *= 0.985;

      if (this.y <= this.targetY || this.speed <= 2) {
        this.explode();
        this.exploded = true;
      }
    }

    explode() {
      const count = 60 + Math.floor(Math.random() * 30);
      const baseHue = Math.random() * 360;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const velocity = 2.5 + Math.random() * 5.5;
        const color = FESTIVE_COLORS[Math.floor(Math.random() * FESTIVE_COLORS.length)];
        particles.push(new CrackerSpark(this.x, this.y, angle, velocity, color));
      }
    }

    draw(ctx) {
      // Draw trailing sparks
      for (let i = 0; i < this.trail.length; i++) {
        const pt = this.trail[i];
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, (i + 1) * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251, 191, 36, ${0.15 * i})`;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  class CrackerSpark {
    constructor(x, y, angle, velocity, color) {
      this.x = x;
      this.y = y;
      this.vx = Math.cos(angle) * velocity;
      this.vy = Math.sin(angle) * velocity;
      this.color = color;
      this.alpha = 1;
      this.decay = 0.018 + Math.random() * 0.022;
      this.gravity = 0.12;
      this.size = 2.5 + Math.random() * 2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.vx *= 0.96;
      this.vy *= 0.96;
      this.alpha -= this.decay;
    }

    draw(ctx) {
      if (this.alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.restore();
    }
  }

  function initFireworksCanvas() {
    canvas = document.getElementById('diwaliSkyShotCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resizeFireworksCanvas();
    window.addEventListener('resize', resizeFireworksCanvas);
  }

  function resizeFireworksCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function launchSkyShotWave() {
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;

    // Launch 3 to 5 sky-shots from bottom
    const positions = [w * 0.2, w * 0.38, w * 0.5, w * 0.65, w * 0.82];
    positions.forEach((xPos, idx) => {
      setTimeout(() => {
        if (!isFireworksActive) return;
        const color = FESTIVE_COLORS[idx % FESTIVE_COLORS.length];
        const targetY = h * 0.2 + Math.random() * (h * 0.35);
        rockets.push(new SkyRocket(xPos + (Math.random() - 0.5) * 60, h + 10, targetY, color));
      }, idx * 180);
    });
  }

  function renderFireworks() {
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update & draw sky-shot rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
      rockets[i].update();
      rockets[i].draw(ctx);
      if (rockets[i].exploded) {
        rockets.splice(i, 1);
      }
    }

    // Update & draw explosion sparks
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw(ctx);
      if (particles[i].alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    if (isFireworksActive || rockets.length > 0 || particles.length > 0) {
      animId = requestAnimationFrame(renderFireworks);
    }
  }

  function startDiwaliFireworks() {
    initFireworksCanvas();
    isFireworksActive = true;
    rockets = [];
    particles = [];
    renderFireworks();

    // Wave 1
    launchSkyShotWave();
    // Wave 2
    setTimeout(launchSkyShotWave, 600);
    // Wave 3
    setTimeout(launchSkyShotWave, 1200);

    // Auto-stop wave generation after 3.2s
    setTimeout(() => {
      isFireworksActive = false;
    }, 3200);
  }

  function stopDiwaliFireworks() {
    isFireworksActive = false;
    if (animId) cancelAnimationFrame(animId);
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // -------------------------------------------------------------------------
  // 2. ROYAL RED GATE ENTRANCE CONTROLLER
  // -------------------------------------------------------------------------
  window.closeRoyalGateEntrance = function () {
    const overlay = document.getElementById('royalGateEntranceOverlay');
    if (!overlay) return;

    overlay.classList.add('opening');
    setTimeout(() => {
      overlay.classList.add('dismissed');
      setTimeout(() => {
        overlay.style.display = 'none';
        stopDiwaliFireworks();
        // Trigger discount spinner modal automatically
        setTimeout(window.openSpinnerModal, 400);
      }, 500);
    }, 900);
  };

  function initRoyalEntrance() {
    const overlay = document.getElementById('royalGateEntranceOverlay');
    if (!overlay) return;

    const urlParams = new URLSearchParams(window.location.search);
    const previewMode = urlParams.get('preview');

    if (previewMode === 'welcome') {
      overlay.style.display = 'none';
      return;
    }

    if (previewMode === 'doors') {
      overlay.style.display = 'flex';
      startDiwaliFireworks();
      return;
    }

    if (previewMode === 'spinner') {
      overlay.style.display = 'none';
      setTimeout(window.openSpinnerModal, 200);
      return;
    }

    // Check if user already saw entrance in this tab session
    const seenGate = sessionStorage.getItem('l2l_royal_gate_seen');
    if (seenGate === 'true') {
      overlay.style.display = 'none';
      return;
    }

    sessionStorage.setItem('l2l_royal_gate_seen', 'true');
    overlay.style.display = 'flex';

    // 1. Start crackers & sky-shots immediately
    startDiwaliFireworks();

    // 2. After 500ms, start opening the grand red doors
    setTimeout(() => {
      overlay.classList.add('opening');
    }, 500);

    // 3. At 1800ms, complete the entrance and reveal the website
    setTimeout(() => {
      overlay.classList.add('dismissed');
      setTimeout(() => {
        overlay.style.display = 'none';
        stopDiwaliFireworks();
        // Reveal discount wheel to welcome the family shopper!
        setTimeout(window.openSpinnerModal, 500);
      }, 600);
    }, 2000);
  }

  // -------------------------------------------------------------------------
  // 3. FESTIVE DISCOUNT SPINNER WHEEL (SPIN & WIN) ENGINE
  // -------------------------------------------------------------------------
  const WHEEL_SEGMENTS = [
    { label: "10% OFF", code: "SPIN10", discount_percent: 10, color: "#d97706", textColor: "#ffffff" },
    { label: "20% OFF", code: "SPIN20", discount_percent: 20, color: "#800020", textColor: "#fef08a" },
    { label: "30% OFF", code: "SPIN30", discount_percent: 30, color: "#065f46", textColor: "#ffffff" },
    { label: "40% OFF", code: "SPIN40", discount_percent: 40, color: "#4f46e5", textColor: "#ffffff" },
    { label: "70% JACKPOT", code: "SPIN70", discount_percent: 70, color: "#b91c1c", textColor: "#fef08a" }
  ];

  let wheelCanvasEl, wheelCtx;
  let currentWheelRotation = 0;
  let isWheelSpinning = false;
  let hasSpunAlready = false;

  function drawSpinnerWheel() {
    wheelCanvasEl = document.getElementById('wheelCanvas');
    if (!wheelCanvasEl) return;
    wheelCtx = wheelCanvasEl.getContext('2d');

    const numSlices = WHEEL_SEGMENTS.length;
    const arc = (2 * Math.PI) / numSlices;
    const centerX = wheelCanvasEl.width / 2;
    const centerY = wheelCanvasEl.height / 2;
    const radius = centerX - 8;

    wheelCtx.clearRect(0, 0, wheelCanvasEl.width, wheelCanvasEl.height);

    for (let i = 0; i < numSlices; i++) {
      const angle = i * arc;
      const seg = WHEEL_SEGMENTS[i];

      // Draw segment slice
      wheelCtx.beginPath();
      wheelCtx.fillStyle = seg.color;
      wheelCtx.moveTo(centerX, centerY);
      wheelCtx.arc(centerX, centerY, radius, angle, angle + arc);
      wheelCtx.lineTo(centerX, centerY);
      wheelCtx.fill();

      // Border between slices
      wheelCtx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      wheelCtx.lineWidth = 2;
      wheelCtx.stroke();

      // Draw text
      wheelCtx.save();
      wheelCtx.translate(centerX, centerY);
      wheelCtx.rotate(angle + arc / 2);
      wheelCtx.textAlign = "right";
      wheelCtx.fillStyle = seg.textColor;
      wheelCtx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
      wheelCtx.shadowColor = "rgba(0,0,0,0.6)";
      wheelCtx.shadowBlur = 4;
      wheelCtx.fillText(seg.label, radius - 20, 5);
      wheelCtx.restore();
    }

    // Outer decorative studs / lights
    const numStuds = 24;
    for (let j = 0; j < numStuds; j++) {
      const studAngle = (2 * Math.PI * j) / numStuds;
      const studX = centerX + Math.cos(studAngle) * (radius + 2);
      const studY = centerY + Math.sin(studAngle) * (radius + 2);

      wheelCtx.beginPath();
      wheelCtx.arc(studX, studY, 3, 0, Math.PI * 2);
      wheelCtx.fillStyle = j % 2 === 0 ? '#fbbf24' : '#ffffff';
      wheelCtx.shadowBlur = 6;
      wheelCtx.shadowColor = '#fbbf24';
      wheelCtx.fill();
    }
  }

  window.openSpinnerModal = function (force = false) {
    if (!force) {
      const isCompleted = localStorage.getItem('l2l_spinner_completed') === 'true';
      const currentUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
      if (isCompleted || (currentUser && currentUser.spinner_used >= 1)) {
        console.log('Spinner is 1-time only and already claimed.');
        return;
      }
    }
    const modal = document.getElementById('discountSpinnerModal');
    if (!modal) return;
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
      modal.classList.add('active');
      drawSpinnerWheel();
    });
  };

  window.closeSpinnerModal = function (e) {
    if (e && e.target && e.target.id !== 'discountSpinnerModal') return;
    const modal = document.getElementById('discountSpinnerModal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 350);
  };

  window.triggerWheelSpin = async function () {
    if (isWheelSpinning) return;
    isWheelSpinning = true;

    const spinBtn = document.getElementById('spinWheelBtn');
    if (spinBtn) {
      spinBtn.disabled = true;
      spinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Spinning...';
    }

    let winningIndex = 1; // 20% default fallback
    let wonTier = WHEEL_SEGMENTS[1];
    let wonCode = 'SPIN20';

    try {
      const token = (typeof getToken === 'function') ? getToken() : (localStorage.getItem('token') || sessionStorage.getItem('token'));
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/spinner/spin', {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (data.success && typeof data.segment_index === 'number') {
        winningIndex = Math.min(Math.max(0, data.segment_index), WHEEL_SEGMENTS.length - 1);
        wonCode = data.coupon_code || WHEEL_SEGMENTS[winningIndex].code;
        wonTier = {
          label: data.tier || WHEEL_SEGMENTS[winningIndex].label,
          code: wonCode,
          discount_percent: data.discount_percent
        };
      }
    } catch (err) {
      console.warn('Backend spinner offline, using local fallback:', err);
      winningIndex = Math.random() > 0.5 ? 0 : 1;
      wonTier = WHEEL_SEGMENTS[winningIndex];
      wonCode = wonTier.code;
    }

    const numSlices = WHEEL_SEGMENTS.length;
    const arcDegrees = 360 / numSlices;
    
    // Pointer is at the top (270 degrees in canvas coordinates)
    const segmentCenterDeg = (winningIndex * arcDegrees) + (arcDegrees / 2);
    const targetRotationAtTop = 270 - segmentCenterDeg;

    // Add 6 to 8 full 360 rotations for suspense
    const extraSpins = (6 + Math.floor(Math.random() * 3)) * 360;
    const totalNewRotation = currentWheelRotation + extraSpins + ((targetRotationAtTop - (currentWheelRotation % 360) + 360) % 360);
    currentWheelRotation = totalNewRotation;

    if (wheelCanvasEl) {
      wheelCanvasEl.style.transform = `rotate(${currentWheelRotation}deg)`;
    }

    setTimeout(() => {
      isWheelSpinning = false;
      hasSpunAlready = true;
      if (spinBtn) {
        spinBtn.innerHTML = '🎉 Reward Unlocked!';
      }
      showWinningResult(wonTier);
    }, 3900);
  };

  function showWinningResult(segment) {
    const winSection = document.getElementById('spinnerWinSection');
    const discountTag = document.getElementById('winDiscountTag');
    const couponCode = document.getElementById('winCouponCode');

    if (discountTag) discountTag.textContent = segment.label;
    if (couponCode) couponCode.textContent = segment.code;

    if (winSection) {
      winSection.style.display = 'block';
    }

    // Save coupon to localStorage for instant checkout auto-fill
    try {
      localStorage.setItem('l2l_active_coupon', segment.code);
      sessionStorage.setItem('l2l_coupon', segment.code);
      localStorage.setItem('l2l_spinner_completed', 'true');
    } catch (e) {}

    // Trigger celebration confetti
    triggerConfettiBurst();
  }

  function triggerConfettiBurst() {
    const count = 75;
    const container = document.body;
    for (let i = 0; i < count; i++) {
      const conf = document.createElement('div');
      conf.className = 'confetti-particle';
      conf.style.cssText = `
        position: fixed;
        top: -10px;
        left: ${Math.random() * 100}vw;
        width: ${6 + Math.random() * 8}px;
        height: ${8 + Math.random() * 12}px;
        background-color: ${FESTIVE_COLORS[Math.floor(Math.random() * FESTIVE_COLORS.length)]};
        opacity: ${0.8 + Math.random() * 0.2};
        z-index: 1000000;
        transform: rotate(${Math.random() * 360}deg);
        pointer-events: none;
        transition: transform 3.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 3.5s ease-in, opacity 3.5s ease-out;
      `;
      container.appendChild(conf);

      requestAnimationFrame(() => {
        conf.style.top = `${105 + Math.random() * 10}vh`;
        conf.style.transform = `rotate(${Math.random() * 720}deg) translateX(${(Math.random() - 0.5) * 150}px)`;
        conf.style.opacity = '0';
      });

      setTimeout(() => conf.remove(), 3600);
    }
  }

  window.copyWinCoupon = function () {
    const codeEl = document.getElementById('winCouponCode');
    const btn = document.getElementById('copyCouponBtn');
    if (!codeEl) return;
    const text = codeEl.textContent.trim();

    navigator.clipboard.writeText(text).then(() => {
      if (btn) {
        btn.innerHTML = `<i class="fas fa-check"></i> Copied!`;
        btn.style.background = '#10b981';
        btn.style.color = '#fff';
        setTimeout(() => {
          btn.innerHTML = `<i class="fas fa-copy"></i> Copy Code`;
          btn.style.background = '#f59e0b';
          btn.style.color = '#1e1b4b';
        }, 2000);
      }
    }).catch(() => {
      alert('Coupon code: ' + text);
    });
  };

  window.applyCouponAndShop = function () {
    window.closeSpinnerModal();
    window.location.href = '/products?offer=festive';
  };

  // -------------------------------------------------------------------------
  // 4. HERO VIDEO PLAYER CONTROLS (MUTE / UNMUTE)
  // -------------------------------------------------------------------------
  window.toggleHeroVideoSound = function (btn) {
    const video = document.getElementById('heroWelcomeVideo');
    if (!video) return;
    if (video.muted) {
      video.muted = false;
      btn.innerHTML = '<i class="fas fa-volume-up"></i>';
      btn.setAttribute('title', 'Mute Sound');
    } else {
      video.muted = true;
      btn.innerHTML = '<i class="fas fa-volume-mute"></i>';
      btn.setAttribute('title', 'Unmute Sound');
    }
  };

  // Run on DOM load
  document.addEventListener('DOMContentLoaded', () => {
    initRoyalEntrance();
  });

})();
