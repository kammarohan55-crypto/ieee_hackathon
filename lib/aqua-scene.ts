import * as THREE from "three";

/** An abstract optical sculpture. No input, telemetry or environmental data is rendered. */
export function createAquaScene(host: HTMLElement, onFailure: () => void) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  let observer: ResizeObserver | undefined;
  let disposed = false;
  let detach = () => {};
  function dispose() {
    if (disposed) return;
    disposed = true; observer?.disconnect(); renderer.setAnimationLoop(null); detach();
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
  }
  try {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-5, 5, 4, -4, 0.1, 50);
  camera.position.set(7, 7.7, 9);
  camera.lookAt(0, 0.1, 0);
  const sculpture = new THREE.Group();
  scene.add(sculpture);
  scene.add(new THREE.AmbientLight(0x89bed0, 2.4));
  const key = new THREE.DirectionalLight(0xe4fff2, 5);
  key.position.set(-4, 8, 3);
  const rim = new THREE.DirectionalLight(0x32b9e0, 3);
  rim.position.set(4, 3, -4);
  scene.add(key, rim);

  function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Group = sculpture) {
    geometries.push(geometry); materials.push(material);
    const object = new THREE.Mesh(geometry, material);
    parent.add(object);
    return object;
  }
  function metallic(color: number, opacity = 1) {
    return new THREE.MeshStandardMaterial({ color, metalness: 0.45, roughness: 0.28, transparent: opacity < 1, opacity, side: THREE.DoubleSide });
  }
  function light(color: number, opacity = 1) {
    return new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, side: THREE.DoubleSide, depthWrite: opacity === 1 });
  }
  // A floating instrument base and fine graticule, rather than a fictitious map.
  const base = mesh(new THREE.CylinderGeometry(3.55, 3.55, 0.12, 96), metallic(0x102b36));
  base.position.y = -0.65;
  const underside = mesh(new THREE.TorusGeometry(3.54, 0.025, 8, 112), light(0x32878e, 0.8));
  underside.rotation.x = Math.PI / 2; underside.position.y = -0.57;
  for (let radius = 0.65; radius < 3.5; radius += 0.55) {
    const circle = mesh(new THREE.TorusGeometry(radius, 0.006, 4, 96), light(0x477b80, 0.38));
    circle.rotation.x = Math.PI / 2; circle.position.y = -0.575;
  }
  for (let index = 0; index < 48; index++) {
    const angle = index / 48 * Math.PI * 2;
    const tick = mesh(new THREE.BoxGeometry(0.014, 0.012, index % 4 ? 0.09 : 0.19), light(0x89b7b3, index % 4 ? 0.4 : 0.8));
    tick.position.set(Math.sin(angle) * 3.34, -0.57, Math.cos(angle) * 3.34);
    tick.rotation.y = angle;
  }
  const water = new THREE.PlaneGeometry(1, 1, 28, 80);
  const positions = water.attributes.position;
  const original = Float32Array.from(positions.array);
  const river = mesh(water, new THREE.MeshPhysicalMaterial({
    color: 0x238b96, metalness: 0.36, roughness: 0.2, clearcoat: 1,
    clearcoatRoughness: 0.18, side: THREE.DoubleSide,
  }));
  river.position.y = -0.13;
  function riverX(z: number) { return Math.sin(z * 0.84) * 0.68; }
  function riverWidth(z: number) { return 1.02 + Math.cos(z * 1.3) * 0.17; }
  function surface(time: number) {
    for (let index = 0; index < positions.count; index++) {
      const u = original[index * 3] * 2;
      const z = original[index * 3 + 1] * 5.95;
      const x = riverX(z) + u * riverWidth(z);
      const y = Math.sin(z * 2.6 - time * 0.62 + u) * 0.065 + Math.cos(u * 5 + z * 1.4 + time * 0.38) * 0.035;
      positions.setXYZ(index, x, y, z);
    }
    positions.needsUpdate = true;
    water.computeVertexNormals();
  }
  // The banks and flowing filaments deliberately carry no measured meaning.
  for (const offset of [-1, -0.58, -0.16, 0.26, 0.64, 1]) {
    const points = Array.from({ length: 65 }, (_, index) => {
      const z = index / 64 * 5.9 - 2.95;
      return new THREE.Vector3(riverX(z) + offset * riverWidth(z), -0.02 + Math.sin(z * 2.6 + offset) * 0.065, z);
    });
    const path = new THREE.CatmullRomCurve3(points);
    mesh(new THREE.TubeGeometry(path, 80, Math.abs(offset) === 1 ? 0.012 : 0.005, 5, false), light(Math.abs(offset) === 1 ? 0xa2f4d8 : 0xa3e5e5, Math.abs(offset) === 1 ? 0.8 : 0.36));
  }

  const lens = new THREE.Group();
  lens.position.set(0, 0.85, 0);
  sculpture.add(lens);
  const ring = mesh(new THREE.TorusGeometry(2.18, 0.055, 12, 128), metallic(0x91d5ca), lens);
  ring.rotation.x = Math.PI / 2;
  const inner = mesh(new THREE.RingGeometry(1.97, 2.1, 96), metallic(0x183d47, 0.85), lens);
  inner.rotation.x = -Math.PI / 2; inner.position.y = 0.014;
  const arc = mesh(new THREE.TorusGeometry(2.27, 0.012, 6, 120, Math.PI * 1.6), light(0xb1f8d3), lens);
  arc.rotation.x = Math.PI / 2; arc.rotation.z = 0.5;
  const outer = mesh(new THREE.TorusGeometry(2.65, 0.007, 4, 120), light(0x6e9eaf, 0.55), lens);
  outer.rotation.x = Math.PI / 2; outer.position.y = -0.25;
  const glass = mesh(new THREE.CircleGeometry(1.97, 96), new THREE.MeshBasicMaterial({ color: 0x71d4ca, transparent: true, opacity: 0.055, side: THREE.DoubleSide, depthWrite: false }), lens);
  glass.rotation.x = -Math.PI / 2;
  for (let index = 0; index < 3; index++) {
    const angle = index / 3 * Math.PI * 2 + 0.4;
    const post = mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.42, 8), metallic(0x3d7076));
    post.position.set(Math.sin(angle) * 2.18, 0.14, Math.cos(angle) * 2.18);
    const cap = mesh(new THREE.SphereGeometry(0.045, 10, 8), light(0xd8eed8));
    cap.position.set(post.position.x, 0.88, post.position.z);
  }

  let failed = false, running = false, previous = 0, phase = 0;
  let pointerX = 0, pointerY = 0;
  const pointer = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    const bounds = host.getBoundingClientRect();
    pointerX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / Math.max(bounds.width, 1) * 2 - 1));
    pointerY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / Math.max(bounds.height, 1) * 2 - 1));
  };
  const leave = () => { pointerX = 0; pointerY = 0; };
  const fail = () => { failed = true; renderer.setAnimationLoop(null); onFailure(); };
  const lost = (event: Event) => { event.preventDefault(); fail(); };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  host.addEventListener("pointermove", pointer, { passive: true });
  host.addEventListener("pointerleave", leave);
  detach = () => {
    renderer.domElement.removeEventListener("webglcontextlost", lost);
    host.removeEventListener("pointermove", pointer); host.removeEventListener("pointerleave", leave);
  };
  function render() {
    if (disposed || failed) return;
    try { renderer.render(scene, camera); } catch { fail(); }
  }
  function resize() {
    if (disposed || failed) return;
    const width = Math.max(host.clientWidth, 1), height = Math.max(host.clientHeight, 1);
    const ratio = width / height;
    // Keep the whole sculpture in frame on portrait phones and wide desktops.
    const halfHeight = Math.max(3.1, 3.55 / ratio);
    camera.left = -halfHeight * ratio; camera.right = halfHeight * ratio;
    camera.top = halfHeight; camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    render();
  }
  function frame(time: number) {
    if (disposed || failed || !running) return;
    if (previous && time - previous < 1000 / 30) return;
    phase += previous ? Math.min((time - previous) / 1000, 0.1) : 0;
    previous = time;
    sculpture.rotation.y += (pointerX * 0.12 - sculpture.rotation.y) * 0.055;
    sculpture.rotation.x += (pointerY * 0.045 - sculpture.rotation.x) * 0.055;
    lens.rotation.y = Math.sin(phase * 0.22) * 0.08;
    surface(phase);
    render();
  }
  observer = new ResizeObserver(resize);
  surface(0); resize(); observer.observe(host);

  return {
    setRunning(value: boolean) {
      if (disposed || failed || running === value) return;
      running = value; previous = 0;
      renderer.setAnimationLoop(value ? frame : null);
    },
    dispose,
  };
  } catch (error) {
    dispose();
    throw error;
  }
}
