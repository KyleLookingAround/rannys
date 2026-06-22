/* Ranny's — a small low-poly enamel mug you can spin.
   Loaded lazily by app.js (only at the foot of the home page, only when
   WebGL is available and motion is allowed). A mug is a surface of
   revolution, so the whole body comes from one profile curve via
   LatheGeometry — no model files. Flat-shaded for the painted enamel look,
   with a soft contact shadow so it sits on the page.                        */
import * as THREE from 'three';

const MUSTARD = 0xc89a40, TERRA = 0xb4502a, RIM = 0x7a4220, COFFEE = 0x2c1d0e;

// procedural speckle for her stoneware glaze — a near-white base so the
// colour (material / vertex colours) shows through, with dark & light flecks
function stonewareMap() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#efefef'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1600; i++) {
    const r = Math.random() * 1.5 + 0.3;
    x.fillStyle = Math.random() > 0.5 ? 'rgba(30,20,10,0.55)' : 'rgba(255,250,235,0.5)';
    x.beginPath(); x.arc(Math.random() * 256, Math.random() * 256, r, 0, 7); x.fill();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// Ranny's storefront logo, printed onto the mug front. We load her line
// drawing, key out the cream paper to transparent and recolour the lines to
// a dark ink so it reads on the mustard glaze (rather than a pasted label).
// The image loads async; the texture updates itself once it's ready.
const LOGO_RATIO = 760 / 683;   // keep the decal at the artwork's aspect
function logoTexture() {
  const c = document.createElement('canvas'); c.width = 760; c.height = 683;
  const x = c.getContext('2d');
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const img = new Image();
  img.onload = () => {
    x.clearRect(0, 0, c.width, c.height);
    x.drawImage(img, 0, 0, c.width, c.height);
    const im = x.getImageData(0, 0, c.width, c.height), d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
      const ink = 1 - lum;                       // 0 = cream paper, ~0.5 = lines
      const a = ink > 0.15 ? Math.min(1, (ink - 0.09) * 2.4) : 0;
      d[i] = 36; d[i + 1] = 23; d[i + 2] = 16; d[i + 3] = Math.round(a * 255);
    }
    x.putImageData(im, 0, 0);
    t.needsUpdate = true;
  };
  img.src = './assets/mug-logo.jpg';
  return t;
}

