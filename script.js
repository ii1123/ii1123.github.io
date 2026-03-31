/* ============================================================
   script.js — Lojain Project
   ============================================================

   لتغيير شيء في الموقع، عدّل settings.json فقط — لا تحتاج
   لتعديل هذا الملف إلا إذا أردت إضافة ميزة جديدة.

   ============================================================ */
(() => {

  /* ── Helpers ── */
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const prefersReduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ============================================================
     1. تحميل الإعدادات
     ============================================================ */
  const loadConfig = async () => {
    try {
      const res = await fetch('settings.json', { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e) { console.warn('⚠️ settings.json لم يُحمّل — استخدام القيم الافتراضية', e); }
    return null; // يُستخدم الـ fallback المكتوب في HTML
  };

  /* ============================================================
     2. ضبط --vh (مشكلة الموبايل)
     ============================================================ */
  const fixVH = () => {
    const set = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight*.01}px`);
    set();
    window.addEventListener('resize', set);
  };

  /* ============================================================
     3. عدّاد الوقت
     ============================================================ */
  const startCounter = (isoDate) => {
    const el = $('#sinceCounter');
    if (!el) return;
    const start = new Date(isoDate).getTime();
    const tick = () => {
      const diff = Math.max(0, Date.now() - start);
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      el.textContent = `✨ Together: ${d}d ${h}h ${m}m ${s}s ✨`;
    };
    tick();
    setInterval(tick, 1000);
  };

  /* ============================================================
     4. الاقتباسات الدوّارة
     ============================================================ */
  const initQuotes = (lines) => {
    const textEl = $('#quoteText');
    const dotsEl = $('#dots');
    if (!textEl || !dotsEl || !lines?.length) return;

    let idx = 0;
    let intervalId = null;
    let manualMode = false;

    lines.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'dot' + (i === 0 ? ' active' : '');
      dotsEl.appendChild(d);
    });

    const show = (i) => {
      textEl.classList.remove('in');
      textEl.classList.add('out');
      setTimeout(() => {
        textEl.textContent = lines[i];
        textEl.classList.remove('out');
        textEl.classList.add('in');
        $$('.dot').forEach((d, k) => d.classList.toggle('active', k === i));
      }, 400);
    };

    const showText = (text) => {
      textEl.classList.remove('in');
      textEl.classList.add('out');
      setTimeout(() => {
        textEl.textContent = text;
        textEl.classList.remove('out');
        textEl.classList.add('in');
      }, 220);
    };

    const stopAuto = () => {
      manualMode = true;
      if (intervalId) clearInterval(intervalId);
      dotsEl.style.opacity = '.3';
    };

    textEl.textContent = lines[0];
    textEl.classList.add('in');
    intervalId = setInterval(() => {
      if (manualMode) return;
      idx = (idx + 1) % lines.length;
      show(idx);
    }, 3200);

    return { showText, stopAuto };
  };

  /* ============================================================
     5. النجوم والقلوب
     ============================================================ */
  const initParticles = () => {
    if (prefersReduced) return;

    // نجوم
    const starsEl = $('#stars');
    if (starsEl) {
      const frag = document.createDocumentFragment();
      for (let i = 0; i < 90; i++) {
        const s = document.createElement('div');
        s.className = 'star';
        const sz = (Math.random() * 2 + 1).toFixed(1);
        s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}vw;top:${Math.random()*100}vh;animation-delay:${(Math.random()*7).toFixed(2)}s;animation-duration:${(4+Math.random()*5).toFixed(1)}s;`;
        frag.appendChild(s);
      }
      starsEl.appendChild(frag);
    }

    // قلوب
    const heartsEl = $('#hearts');
    if (heartsEl) {
      const emojis = ['❤️', '🩷', '💕', '✨', '💖', '🌸'];
      const spawn = () => {
        const h = document.createElement('div');
        h.className = 'heart-p';
        h.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        h.style.left = Math.random() * 100 + 'vw';
        h.style.bottom = '-30px';
        h.style.animationDuration = (9 + Math.random() * 7).toFixed(1) + 's';
        heartsEl.appendChild(h);
        setTimeout(() => h.remove(), 16000);
      };
      spawn();
      setInterval(spawn, 800);
    }
  };

  /* ============================================================
     6. Confetti
     ============================================================ */
  const initConfetti = () => {
    const btn = $('#confettiBtn');
    if (!btn) return;
    btn.addEventListener('click', e => {
      e.preventDefault();
      if (prefersReduced) return;
      const hearts = ['❤', '💕', '💖', '💗', '✨'];
      for (let i = 0; i < 32; i++) {
        const p = document.createElement('div');
        p.className = 'confetti-piece';
        p.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        p.style.left = `${e.clientX + (Math.random() * 70 - 35)}px`;
        p.style.top = `${e.clientY + (Math.random() * 22 - 10)}px`;
        p.style.fontSize = `${14 + Math.random() * 8}px`;
        document.body.appendChild(p);
        let dx = (Math.random() - .5) * 6;
        let dy = -(2 + Math.random() * 4);
        let x = 0, y = 0, life = 0, rot = Math.random() * 30 - 15;
        const t = setInterval(() => {
          life++;
          x += dx;
          y += dy - life * .06;
          rot += dx * .8;
          p.style.transform = `translate(${x}px,${y}px) rotate(${rot}deg) scale(${1 - life / 90})`;
          p.style.opacity = String(1 - life / 50);
          if (life > 50) { clearInterval(t); p.remove(); }
        }, 16);
      }
    });
  };

  /* ============================================================
     7. BREATHING ENGINE ← الجزء الجديد
     ============================================================
     يُشغّل دورة تنفس حقيقية مزامنة مع الأنيميشن:
       inhale → hold1 → exhale → hold2 → (repeat)
     كل شيء مبني على requestAnimationFrame لأقصى سلاسة.
     ============================================================ */
  const initBreathing = (cfg) => {
    const dot   = $('.breathe-dot');
    const arc   = $('.breathe-arc');
    const label = $('.breathe-phase-label');
    const sub   = $('.breathe-phase-sub');
    const cdEl  = $('.breathe-countdown');
    if (!dot || !arc) return;

    // مراحل الدورة — كل phase: [اسم للعرض, مدة بالثانية, scale صغير→كبير, نص فرعي]
    const phases = [
      { name: '🌬️ Inhale',  dur: cfg.inhale, scaleFrom: 1,   scaleTo: 1.9, hint: `Breathe in for ${cfg.inhale}s...`  },
      { name: '🤫 Hold',    dur: cfg.hold1,  scaleFrom: 1.9, scaleTo: 1.9, hint: `Hold for ${cfg.hold1}s...`         },
      { name: '😮‍💨 Exhale', dur: cfg.exhale, scaleFrom: 1.9, scaleTo: 1,   hint: `Breathe out for ${cfg.exhale}s...` },
    ];
    if (cfg.hold2 > 0) {
      phases.push({ name: '🤫 Hold', dur: cfg.hold2, scaleFrom: 1, scaleTo: 1, hint: `Hold for ${cfg.hold2}s...` });
    }

    const totalDur = phases.reduce((s, p) => s + p.dur, 0); // مجموع ثواني دورة واحدة
    const ARC_FULL = 345; // stroke-dasharray

    // دالة easing ناعمة (ease-in-out)
    const easeInOut = (t) => t < .5 ? 2*t*t : -1+(4-2*t)*t;

    // نقطة البداية (timestamp)
    let startTime = null;

    const tick = (ts) => {
      if (!startTime) startTime = ts;
      const elapsed = ((ts - startTime) / 1000) % totalDur; // ثواني داخل الدورة الحالية

      // تحديد المرحلة الحالية
      let acc = 0;
      let phaseIdx = 0;
      let phaseElapsed = 0;
      for (let i = 0; i < phases.length; i++) {
        if (elapsed < acc + phases[i].dur) {
          phaseIdx = i;
          phaseElapsed = elapsed - acc;
          break;
        }
        acc += phases[i].dur;
      }

      const phase = phases[phaseIdx];
      const t = easeInOut(Math.min(phaseElapsed / phase.dur, 1));

      // ── Scale النقطة ──
      const scale = phase.scaleFrom + (phase.scaleTo - phase.scaleFrom) * t;
      dot.style.transform = `scale(${scale.toFixed(3)})`;

      // ── Glow ──
      const glowSize = 15 + (scale - 1) * 25;
      dot.style.boxShadow = `0 0 ${glowSize.toFixed(0)}px var(--accent), 0 0 ${(glowSize*2).toFixed(0)}px rgba(255,77,109,.25)`;

      // ── Arc SVG — يدور مع الدورة الكاملة ──
      const arcProgress = elapsed / totalDur;
      arc.style.strokeDashoffset = String(ARC_FULL * (1 - arcProgress));

      // ── النصوص ──
      const remaining = Math.ceil(phase.dur - phaseElapsed);
      if (label) label.textContent = phase.name;
      if (sub)   sub.textContent   = phase.hint;
      if (cdEl)  cdEl.textContent  = remaining > 0 ? remaining : '';

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  /* ============================================================
     8. Memo (دفتر الملاحظات)
     ============================================================ */
  const initMemo = () => {
    const memo = $('#memo');
    const btn  = $('#saveMemo');
    if (!memo || !btn) return;
    const KEY = 'memo_lojain';
    try { memo.value = localStorage.getItem(KEY) || ''; } catch (_) {}
    btn.addEventListener('click', () => {
      try {
        localStorage.setItem(KEY, memo.value);
        const orig = btn.textContent;
        btn.textContent = '✓ Saved!';
        setTimeout(() => btn.textContent = orig, 1800);
      } catch (e) { console.warn('Memo save failed', e); }
    });
  };

  /* ============================================================
     9. Memory book
     ============================================================ */
  const initMemoryBook = () => {
    const book = $('#memoryBook');
    const dots = $('#memoryBookDots');
    if (!book || !dots) return;

    const photos = [
      'album-images/Desktop_Screenshot_2026.03.15_-_13.08.14.93.png',
      'album-images/Desktop_Screenshot_2026.03.15_-_13.11.10.41.png',
      'album-images/Overwatch_2_Screenshot_2026.03.17_-_14.20.59.98.png',
      'album-images/Overwatch_2_Screenshot_2026.03.17_-_14.27.01.91.png',
      'album-images/Overwatch_2_Screenshot_2026.03.17_-_14.34.05.99.png',
      'album-images/Overwatch_2_Screenshot_2026.03.17_-_15.53.18.38.png'
    ];

    const spreads = [];
    for (let i = 0; i < photos.length; i += 2) {
      spreads.push(photos.slice(i, i + 2));
    }
    if (!spreads.length) return;

    let current = 0;
    let flipping = false;

    dots.innerHTML = spreads.map((_, i) => `<span class="memory-book-dot${i === 0 ? ' active' : ''}"></span>`).join('');

    const render = () => {
      const spread = spreads[current];
      const pageHtml = spread.map((src, idx) => `
        <div class="memory-book-page">
          <img src="${src}" alt="Memory photo ${current * 2 + idx + 1}" loading="lazy" />
          <div class="memory-book-label">Page ${current + 1} · Photo ${current * 2 + idx + 1}</div>
        </div>
      `).join('');

      book.innerHTML = `
        <div class="memory-book-spread">
          ${pageHtml}
        </div>
        <div class="memory-book-meta">
          <span>Our little gaming memories</span>
          <span>${current + 1} / ${spreads.length}</span>
        </div>
      `;
      $$('.memory-book-dot').forEach((dot, i) => dot.classList.toggle('active', i === current));
    };

    const flip = () => {
      if (flipping) return;
      flipping = true;
      book.classList.add('is-flipping');
      setTimeout(() => {
        current = (current + 1) % spreads.length;
        render();
        book.classList.remove('is-flipping');
        setTimeout(() => { flipping = false; }, 120);
      }, 380);
    };

    render();
    book.addEventListener('click', flip);
    book.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        flip();
      }
    });
  };

  /* ============================================================
     9. Smooth Scroll
     ============================================================ */
  const initDailyMessage = (quoteApi) => {
    const link   = $('#downLink');
    if (!link || !quoteApi) return;

    const messages = [
      "You are my favorite part of every day.",
      "No matter how heavy today feels, I am always with you.",
      "You make my world softer, warmer, and brighter.",
      "I still smile every time I remember that you chose me.",
      "If your heart is tired, let mine hold it for a while.",
      "You are my peace in the middle of everything.",
      "I love the way your existence makes ordinary days feel special.",
      "Even on quiet days, my heart is full of you.",
      "You are the sweetest thing my life has ever known.",
      "If I could, I would wrap you in comfort every single day.",
      "You are never alone for as long as I am here.",
      "My favorite place will always be wherever you are.",
      "I am so proud of you, even on days you doubt yourself.",
      "You are more loved than you realize, and more precious than words can say.",
      "Every little thing about you feels like home to me.",
      "You are the calm my heart always looks for.",
      "I hope today is gentle with you, and if it is not, I will be.",
      "You being in my life still feels like a beautiful miracle.",
      "I would choose you again in every version of life.",
      "You make love feel easy, safe, and real.",
      "You deserve softness, patience, and all the good things.",
      "I hope you always remember how deeply cherished you are.",
      "You are my favorite notification, memory, and future thought.",
      "When you are happy, my heart feels lighter too.",
      "You are the loveliest chapter of my story.",
      "If the world feels loud, come rest in my love.",
      "I love your heart, your smile, your soul, and all your little details.",
      "There is nothing ordinary about you to me.",
      "You are the person I thank life for the most.",
      "My day always gets better the moment I think of you.",
      "You are my once-in-a-lifetime kind of love.",
      "No matter what happens today, I am on your side.",
      "Your existence alone makes the world prettier to me.",
      "You are my favorite comfort and my favorite excitement.",
      "I hope you feel my love around you even when I am not near.",
      "You are the reason my heart learned how to feel safe.",
      "I love you in all your moods, all your moments, all your versions.",
      "You are my soft place to land.",
      "I still get grateful just thinking about us.",
      "Your smile has a permanent place in my heart.",
      "I want your days to feel lighter because of my love.",
      "You are the best thing that ever stayed in my heart.",
      "Even your silence feels close to me.",
      "You are my sweetest habit and my favorite feeling.",
      "Loving you is the easiest truth I know.",
      "You matter to me in ways I can never fully explain.",
      "I hope life gives you reasons to smile today, and if not, let me be one.",
      "You are my sunshine on good days and my shelter on hard ones.",
      "I adore you more than these words can hold.",
      "If I could send you one thing right now, it would be my arms around you."
    ];

    let lastIndex = -1;

    link.addEventListener('click', e => {
      e.preventDefault();
      quoteApi.stopAuto();
      let next = Math.floor(Math.random() * messages.length);
      if (messages.length > 1) {
        while (next === lastIndex) next = Math.floor(Math.random() * messages.length);
      }
      lastIndex = next;
      quoteApi.showText(messages[next]);
    });
  };

  /* ============================================================
     10. Mood Toy
     ============================================================ */
  const initMoodToy = (apiUrl, coupleId) => {
    const toy   = $('#moodToy');
    const label = $('#toyLabel');
    if (!toy) return;
    const KEY = 'lojain_mood';

    const apply = (mood) => {
      const sad = mood === 'sad';
      toy.classList.toggle('sad',   sad);
      toy.classList.toggle('happy', !sad);
      label.textContent = sad ? '😢 Mood: Sad' : '😊 Mood: Happy';
    };

    apply(localStorage.getItem(KEY) || 'happy');

    const fetchMood = async () => {
      try {
        const res = await fetch(`${apiUrl}?action=get&id=${coupleId}&t=${Date.now()}`);
        const d   = await res.json();
        if (d.success && d.mood) { localStorage.setItem(KEY, d.mood); apply(d.mood); }
      } catch (_) {}
    };
    const setMood = async (mood) => {
      localStorage.setItem(KEY, mood);
      apply(mood);
      try { await fetch(`${apiUrl}?action=set&id=${coupleId}&mood=${mood}&t=${Date.now()}`); } catch (_) {}
    };

    toy.addEventListener('click', () => setMood(toy.classList.contains('sad') ? 'happy' : 'sad'));
    fetchMood();
    setInterval(fetchMood, 5000);
  };

  /* ============================================================
     11. Ready animation
     ============================================================ */
  const initReadyAnimation = () => {
    const container = $('#ready-animation');
    if (!container || typeof lottie === 'undefined') return;

    lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: 'ready-animation.json'
    });
  };

  /* ============================================================
     11. Ready Card animation
     ============================================================ */
  const initReadyCard = () => {
    const card = $('#readyCard');
    if (!card) return;
    if (!('IntersectionObserver' in window)) { card.classList.add('show'); return; }
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { card.classList.add('show'); io.disconnect(); }
    }, { threshold: .15 });
    io.observe(card);
  };

  /* ============================================================
     12. بناء HTML الديناميكي من settings.json
     ============================================================ */
  const populateDynamic = (cfg) => {
    // عنوان البطاقة الرئيسية
    const heroName = $('.hero-name');
    if (heroName) heroName.textContent = `${cfg.herName} ❤️`;

    const heroSub = $('.hero-sub');
    if (heroSub) heroSub.textContent = `If you ever feel overwhelmed, open this page. I'm here — always. — ${cfg.hisSignature}`;

    // support items
    const supportList = $('.support-items');
    if (supportList && cfg.supportItems?.length) {
      supportList.innerHTML = cfg.supportItems.map(
        it => `<div class="support-item"><span class="support-icon">${it.icon}</span><span>${it.text}</span></div>`
      ).join('');
    }

    // grateful section
    const gTitle = $('.grateful-title');
    const gText  = $('.grateful-text');
    const gSub   = $('.grateful-sub');
    if (gTitle) gTitle.textContent = cfg.gratefulTitle;
    if (gText)  gText.textContent  = cfg.gratefulText; // white-space: pre-line يُطبّق الأسطر
    if (gSub)   gSub.textContent   = cfg.gratefulSub;

    // distance
    const dName = $$('.d-name');
    const dKm   = $('.d-km');
    if (dName[0]) dName[0].textContent = cfg.cityFrom;
    if (dName[1]) dName[1].textContent = cfg.cityTo;
    if (dKm)     dKm.textContent       = `${cfg.distanceKm} km`;

    // footer
    const footer = $('.page-footer');
    if (footer) footer.textContent = `Made with endless care — ${cfg.hisSignature}`;
  };

  /* ============================================================
     13. Service Worker
     ============================================================ */
  const registerSW = () => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () =>
        navigator.serviceWorker.register('sw.js')
          .then(r  => console.log('✅ SW:', r.scope))
          .catch(e => console.warn('⚠️ SW failed', e))
      );
    }
  };

  /* ============================================================
     INIT
     ============================================================ */
  (async () => {
    const cfg = await loadConfig();

    fixVH();
    if (cfg) populateDynamic(cfg);

    const lines   = cfg?.lines     || window.FALLBACK_LINES || [];
    const breath  = cfg?.breathing || { inhale:4, hold1:4, exhale:6, hold2:0 };
    const apiUrl  = cfg?.moodApiUrl || '';
    const cplId   = cfg?.coupleId  || 'lojain_a23';
    const meetDt  = cfg?.meetDateIso || '2025-03-21T06:09:00';

    startCounter(meetDt);
    const quoteApi = initQuotes(lines);
    initParticles();
    initConfetti();
    initBreathing(breath);
    initMemo();
    initMemoryBook();
    initDailyMessage(quoteApi);
    initMoodToy(apiUrl, cplId);
    initReadyAnimation();
    initReadyCard();
    registerSW();
  })();

})();
