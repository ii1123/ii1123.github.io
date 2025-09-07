const HER_NAME = 'Lujain';
const MEET_DATE = '2024-06-01T00:00:00';

document.getElementById('heroName').textContent = HER_NAME;

// counter
function updateSince() {
  const sinceEl = document.getElementById('sinceCounter');
  const start = new Date(MEET_DATE).getTime();
  const now = Date.now();
  const diff = now - start;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  sinceEl.textContent = `${days} days`;
}
updateSince();
setInterval(updateSince, 1000);

// notebook
const note = document.getElementById('guestNote');
const saveBtn = document.getElementById('saveNote');
note.value = localStorage.getItem('note') || '';
saveBtn.addEventListener('click', () => {
  localStorage.setItem('note', note.value);
  alert('Saved ✅');
});

// hearts
const readyBtn = document.getElementById('readyBtn');
const heartRain = document.getElementById('heartRain');
readyBtn.addEventListener('click', () => {
  for (let i = 0; i < 30; i++) {
    const heart = document.createElement('div');
    heart.textContent = '💖';
    heart.style.position = 'fixed';
    heart.style.left = Math.random() * 100 + 'vw';
    heart.style.top = '-20px';
    heart.style.fontSize = '20px';
    document.body.appendChild(heart);
    let y = 0;
    const fall = setInterval(() => {
      y += 2;
      heart.style.top = y + 'px';
      if (y > window.innerHeight) {
        heart.remove();
        clearInterval(fall);
      }
    }, 30);
  }
});