export function mountMug(stage) {
  const size = () => Math.max(120, Math.min(stage.clientWidth, stage.clientHeight) || 300);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.55, 6.6);
  camera.lookAt(0, 0.05, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(size(), size());
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);
  stage.classList.add('is-3d');

  // lights — soft ambient fill, a key that casts the shadow, a cool rim
  scene.add(new THREE.HemisphereLight(0xfff6df, 0x6b4a30, 1.05));
  const key = new THREE.DirectionalLight(0xffffff, 1.45);
  key.position.set(2.6, 5.2, 3.4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1; key.shadow.camera.far = 14;
  key.shadow.camera.left = -2.4; key.shadow.camera.right = 2.4;
  key.shadow.camera.top = 2.4; key.shadow.camera.bottom = -2.4;
  key.shadow.radius = 5; key.shadow.bias = -0.0014;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xbfe0ff, 0.4);
  rim.position.set(-3, 1.5, -2);
  scene.add(rim);

  // soft contact shadow on a transparent ground plane
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.ShadowMaterial({ opacity: 0.26 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.04;
  ground.receiveShadow = true;
  scene.add(ground);

  const mug = new THREE.Group();
  const speckle = stonewareMap();
  const mustardMat = new THREE.MeshStandardMaterial({ color: MUSTARD, map: speckle, roughness: 0.85, metalness: 0.02 });
  const cast = (m) => { m.castShadow = true; return m; };

  // mug body — profile points (x = radius, y = height), revolved
  const profile = [
    [0.00, 0.00], [0.55, 0.00], [0.60, 0.05], [0.64, 0.30],
    [0.69, 0.95], [0.73, 1.44], [0.75, 1.52], [0.75, 1.56],
    [0.69, 1.54], [0.66, 1.46], [0.60, 0.35], [0.52, 0.18], [0.00, 0.16],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const bodyGeo = new THREE.LatheGeometry(profile, 44);
  bodyGeo.center();
  bodyGeo.translate(0, 0.06, 0);
  // two-tone glaze: mustard upper, terracotta lower band (via vertex colours)
  const cTop = new THREE.Color(MUSTARD), cBot = new THREE.Color(TERRA), cols = [];
  const pos = bodyGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) cols.push(...(pos.getY(i) < -0.34 ? cBot : cTop).toArray());
  bodyGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  mug.add(cast(new THREE.Mesh(bodyGeo,
    new THREE.MeshStandardMaterial({ vertexColors: true, map: speckle, roughness: 0.85, metalness: 0.02 }))));

  // her storefront logo, wrapped onto the front of the mug as a curved decal,
  // kept at the artwork's aspect ratio so the drawing isn't stretched
  const decalH = 0.60, decalR = 0.715;
  const decalTheta = (decalH * LOGO_RATIO) / decalR;
  const decalGeo = new THREE.CylinderGeometry(0.735, 0.70, decalH, 64, 1, true, -decalTheta / 2, decalTheta);
  const decal = new THREE.Mesh(decalGeo, new THREE.MeshStandardMaterial({
    map: logoTexture(), transparent: true, roughness: 0.8, metalness: 0.02,
    side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1,
  }));
  decal.position.y = 0.33;
  mug.add(decal);

  // darker rim at the lip
  const rimRing = cast(new THREE.Mesh(
    new THREE.TorusGeometry(0.745, 0.045, 14, 44),
    new THREE.MeshStandardMaterial({ color: RIM, roughness: 0.8 })
  ));
  rimRing.rotation.x = Math.PI / 2;
  rimRing.position.y = 0.83;
  mug.add(rimRing);

  // the coffee — a flat disc just below the lip
  const coffee = new THREE.Mesh(
    new THREE.CircleGeometry(0.70, 40),
    new THREE.MeshStandardMaterial({ color: COFFEE, roughness: 0.25, metalness: 0.1 })
  );
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 0.79;
  mug.add(coffee);

  // handle — a torus arc on the side
  const handle = cast(new THREE.Mesh(
    new THREE.TorusGeometry(0.33, 0.07, 16, 30, Math.PI * 1.15),
    mustardMat
  ));
  handle.position.set(0.74, 0.2, 0);
  handle.rotation.z = -Math.PI * 0.58;
  mug.add(handle);

  // mustard saucer
  const saucer = cast(new THREE.Mesh(
    new THREE.CylinderGeometry(1.12, 0.94, 0.09, 44),
    mustardMat
  ));
  saucer.position.y = -0.9;
  mug.add(saucer);

  mug.rotation.set(0.14, -0.5, 0);   // pleasing 3/4 view, handle showing
  scene.add(mug);

  // drag to spin, gentle auto-rotate otherwise
  const AUTO = 0.0032;
  let vx = 0, dragging = false, lastX = 0;
  const el = renderer.domElement;
  const down = (x) => { dragging = true; lastX = x; };
  const move = (x) => { if (!dragging) return; const d = (x - lastX) / 150; mug.rotation.y += d; vx = d; lastX = x; };
  const up = () => { dragging = false; };
  el.addEventListener('pointerdown', (e) => down(e.clientX));
  addEventListener('pointermove', (e) => move(e.clientX));
  addEventListener('pointerup', up);
  el.addEventListener('touchstart', (e) => down(e.touches[0].clientX), { passive: true });
  el.addEventListener('touchmove', (e) => move(e.touches[0].clientX), { passive: true });
  el.addEventListener('touchend', up);

  const resize = () => { const s = size(); renderer.setSize(s, s); };
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);

  let raf;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (!dragging) {
      if (Math.abs(vx) > 0.0005) { mug.rotation.y += vx; vx *= 0.95; }
      else { mug.rotation.y += AUTO; }
    }
    renderer.render(scene, camera);
  };
  loop();

  // pause the render loop when the mug is off-screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting && !raf) loop();
        else if (!e.isIntersecting && raf) { cancelAnimationFrame(raf); raf = 0; }
      });
    }).observe(stage);
  }
}
