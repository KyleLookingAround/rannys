/* Ranny's — a small low-poly enamel mug you can spin.
   Loaded lazily by app.js (only on the home hero, only when WebGL is
   available and motion is allowed). A mug is a surface of revolution, so
   the whole body comes from one profile curve via LatheGeometry — no model
   files. Flat-shaded for the painted, faceted enamel look.                */
import * as THREE from 'three';

const LIME = 0xc5dd24, BROWN = 0x241710, COFFEE = 0x33220f, CREAM = 0xf4ecd8;

export function mountMug(stage) {
  const size = () => Math.max(120, Math.min(stage.clientWidth, stage.clientHeight) || 360);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.35, 6.4);
  camera.lookAt(0, 0.1, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(size(), size());
  stage.appendChild(renderer.domElement);
  stage.classList.add('is-3d');

  // lights — a soft fill plus a key for chunky flat-shaded facets
  scene.add(new THREE.HemisphereLight(0xfff4d6, 0x4a3220, 0.95));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(3, 5, 4);
  scene.add(key);

  const mug = new THREE.Group();

  // mug body — profile points (x = radius, y = height), revolved
  const profile = [
    [0.00, 0.00], [0.62, 0.00], [0.66, 0.06], [0.70, 0.85],
    [0.78, 1.46], [0.78, 1.52], [0.72, 1.50], [0.66, 1.40],
    [0.60, 0.30], [0.54, 0.16], [0.00, 0.14],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const bodyGeo = new THREE.LatheGeometry(profile, 40);
  bodyGeo.center();
  bodyGeo.translate(0, 0.05, 0);
  const enamel = new THREE.MeshStandardMaterial({ color: LIME, roughness: 0.45, metalness: 0.05, flatShading: true });
  mug.add(new THREE.Mesh(bodyGeo, enamel));

  // brown rim ring at the lip
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.75, 0.05, 12, 40),
    new THREE.MeshStandardMaterial({ color: BROWN, roughness: 0.5, flatShading: true })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.80;
  mug.add(rim);

  // the coffee — a flat disc near the lip
  const coffee = new THREE.Mesh(
    new THREE.CircleGeometry(0.70, 36),
    new THREE.MeshStandardMaterial({ color: COFFEE, roughness: 0.3 })
  );
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 0.74;
  mug.add(coffee);

  // handle — a torus arc on the side
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.34, 0.075, 12, 28, Math.PI * 1.25),
    enamel
  );
  handle.position.set(0.78, 0.18, 0);
  handle.rotation.z = -Math.PI * 0.62;
  mug.add(handle);

  // saucer
  const saucer = new THREE.Mesh(
    new THREE.CylinderGeometry(1.18, 1.0, 0.10, 40),
    new THREE.MeshStandardMaterial({ color: CREAM, roughness: 0.6, flatShading: true })
  );
  saucer.position.y = -0.92;
  mug.add(saucer);

  mug.rotation.x = 0.12;
  scene.add(mug);

  // drag to spin, gentle auto-rotate otherwise
  let spin = 0.0045, vx = 0, dragging = false, lastX = 0;
  const el = renderer.domElement;
  const down = (x) => { dragging = true; lastX = x; spin = 0; };
  const move = (x) => { if (!dragging) return; const d = (x - lastX) / 140; mug.rotation.y += d; vx = d; lastX = x; };
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
      if (Math.abs(vx) > 0.0006) { mug.rotation.y += vx; vx *= 0.95; }
      else { mug.rotation.y += spin || 0.0045; }
    }
    renderer.render(scene, camera);
  };
  loop();

  // pause when off-screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting && !raf) loop(); else if (!e.isIntersecting && raf) { cancelAnimationFrame(raf); raf = 0; } });
    }).observe(stage);
  }
}
