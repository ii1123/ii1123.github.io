// ═══════════════════════════════════════════════════
//  globe.js  —  كوكب كارتوني 3D يدور ببطء
//  المتطلبات: Three.js (محمّل قبل هذا الملف)
// ═══════════════════════════════════════════════════

function initGlobe(containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;

  // ── أنشئ محتوى الـ container ──
  wrap.innerHTML = `
    <canvas id="globe-canvas3d"></canvas>
    <svg id="globe-cities-svg" viewBox="0 0 300 300" style="
      position:absolute;top:0;left:0;width:300px;height:300px;pointer-events:none;overflow:visible;">
      <line id="globe-connect-line"
        stroke="rgba(255,255,255,0.4)" stroke-width="1.5"
        stroke-dasharray="5 4" fill="none"
        x1="0" y1="0" x2="0" y2="0"
        style="transition:opacity .3s"/>
    </svg>
    <div class="globe-pin" id="globe-pin-khobar" style="display:none">
      <div class="globe-pin-emoji">💙</div>
      <div class="globe-pin-name globe-pin-name--blue">Al Khobar</div>
      <div class="globe-pin-dot-wrap">
        <div class="globe-pin-pulse globe-pin-pulse--blue"></div>
        <div class="globe-pin-dot globe-pin-dot--blue"></div>
      </div>
    </div>
    <div class="globe-pin" id="globe-pin-riyadh" style="display:none">
      <div class="globe-pin-emoji">💗</div>
      <div class="globe-pin-name globe-pin-name--pink">Riyadh</div>
      <div class="globe-pin-dot-wrap">
        <div class="globe-pin-pulse globe-pin-pulse--pink"></div>
        <div class="globe-pin-dot globe-pin-dot--pink"></div>
      </div>
    </div>
  `;

  // ── CSS ──
  if (!document.getElementById('globe-style')) {
    const style = document.createElement('style');
    style.id = 'globe-style';
    style.textContent = `
      #${containerId} {
        position: relative;
        width: 300px;
        height: 300px;
        margin: 0 auto 28px;
      }
      #globe-canvas3d {
        width: 300px !important;
        height: 300px !important;
        border-radius: 50%;
        filter:
          drop-shadow(0 0 36px rgba(255,77,109,.4))
          drop-shadow(0 0 70px rgba(138,180,255,.18));
        animation: globeFloat3d 5s ease-in-out infinite;
      }
      @keyframes globeFloat3d {
        0%,100% { transform: translateY(0); }
        50%      { transform: translateY(-7px); }
      }
      .globe-pin {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        pointer-events: none;
        transform: translate(-50%, -100%);
        transition: opacity .25s;
        z-index: 10;
      }
      .globe-pin-emoji { font-size: 18px; line-height: 1; filter: drop-shadow(0 2px 5px rgba(0,0,0,.6)); }
      .globe-pin-name {
        font-size: 10px; font-weight: 800;
        padding: 2px 9px; border-radius: 9px;
        background: rgba(5,8,22,.92);
        backdrop-filter: blur(8px);
        white-space: nowrap; letter-spacing: .4px;
        font-family: 'Tajawal', sans-serif;
      }
      .globe-pin-name--blue { color: #8ab4ff; border: 1px solid rgba(138,180,255,.35); }
      .globe-pin-name--pink { color: #ff8fab; border: 1px solid rgba(255,143,171,.35); }
      .globe-pin-dot-wrap {
        position: relative;
        width: 8px; height: 8px;
        display: flex; align-items: center; justify-content: center;
        margin-top: 2px;
      }
      .globe-pin-dot {
        width: 7px; height: 7px; border-radius: 50%; position: relative; z-index: 2;
      }
      .globe-pin-dot--blue { background:#8ab4ff; box-shadow:0 0 10px #8ab4ff,0 0 20px rgba(138,180,255,.5); }
      .globe-pin-dot--pink { background:#ff8fab; box-shadow:0 0 10px #ff8fab,0 0 20px rgba(255,143,171,.5); }
      .globe-pin-pulse {
        position: absolute; inset: 0;
        width: 7px; height: 7px; border-radius: 50%;
        top: 50%; left: 50%; transform: translate(-50%,-50%);
        animation: globePinPulse 2s ease-out infinite;
      }
      .globe-pin-pulse--blue { border: 1.5px solid rgba(138,180,255,.7); }
      .globe-pin-pulse--pink { border: 1.5px solid rgba(255,143,171,.7); animation-delay: .8s; }
      @keyframes globePinPulse {
        0%   { transform: translate(-50%,-50%) scale(1);   opacity: .9; }
        100% { transform: translate(-50%,-50%) scale(3.8); opacity: 0;  }
      }
      @keyframes globeConnectDash {
        to { stroke-dashoffset: -18; }
      }
      #globe-connect-line {
        animation: globeConnectDash 1.8s linear infinite;
      }
    `;
    document.head.appendChild(style);
  }

  // ── Three.js Setup ──
  const W = 300, H = 300;
  const canvas = document.getElementById('globe-canvas3d');
  canvas.width  = W * (window.devicePixelRatio || 1);
  canvas.height = H * (window.devicePixelRatio || 1);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 2.65;

  // ── إضاءة كارتونية ──
  scene.add(new THREE.AmbientLight(0x334466, 1.0));
  const sun = new THREE.DirectionalLight(0xfff5e0, 2.0);
  sun.position.set(4, 5, 4);
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x4488ff, 0.5);
  rim.position.set(-4, -2, -4);
  scene.add(rim);

  // ── رسم الـ Texture على Canvas 2D ──
  const T = 2048;
  const tc = document.createElement('canvas');
  tc.width = tc.height = T;
  const cx = tc.getContext('2d');

  // دالة تحويل lon/lat → px
  function ll(lon, lat) {
    return {
      x: ((lon + 180) / 360) * T,
      y: ((90 - lat) / 180) * T
    };
  }

  // دالة رسم شكل
  function shape(pts, fill, stroke, lw) {
    cx.beginPath();
    pts.forEach(([lon, lat], i) => {
      const p = ll(lon, lat);
      i === 0 ? cx.moveTo(p.x, p.y) : cx.lineTo(p.x, p.y);
    });
    cx.closePath();
    if (fill)   { cx.fillStyle = fill; cx.fill(); }
    if (stroke) { cx.strokeStyle = stroke; cx.lineWidth = lw || 2.5; cx.stroke(); }
  }

  // المحيط
  const og = cx.createLinearGradient(0, 0, 0, T);
  og.addColorStop(0,   '#1a6ec0');
  og.addColorStop(0.5, '#1462aa');
  og.addColorStop(1,   '#0b3d74');
  cx.fillStyle = og;
  cx.fillRect(0, 0, T, T);

  // خطوط المحيط الخفيفة
  cx.strokeStyle = 'rgba(255,255,255,0.05)';
  cx.lineWidth = 1;
  for (let i = 0; i < T; i += 50) {
    cx.beginPath(); cx.moveTo(0, i); cx.lineTo(T, i + 25); cx.stroke();
  }

  // ── أفريقيا — أخضر كارتوني ──
  shape([
    [-18,37],[5,37],[20,37],[35,30],[42,22],[50,12],[42,0],[38,-10],
    [34,-20],[28,-34],[20,-38],[14,-26],[10,-18],[8,-5],[2,5],[-5,5],
    [-15,12],[-18,20],[-18,37]
  ], '#4a9e52', 'rgba(0,0,0,0.18)');

  // صحراء شمال أفريقيا
  shape([
    [-18,37],[5,37],[20,37],[35,30],[38,22],[35,16],[25,16],[10,16],
    [0,14],[-10,14],[-18,20],[-18,37]
  ], '#d4a84b', null);

  // ── أوروبا ──
  shape([
    [-10,36],[0,36],[10,38],[18,40],[28,42],[32,50],[28,56],[20,58],
    [12,56],[5,58],[-2,54],[-8,46],[-10,42],[-10,36]
  ], '#5aaa60', 'rgba(0,0,0,0.15)');

  // ── آسيا (كبير) ──
  shape([
    [28,42],[38,38],[50,38],[65,42],[80,42],[95,50],[110,40],[120,30],
    [115,20],[110,10],[100,5],[90,10],[75,15],[60,20],[50,26],[44,32],
    [38,36],[28,42]
  ], '#5aaa60', 'rgba(0,0,0,0.13)');

  // ── الجزيرة العربية — نجمة المشروع ──
  shape([
    [37,30],[38,26],[40,20],[42,14],[44,12],[46,14],[48,18],
    [50,22],[52,24],[54,22],[56,20],[58,18],[56,14],[54,12],
    [52,14],[50,16],[48,20],[46,22],[44,22],[42,24],[40,26],[38,26],[37,30]
  ], '#e8c47a', 'rgba(100,60,0,0.25)', 3);

  // داخل السعودية (أفتح — الربع الخالي)
  shape([
    [39,28],[41,22],[43,18],[45,18],[47,20],[49,22],[51,24],
    [50,26],[47,26],[44,26],[41,26],[39,28]
  ], '#f5d898', null);

  // الحجاز (غرب السعودية — أغمق قليلاً)
  shape([
    [37,28],[38,22],[40,18],[42,16],[40,20],[39,26],[37,28]
  ], '#d4a84b', null);

  // ── البحر الأحمر ──
  shape([
    [33,30],[35,24],[37,20],[40,14],[42,12],[40,18],[38,24],[37,30],[33,30]
  ], '#1060b0', 'rgba(0,0,0,0.1)', 1);

  // ── الخليج العربي ──
  shape([
    [48,30],[50,28],[52,26],[54,24],[56,24],[58,22],[56,22],[54,22],
    [52,24],[50,26],[48,28],[48,30]
  ], '#1060b0', 'rgba(0,0,0,0.1)', 1);

  // ── إيران ──
  shape([
    [45,38],[50,38],[55,38],[60,36],[64,30],[60,26],[56,26],[52,28],
    [48,30],[46,34],[45,38]
  ], '#70b070', 'rgba(0,0,0,0.12)');

  // ── الهند ──
  shape([
    [68,24],[74,22],[78,18],[82,12],[80,8],[76,8],[70,12],[68,18],[68,24]
  ], '#7ab870', 'rgba(0,0,0,0.12)');

  // ── آسيا الشرق ──
  shape([
    [100,40],[110,40],[120,34],[126,28],[122,22],[116,22],[108,24],
    [100,28],[96,32],[100,40]
  ], '#6aaa68', 'rgba(0,0,0,0.1)');

  // ── أستراليا ──
  shape([
    [114,-22],[122,-18],[130,-16],[138,-14],[142,-18],[150,-24],
    [152,-28],[148,-36],[140,-38],[130,-32],[122,-28],[114,-22]
  ], '#c4904a', 'rgba(0,0,0,0.15)');

  // ── الأمريكتان ──
  shape([
    [-125,50],[-100,52],[-78,46],[-68,42],[-72,38],[-80,32],
    [-90,26],[-94,20],[-90,14],[-84,10],[-80,8],[-84,10],
    [-90,14],[-96,18],[-100,22],[-110,28],[-118,34],[-122,46],[-125,50]
  ], '#5aaa60', 'rgba(0,0,0,0.12)');

  shape([
    [-80,8],[-72,10],[-62,8],[-55,-2],[-50,-14],[-48,-28],
    [-54,-34],[-64,-40],[-68,-52],[-64,-54],[-68,-52],[-64,-40],
    [-54,-32],[-48,-24],[-46,-14],[-52,-4],[-60,4],[-70,8],[-80,8]
  ], '#5aaa60', 'rgba(0,0,0,0.1)');

  // ── غيوم كارتونية ──
  function drawCloud(lon, lat, size, opacity) {
    const p = ll(lon, lat);
    cx.save();
    cx.globalAlpha = opacity;
    cx.fillStyle = '#ffffff';
    const blobs = [
      [0, 0, size],
      [size * .65, -size * .2, size * .75],
      [-size * .6, -size * .15, size * .65],
      [size * .2, size * .25, size * .6],
    ];
    blobs.forEach(([dx, dy, r]) => {
      cx.beginPath();
      cx.arc(p.x + dx * (T/360) * .8, p.y + dy * (T/180) * .8, r * (T/360) * .5, 0, Math.PI*2);
      cx.fill();
    });
    cx.restore();
  }

  drawCloud(-20, 10,  40, .2);
  drawCloud( 60, 40,  32, .15);
  drawCloud(140, 35,  35, .16);
  drawCloud(-50, 30,  38, .18);
  drawCloud( 10, -10, 28, .14);
  drawCloud(100, 55,  30, .13);

  // ── Texture → Three.js ──
  const tex = new THREE.CanvasTexture(tc);
  const geo = new THREE.SphereGeometry(1, 64, 64);

  // Toon material للمظهر الكارتوني
  let mat;
  try {
    const gdata = new Uint8Array([40, 160, 255]);
    const gtex  = new THREE.DataTexture(gdata, 3, 1, THREE.LuminanceFormat);
    gtex.needsUpdate = true;
    mat = new THREE.MeshToonMaterial({ map: tex, gradientMap: gtex });
  } catch(e) {
    mat = new THREE.MeshLambertMaterial({ map: tex });
  }

  const globeMesh = new THREE.Mesh(geo, mat);
  // نبدأ بالجزيرة العربية تواجه المشاهد
  globeMesh.rotation.y = -(46 + 180) * Math.PI / 180;
  globeMesh.rotation.x = -24 * Math.PI / 180;
  scene.add(globeMesh);

  // هالة الغلاف الجوي
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(1.07, 64, 64),
    new THREE.MeshLambertMaterial({
      color: 0x4488ff, transparent: true,
      opacity: 0.07, depthWrite: false
    })
  );
  scene.add(atmo);

  // outline أسود خفيف (كارتوني)
  const outline = new THREE.Mesh(
    new THREE.SphereGeometry(1.005, 64, 64),
    new THREE.MeshBasicMaterial({
      color: 0x000000, side: THREE.BackSide,
      transparent: true, opacity: 0.1
    })
  );
  scene.add(outline);

  // ── دالة تحويل lat/lon → نقطة 3D ──
  function toVec3(lat, lon, r) {
    const phi   = (90 - lat)  * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }

  // ── project 3D → 2D screen ──
  function project3d(v3) {
    const v = v3.clone().project(camera);
    return {
      x: (v.x  *  .5 + .5) * W,
      y: (-v.y *  .5 + .5) * H,
      front: v.z < 0.99,
      depth: v.z
    };
  }

  const pinK = document.getElementById('globe-pin-khobar');
  const pinR = document.getElementById('globe-pin-riyadh');
  const line = document.getElementById('globe-connect-line');

  // مدن: الخبر (شمال شرق السعودية) والرياض (وسط)
  const KHOBAR = { lat: 26.22, lon: 50.20 };
  const RIYADH = { lat: 24.71, lon: 46.68 };

  // ── Animation Loop ──
  const SPEED = 0.0018;
  function animate() {
    requestAnimationFrame(animate);
    globeMesh.rotation.y += SPEED;
    renderer.render(scene, camera);

    // الخبر
    const wK = toVec3(KHOBAR.lat, KHOBAR.lon, 1);
    wK.applyEuler(globeMesh.rotation);
    const pK = project3d(wK);
    const fadeK = pK.front ? Math.min(1, (0.99 - pK.depth) * 25) : 0;
    pinK.style.display = pK.front ? 'flex' : 'none';
    pinK.style.opacity = fadeK;
    pinK.style.left = pK.x + 'px';
    pinK.style.top  = pK.y + 'px';

    // الرياض
    const wR = toVec3(RIYADH.lat, RIYADH.lon, 1);
    wR.applyEuler(globeMesh.rotation);
    const pR = project3d(wR);
    const fadeR = pR.front ? Math.min(1, (0.99 - pR.depth) * 25) : 0;
    pinR.style.display = pR.front ? 'flex' : 'none';
    pinR.style.opacity = fadeR;
    pinR.style.left = pR.x + 'px';
    pinR.style.top  = pR.y + 'px';

    // الخط الرابط
    if (pK.front && pR.front && fadeK > 0.3 && fadeR > 0.3) {
      line.setAttribute('x1', pK.x); line.setAttribute('y1', pK.y);
      line.setAttribute('x2', pR.x); line.setAttribute('y2', pR.y);
      line.style.opacity = Math.min(fadeK, fadeR);
    } else {
      line.style.opacity = '0';
    }
  }
  animate();
}
