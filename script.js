// ===== Settings you can change quickly =====
const HER_NAME = 'Lojain';
const MEET_DATE_ISO = '2025-03-21T00:00:00'; // Friday, March 21, 2025

// ===== Fill dynamic text (if you later add bindings) =====
// (Kept for future expansion—title already static in HTML)

// ===== Since counter =====
function updateSince() {
  const el = document.getElementById('sinceCounter');
  if (!el) return;
  const start = new Date(MEET_DATE_ISO).getTime();
  const diff = Math.max(0, Date.now() - start);
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  el.textContent = `${d} days, ${h} hrs, ${m} mins`;
}
updateSince();
setInterval(updateSince, 30_000);

// ===== Notebook (local only) =====
const noteKey = 'note_lo';
const note = document.getElementById('guestNote');
const saveBtn = document.getElementById('saveNote');
if (note && saveBtn) {
  try { note.value = localStorage.getItem(noteKey) || ''; } catch {}
  saveBtn.addEventListener('click', () => {
    try {
      localStorage.setItem(noteKey, note.value);
      saveBtn.textContent = 'Saved ✓';
      setTimeout(() => saveBtn.textContent = 'Save', 1200);
    } catch { alert('Couldn’t save locally.'); }
  });
}

// ===== Breathing coach text (loops tips) =====
const tips = [
  'Inhale 4 · Hold 4 · Exhale 6 — repeat',
  'Square: Inhale 4 · Hold 4 · Exhale 4 · Hold 4',
  '4–7–8: Inhale 4 · Hold 7 · Exhale 8',
];
let tipIdx = 0;
const hint = document.getElementById('breathHint');
setInterval(() => {
  if (!hint) return;
  tipIdx = (tipIdx + 1) % tips.length;
  hint.textContent = tips[tipIdx];
}, 7000);

// ===== Background hearts (gentle, continuous) =====
function spawnHeart() {
  const h = document.createElement('div');
  h.textContent = '💖';
  h.className = 'heart-float';
  h.style.left = Math.random() * 100 + 'vw';
  h.style.top = '-30px';
  h.style.fontSize = (16 + Math.random()*18) + 'px';
  h.style.setProperty('--drift', (Math.random()*120 - 60) + 'px');
  document.body.appendChild(h);
  setTimeout(() => h.remove(), 9500);
}
for (let i=0;i<18;i++) setTimeout(spawnHeart, i*300);
setInterval(spawnHeart, 1200);

// ===== Love button micro–confetti (hearts burst) =====
const loveBtn = document.getElementById('loveBtn');
if (loveBtn) {
  loveBtn.addEventListener('click', () => {
    for (let i=0;i<40;i++) setTimeout(spawnHeart, i*30);
  });
}
