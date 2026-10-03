import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
import * as THREE from "three";

// Real Three.js scene/math/geometries with only GPU and DOM boundaries doubled.
// This checks resource and animation logic, not actual WebGL output or visual quality.
const compiled = ts.transpileModule(await readFile("lib/aqua-scene.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function fixture({ failSize = false, failRender = false, width = 620, height = 420 } = {}) {
  const host = new EventTarget();
  Object.assign(host, { clientWidth: width, clientHeight: height, children: [], appendChild(child) { this.children.push(child); }, getBoundingClientRect: () => ({ left: 0, top: 0, width, height }) });
  const state = { renders: 0, disposes: 0, losses: 0, failures: 0, disconnected: 0 };
  class Renderer {
    constructor() {
      state.renderer = this;
      this.domElement = new EventTarget();
      this.domElement.setAttribute = () => {};
      this.domElement.remove = () => host.children.splice(0);
    }
    setPixelRatio(value) { state.dpr = value; }
    setClearColor() {}
    setSize(w, h) { if (failSize) throw new Error("authored initialization failure"); state.size = [w, h]; }
    setAnimationLoop(callback) { state.loop = callback; }
    render(scene, camera) { if (failRender || state.failNext) throw new Error("authored render failure"); state.renders++; state.scene = scene; state.camera = camera; }
    dispose() { state.disposes++; }
    forceContextLoss() { state.losses++; }
  }
  class Resize {
    constructor(callback) { state.resize = callback; }
    observe() {}
    disconnect() { state.disconnected++; }
  }
  const loaded = { exports: {} };
  vm.runInNewContext(compiled, { module: loaded, exports: loaded.exports, require: (name) => { assert.equal(name, "three"); return { ...THREE, WebGLRenderer: Renderer }; }, window: { devicePixelRatio: 3 }, ResizeObserver: Resize, Float32Array });
  const create = () => loaded.exports.createAquaScene(host, () => state.failures++);
  return { host, state, create };
}
let count = 0;
function test(name, body) { body(); count++; console.log(`PASS ${name}`); }
test("Scene initializes one capped-resolution frame with finite real geometry", () => {
  const { host, state, create } = fixture(); const control = create();
  assert.equal(host.children.length, 1); assert.equal(state.dpr, 1.5); assert.equal(state.renders, 1); assert.equal(state.loop, undefined);
  let meshCount = 0;
  state.scene.traverse((object) => { if (object.isMesh) { meshCount++; assert.ok(Array.from(object.geometry.attributes.position.array).every(Number.isFinite)); } });
  assert.ok(meshCount > 10); control.dispose();
});
test("Portrait and zero-size mounts keep a finite camera and bounded drawing size", () => {
  const { host, state, create } = fixture({ width: 280, height: 310 }); const control = create();
  assert.ok(state.camera.right >= 3.55); assert.ok(state.camera.top >= 3.1);
  host.clientWidth = 0; host.clientHeight = 0; state.resize();
  assert.deepEqual(state.size, [1, 1]); assert.ok(Number.isFinite(state.camera.projectionMatrix.elements[0])); control.dispose();
});
test("Animation throttles draws and pause/resume does not advance hidden time", () => {
  const { state, create } = fixture(); const control = create();
  control.setRunning(true); state.loop(100); state.loop(116); assert.equal(state.renders, 2);
  state.loop(140); assert.equal(state.renders, 3);
  const water = state.scene.children[0].children.find((node) => node.geometry?.type === "PlaneGeometry");
  const previous = Array.from(water.geometry.attributes.position.array);
  const stale = state.loop; control.setRunning(false); assert.equal(state.loop, null); stale(90000); assert.equal(state.renders, 3);
  control.setRunning(true); state.loop(90000); assert.deepEqual(Array.from(water.geometry.attributes.position.array), previous); control.dispose();
});
test("Pointer motion affects decoration only while its loop is enabled", () => {
  const { host, state, create } = fixture(); const control = create();
  const event = new Event("pointermove"); Object.assign(event, { pointerType: "mouse", clientX: 620, clientY: 420 }); host.dispatchEvent(event);
  assert.equal(state.scene.children[0].rotation.y, 0); control.setRunning(true); state.loop(100);
  assert.ok(state.scene.children[0].rotation.y > 0); control.dispose();
});
test("Disposal releases every geometry/material and is safe to repeat", () => {
  const { host, state, create } = fixture(); const control = create(); let expected = 0, geometries = 0, materials = 0;
  state.scene.traverse((object) => { if (object.isMesh) { expected++; object.geometry.addEventListener("dispose", () => geometries++); object.material.addEventListener("dispose", () => materials++); } });
  control.setRunning(true); const callback = state.loop; control.dispose(); control.dispose(); callback(100); control.setRunning(true);
  assert.equal(geometries, expected); assert.equal(materials, expected); assert.equal(state.disposes, 1); assert.equal(state.losses, 1); assert.equal(state.disconnected, 1); assert.equal(host.children.length, 0); assert.equal(state.loop, null); assert.equal(state.renders, 1);
});
test("Context loss switches to fallback and cannot restart the failed renderer", () => {
  const { state, create } = fixture(); const control = create(); control.setRunning(true);
  const lost = new Event("webglcontextlost", { cancelable: true }); state.renderer.domElement.dispatchEvent(lost);
  assert.equal(lost.defaultPrevented, true); assert.equal(state.failures, 1); assert.equal(state.loop, null); control.setRunning(true); assert.equal(state.loop, null); control.dispose();
});
test("Rendering and initialization failures release or stop the affected resource", () => {
  const first = fixture({ failRender: true }); const control = first.create(); assert.equal(first.state.failures, 1); control.setRunning(true); assert.equal(first.state.loop, null); control.dispose();
  const second = fixture({ failSize: true }); assert.throws(second.create, /initialization failure/); assert.equal(second.state.disposes, 1); assert.equal(second.state.disconnected, 1); assert.equal(second.host.children.length, 0);
});
console.log(`${count}/${count} 3D lifecycle checks passed (GPU output not exercised).`);
