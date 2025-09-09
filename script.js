/* ================================
   CONFIGURATION
================================ */
const HER_NAME = 'Lojain';
const MEET_DATE_ISO = '2025-03-21T00:00:00'; // غيّر لتاريخكم (زيد Z لو UTC)

/* ================================
   SINCE COUNTER
================================ */
function pad(n) { return String(n).padStart(2, '0'); }

function updateSince() {
  const el = document.getElementById('sinceCounter');
  if (!el) return;

  const start = new Date(MEET_DATE_ISO).getTime();
  const diff = Math.max(0, Date.now() - start);

  const d = Math.floor(diff / 86400000);                // days
  const h = Math.floor((diff % 86400000) / 3600000);    // hours
  const m = Math.floor((diff % 3600000) / 60000);       // minutes
  const s = Math.floor((diff % 60000) / 1000);          // seconds

  el.textContent = `${d} days, ${pad(h)} hrs, ${pad(m)} mins, ${pad(s)} secs`;
}

// تشغيل العداد
updateSince();
setInterval(updateSince, 1000);

/* ================================
   NOTEBOOK (LOCAL ONLY)
================================ */
const noteKey = 'note_lo';
const note = document.getElementById('memo');
const saveBtn = document.getElementById('saveMemo');

if (note && saveBtn) {
  try {
    note.value = localStorage.getItem(noteKey) || '';
  } catch {}

  saveBtn.addEventListener('click', () => {
    try {
      localStorage.setItem(noteKey, note.value);
      saveBtn.textContent = 'Saved ✓';
      setTimeout(() => (saveBtn.textContent = 'Save'), 1200);
    } catch {
      alert('Couldn’t save locally.');
    }
  });
}

/* ================================
   BREATHING COACH (TIPS ROTATION)
================================ */
const tips = [
  'Inhale 4 · Hold 4 · Exhale 6 — repeat',
  'Square: Inhale 4 · Hold 4 · Exhale 4 · Hold 4',
  '4–7–8: Inhale 4 · Hold 7 · Exhale 8',
];
let tipIdx = 0;
const hint = document.querySelector('.breath-steps');

setInterval(() => {
  if (!hint) return;
  tipIdx = (tipIdx + 1) % tips.length;
  hint.textContent = tips[tipIdx];
}, 7000);

/* ================================
   BACKGROUND HEARTS (FLOATING)
================================ */
function spawnHeart() {
  const h = document.createElement('div');
  h.textContent = '💖';
  h.className = 'heart-float';
  h.style.left = Math.random() * 100 + 'vw';
  h.style.top = '-30px';
  h.style.fontSize = 16 + Math.random() * 18 + 'px';
  h.style.setProperty('--drift', Math.random() * 120 - 60 + 'px');
  document.body.appendChild(h);
  setTimeout(() => h.remove(), 9500);
}

// نشر قلوب أولية + مستمرة
for (let i = 0; i < 18; i++) setTimeout(spawnHeart, i * 300);
setInterval(spawnHeart, 1200);

/* ================================
   LOVE BUTTON (HEARTS BURST)
================================ */
const loveBtn = document.getElementById('confettiBtn');
if (loveBtn) {
  loveBtn.addEventListener('click', () => {
    for (let i = 0; i < 40; i++) setTimeout(spawnHeart, i * 30);
  });
}

/* ================================
   REVEAL ANIMATION (READY CARD)
================================ */
(function () {
  const card = document.getElementById('readyCard');
  if (!card) return;

  if (!('IntersectionObserver' in window)) {
    card.classList.add('show');
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        card.classList.add('show');
        io.disconnect();
      }
    });
  }, { threshold: 0.2 });

  io.observe(card);
})();

/* ================================
   ONE-TIME BUTTON ("I'M READY")
================================ */
(function () {
  const READY_KEY = 'a23_ready_once';
  const btn = document.getElementById('readyOnceBtn');
  const state = document.getElementById('readyOnceState');
  if (!btn || !state) return;

  function setPressedUI(ts) {
    btn.disabled = true;
    btn.textContent = '✔ Already marked';
    state.textContent = ts ? `Marked on ${ts}` : 'Used once on this device.';
  }

  try {
    const saved = localStorage.getItem(READY_KEY);
    if (saved) setPressedUI(saved);
  } catch {}

  btn.addEventListener('click', () => {
    try {
      const ts = new Date().toLocaleString();
      localStorage.setItem(READY_KEY, ts);
      setPressedUI(ts);
    } catch {
      state.textContent = 'Could not save locally.';
    }
  });
})();
// Smooth scroll for the "down" link" (robust)
document.addEventListener('DOMContentLoaded', () => {
  const down = document.getElementById('downLink');
  const target = document.getElementById('readySection');
  if (!down || !target) return;

  down.addEventListener('click', (e) => {
    e.preventDefault();
    const y = target.getBoundingClientRect().top + window.scrollY - 12; // هامش بسيط
    window.scrollTo({ top: y, behavior: 'smooth' });
  });
});

