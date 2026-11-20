import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const canvas = document.querySelector('#scene');
const loading = document.querySelector('#loading');
const error = document.querySelector('#error');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#090611', 900, 2600);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 10000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = .06;
controls.enablePan = false;
controls.minDistance = 70;
controls.maxDistance = 1400;

scene.add(new THREE.HemisphereLight('#e5c4ff', '#11091d', 2.2));
const key = new THREE.DirectionalLight('#fff0ff', 5);
key.position.set(350, 600, 450);
scene.add(key);
const rim = new THREE.PointLight('#ad50ff', 900, 1300, 2);
rim.position.set(-450, 180, -250);
scene.add(rim);
const fill = new THREE.PointLight('#36a8ff', 650, 1000, 2);
fill.position.set(400, 80, 250);
scene.add(fill);

const world = new THREE.Group();
scene.add(world);
const grid = new THREE.GridHelper(1800, 30, '#673d7e', '#241832');
grid.position.y = -410;
world.add(grid);
const platform = new THREE.Mesh(new THREE.CylinderGeometry(430, 470, 12, 96), new THREE.MeshStandardMaterial({ color: '#120b1d', metalness: .75, roughness: .33 }));
platform.position.y = -420;
world.add(platform);

let model;
const initial = { position: new THREE.Vector3(), target: new THREE.Vector3() };
new GLTFLoader().load('scene.gltf', (gltf) => {
  model = gltf.scene;
  model.traverse((object) => {
    if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; }
  });
  world.add(model);
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  model.position.sub(center);
  // The downloaded asset is very large in its source units; frame it automatically.
  const radius = Math.max(size.x, size.y, size.z) * .62;
  camera.position.set(radius * .95, radius * .42, radius * 1.35);
  controls.target.set(0, 0, 0);
  controls.minDistance = radius * .55;
  controls.maxDistance = radius * 3.2;
  initial.position.copy(camera.position);
  initial.target.copy(controls.target);
  loading.style.display = 'none';
}, undefined, () => { loading.style.display = 'none'; error.hidden = false; });

const keys = new Set();
addEventListener('keydown', (event) => { keys.add(event.key.toLowerCase()); if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(event.key.toLowerCase())) event.preventDefault(); });
addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
document.querySelector('#reset').addEventListener('click', () => {
  camera.position.copy(initial.position); controls.target.copy(initial.target); controls.update();
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .05);
  const move = 150 * dt;
  const turn = 1.45 * dt;
  if (model) {
    if (keys.has('a') || keys.has('arrowleft')) model.rotation.y += turn;
    if (keys.has('d') || keys.has('arrowright')) model.rotation.y -= turn;
    if (keys.has('w') || keys.has('arrowup')) model.position.z -= move;
    if (keys.has('s') || keys.has('arrowdown')) model.position.z += move;
  }
  controls.update();
  renderer.render(scene, camera);
}
animate();
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
