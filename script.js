/* ================================
   CONFIGURATION
================================ */
const HER_NAME = 'Lojain';
const MEET_DATE_ISO = '2025-03-21T06:09:00'; // التاريخ المعتمد
const COUPLE_ID = 'lojain_a23'; // معرف خاص بكما للمزامنة
const API_URL = 'https://script.google.com/macros/s/AKfycbwXfzLg1a_o8y2vEVEbXHeekIVhStkwajuYq8dHR6PM7yDVxMR13NyC9qdolaWklftUPw/exec';

/* ================================
   SINCE COUNTER
================================ */
function pad(n) { return String(n).padStart(2, '0'); }

function updateSince() {
  const el = document.getElementById('sinceCounter');
  if (!el) return;

  const start = new Date(MEET_DATE_ISO).getTime();
  const diff = Math.max(0, Date.now() - start);

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  el.textContent = `Since we met: ${d}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}
updateSince();
setInterval(updateSince, 1000);

/* ================================
   MOOD TOY (SYNCED VIA JSONP)
================================ */
const toy = document.getElementById('moodToy');
const labelEl = document.getElementById('toyLabel');
const figure = document.getElementById('toyFigure');
let busy = false;

// وظيفة لتحديث شكل الدمية
function applyMoodUI(state) {
  if (!toy) return;
  toy.classList.toggle('sad', state === 'sad');
  toy.classList.toggle('happy', state !== 'sad');
  if (labelEl) labelEl.textContent = state === 'sad' ? 'She is upset' : 'Click me';
}

// وظيفة لجلب الحالة من السيرفر (JSONP)
async function fetchRemoteMood() {
  const cb = 'cb_get_mood';
  const s = document.createElement('script');
  window[cb] = (data) => {
    applyMoodUI(data.state || 'happy');
    delete window[cb];
    s.remove();
  };
  s.src = `${API_URL}?id=${encodeURIComponent(COUPLE_ID)}&callback=${cb}&_=${Date.now()}`;
  document.head.appendChild(s);
}

// وظيفة لإرسال الحالة للسيرفر (JSONP)
function updateRemoteMood(state) {
  if (busy) return;
  busy = true;
  const cb = 'cb_set_mood';
  const s = document.createElement('script');
  window[cb] = () => {
    delete window[cb];
    s.remove();
    busy = false;
  };
  s.src = `${API_URL}?id=${encodeURIComponent(COUPLE_ID)}&state=${state}&callback=${cb}&_=${Date.now()}`;
  document.head.appendChild(s);
}

if (toy) {
  fetchRemoteMood(); // جلب الحالة عند فتح الصفحة
  toy.addEventListener('click', () => {
    const isSad = toy.classList.contains('sad');
    const nextState = isSad ? 'happy' : 'sad';
    
    // أنيميشن الدوران
    if (figure) {
      figure.classList.remove('flip');
      void figure.offsetWidth; 
      figure.classList.add('flip');
    }
    
    applyMoodUI(nextState);
    updateRemoteMood(nextState);
  });
}

/* ================================
   NOTEBOOK (LOCAL STORAGE)
================================ */
const noteKey = 'note_lo';
const note = document.getElementById('memo');
const saveBtn = document.getElementById('saveMemo');

if (note && saveBtn) {
  note.value = localStorage.getItem(noteKey) || '';
  saveBtn.addEventListener('click', () => {
    localStorage.setItem(noteKey, note.value);
    saveBtn.textContent = 'Saved ✓';
    setTimeout(() => (saveBtn.textContent = 'Save'), 1200);
  });
}

/* ================================
   BREATHING COACH
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
   HEARTS BURST & FLOATING
================================ */
function spawnHeart() {
  const h = document.createElement('div');
  h.innerHTML = '💖';
  h.className = 'heart-float';
  h.style.position = 'fixed';
  h.style.left = Math.random() * 100 + 'vw';
  h.style.bottom = '-50px';
  h.style.fontSize = (16 + Math.random() * 20) + 'px';
  h.style.zIndex = '9999';
  h.style.pointerEvents = 'none';
  document.body.appendChild(h);
  
  // أنيميشن بسيط يدوي في حال لم يكن الـ CSS جاهزاً
  let pos = 0;
  const intrvl = setInterval(() => {
    pos += 2;
    h.style.transform = `translateY(-${pos}px)`;
    h.style.opacity = 1 - (pos/800);
    if(pos > 800) { h.remove(); clearInterval(intrvl); }
  }, 16);
}

const loveBtn = document.getElementById('confettiBtn');
if (loveBtn) {
  loveBtn.addEventListener('click', (e) => {
    e.preventDefault();
    for (let i = 0; i < 30; i++) setTimeout(spawnHeart, i * 50);
  });
}

/* ================================
   SMOOTH SCROLL & REVEAL
================================ */
document.addEventListener('DOMContentLoaded', () => {
  const down = document.getElementById('downLink');
  const target = document.getElementById('readySection');
  if (down && target) {
    down.addEventListener('click', (e) => {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    });
  }
  
  const card = document.getElementById('readyCard');
  if (card && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if(e.isIntersecting) { card.classList.add('show'); io.disconnect(); } });
    }, { threshold: 0.2 });
    io.observe(card);
  }
});