// Hero curve field: rows of bell curves (the logo's curve) that respond to the pointer with a lag.
// One responsibility: show that a system responds to an intervention, late. Content never depends on it.
import {
  WebGLRenderer, Scene, OrthographicCamera, BufferGeometry, BufferAttribute,
  ShaderMaterial, LineSegments, Vector2, Color,
} from "three";

const ROWS = 34;
const COLS = 160;

const vertex = /* glsl */ `
  attribute float aRow;
  uniform float uTime;
  uniform float uAspect;
  uniform vec2 uPointer;
  uniform float uPush;
  varying float vRow;
  varying float vAlpha;
  void main() {
    float x = position.x * uAspect;                    // -aspect .. aspect
    float base = -0.92 + aRow * 1.62;
    float height = 0.10 + 0.34 * sin(aRow * 3.14159);
    float mu = 0.42 * uAspect + 0.10 * sin(uTime * 0.16 + aRow * 5.0);
    float sigma = 0.16 + 0.12 * aRow;
    float y = base + height * exp(-pow(x - mu, 2.0) / (2.0 * sigma * sigma));
    y += 0.006 * sin(x * 9.0 + uTime * 0.7 + aRow * 11.0);
    vec2 d = vec2(x, y) - uPointer;
    y += uPush * 0.16 * exp(-dot(d, d) / 0.045);
    vRow = aRow;
    vAlpha = smoothstep(-0.35 * uAspect, 0.45 * uAspect, x) * (0.28 + 0.62 * sin(aRow * 3.14159));
    gl_Position = vec4(x / uAspect, y, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uTeal;
  uniform vec3 uBlue;
  varying float vRow;
  varying float vAlpha;
  void main() {
    vec3 c = mix(uTeal, uBlue, smoothstep(0.15, 0.95, vRow));
    gl_FragColor = vec4(c, vAlpha);
  }
`;

export function createField(canvas, { stillTime = null } = {}) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const segs = ROWS * (COLS - 1);
  const pos = new Float32Array(segs * 2 * 3);
  const row = new Float32Array(segs * 2);
  let k = 0;
  for (let r = 0; r < ROWS; r++) {
    const rv = r / (ROWS - 1);
    for (let c = 0; c < COLS - 1; c++) {
      const x0 = -1 + (2 * c) / (COLS - 1);
      const x1 = -1 + (2 * (c + 1)) / (COLS - 1);
      pos.set([x0, 0, 0, x1, 0, 0], k * 6);
      row[k * 2] = rv; row[k * 2 + 1] = rv;
      k++;
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(pos, 3));
  geometry.setAttribute("aRow", new BufferAttribute(row, 1));

  const uniforms = {
    uTime: { value: stillTime ?? 0 },
    uAspect: { value: 1.6 },
    uPointer: { value: new Vector2(0.6, 0.0) },
    uPush: { value: stillTime != null ? 0.0 : 0.0 },
    uTeal: { value: new Color("#15D1B5") },
    uBlue: { value: new Color("#1A7DF2") },
  };
  const material = new ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, transparent: true, depthTest: false });
  const lines = new LineSegments(geometry, material);
  scene.add(lines);

  // Pointer, eased slowly on purpose: the lag is the message.
  const target = new Vector2(0.6, 0);
  let pushTarget = 0;
  let pending = null;
  const host = canvas.closest("section") || canvas.parentElement;

  function onMove(e) { pending = e; }
  function onLeave() { pushTarget = 0; }
  function readPointer() {
    if (!pending) return;
    const rect = canvas.getBoundingClientRect();
    const nx = ((pending.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((pending.clientY - rect.top) / rect.height) * 2 - 1);
    target.set(nx * uniforms.uAspect.value, ny);
    pushTarget = pending.pointerType === "touch" ? 0.7 : 1;
    pending = null;
  }

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    uniforms.uAspect.value = w / h;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  let raf = 0;
  let visible = true;
  let last = performance.now();
  let lost = false;

  function frame(now) {
    raf = 0;
    if (!visible || document.hidden || lost) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    readPointer();
    uniforms.uTime.value += dt;
    const p = uniforms.uPointer.value;
    p.x += (target.x - p.x) * 0.035;
    p.y += (target.y - p.y) * 0.035;
    uniforms.uPush.value += (pushTarget - uniforms.uPush.value) * 0.025;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf && !lost) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  if (stillTime != null) {
    renderer.render(scene, camera);
    return { destroy() { dispose(); }, still: true };
  }

  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; visible ? start() : stop(); });
  io.observe(canvas);
  const onVis = () => (document.hidden ? stop() : start());
  const onBlur = () => { pushTarget = 0; };
  const onLost = (e) => { e.preventDefault(); lost = true; stop(); canvas.classList.remove("is-live"); };
  host.addEventListener("pointermove", onMove, { passive: true });
  host.addEventListener("pointerleave", onLeave);
  window.addEventListener("blur", onBlur);
  document.addEventListener("visibilitychange", onVis);
  canvas.addEventListener("webglcontextlost", onLost);

  renderer.render(scene, camera);
  canvas.classList.add("is-live");
  start();

  function dispose() {
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  }

  return {
    destroy() {
      stop();
      io.disconnect();
      ro.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.classList.remove("is-live");
      dispose();
    },
  };
}
