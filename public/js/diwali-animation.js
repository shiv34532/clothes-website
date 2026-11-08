/**
 * ==============================================================================
 * DIWALI FESTIVE ENTRY ANIMATION (Ultra-Lightweight & Exactly 0.75s Duration)
 * ==============================================================================
 */

(function initDiwaliAnimation() {
  // Check if user already saw this animation in the current session
  const urlParams = new URLSearchParams(window.location.search);
  const forceTrigger = urlParams.get('diwali') === '1';

  if (!forceTrigger && sessionStorage.getItem('ltl_diwali_seen')) {
    return; // Don't interrupt user on subsequent navigation
  }

  // Construct DOM overlay
  const overlay = document.createElement('div');
  overlay.id = 'diwaliGateOverlay';
  overlay.innerHTML = `
    <canvas id="diwaliFireworksCanvas"></canvas>
    <div class="diwali-doors-wrapper" id="diwaliDoors">
      <div class="diwali-door door-left">
        <div class="diwali-door-ornament">
          <div class="diwali-door-handle"></div>
        </div>
      </div>
      <div class="diwali-door door-right">
        <div class="diwali-door-ornament">
          <div class="diwali-door-handle"></div>
        </div>
      </div>
    </div>
    <div class="diwali-gate-center" id="diwaliGateCenter">
      <div style="font-size: 2.5rem; margin-bottom: 0.3rem;">🪔 🪔 🪔</div>
      <h1 class="diwali-title">शुभ दीपावली</h1>
      <p class="diwali-subtitle">Festive Family Collection 2026</p>
      <button class="diwali-open-btn" id="diwaliOpenBtn">द्वार खोलें / Enter Store ✨</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const openBtn = document.getElementById('diwaliOpenBtn');
  const doors = document.getElementById('diwaliDoors');
  const canvas = document.getElementById('diwaliFireworksCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Particle System for Both Sides (Sparklers) & Sky-Shots (Rockets)
  const particles = [];
  const rockets = [];
  const colors = ['#f39c12', '#f1c40f', '#e74c3c', '#2ecc71', '#9b59b6', '#ffffff'];

  function createSparkle(x, y, vx, vy, color) {
    particles.push({
      x, y,
      vx, vy,
      alpha: 1,
      decay: 0.045, // Rapid fade for 750ms limit
      size: Math.random() * 3 + 2,
      color: color || colors[Math.floor(Math.random() * colors.length)]
    });
  }

  function createSkyShot(startX, targetY) {
    rockets.push({
      x: startX,
      y: height,
      targetY: targetY,
      vy: - (height - targetY) / 15, // Reach peak in ~250ms
      exploded: false,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }

  let animationFrameId = null;
  let startTime = null;
  const TOTAL_DURATION_MS = 750; // EXACT 0.75 SECONDS!

  function triggerFestiveCelebration() {
    doors.classList.add('opened');
    sessionStorage.setItem('ltl_diwali_seen', 'true');

    // Launch Sky-Shots from bottom center
    createSkyShot(width * 0.45, height * 0.25);
    createSkyShot(width * 0.55, height * 0.20);

    // Continuous Side-Sparklers Emitters
    const sparkleInterval = setInterval(() => {
      // Left side crackers
      for (let i = 0; i < 5; i++) {
        createSparkle(
          Math.random() * 80 + 20,
          height - Math.random() * 100,
          Math.random() * 6 + 1,
          -(Math.random() * 8 + 3),
          '#f1c40f'
        );
      }
      // Right side crackers
      for (let i = 0; i < 5; i++) {
        createSparkle(
          width - (Math.random() * 80 + 20),
          height - Math.random() * 100,
          -(Math.random() * 6 + 1),
          -(Math.random() * 8 + 3),
          '#e74c3c'
        );
      }
    }, 40);

    startTime = performance.now();

    function renderLoop(currentTime) {
      const elapsed = currentTime - startTime;

      ctx.clearRect(0, 0, width, height);

      // 1. Update & Draw Sky-Shot Rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        if (!r.exploded) {
          r.y += r.vy;
          ctx.beginPath();
          ctx.arc(r.x, r.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          // Spark trail
          createSparkle(r.x, r.y, (Math.random() - 0.5) * 2, 2, '#f39c12');

          if (r.y <= r.targetY) {
            r.exploded = true;
            // Detonate into Starburst
            for (let j = 0; j < 60; j++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = Math.random() * 9 + 2;
              createSparkle(
                r.x,
                r.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                r.color
              );
            }
          }
        }
      }

      // 2. Update & Draw Particles (Side Crackers + Starbursts)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // Gravity
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.restore();
        }
      }

      // Check Exact 0.75-second (750ms) boundary
      if (elapsed >= 500) {
        overlay.classList.add('fade-exit');
      }

      if (elapsed >= TOTAL_DURATION_MS) {
        clearInterval(sparkleInterval);
        cancelAnimationFrame(animationFrameId);
        // Clean unmount from DOM: 0 performance footprint after 750ms
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        return;
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    }

    animationFrameId = requestAnimationFrame(renderLoop);
  }

  openBtn.addEventListener('click', triggerFestiveCelebration);
  overlay.addEventListener('click', (e) => {
    if (e.target !== openBtn) triggerFestiveCelebration();
  }, { once: true });
})();
