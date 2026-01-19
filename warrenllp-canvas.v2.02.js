let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

function setRendererSize() {
  let newWidth = window.innerWidth > 991 ? window.innerWidth * 0.5 : window.innerWidth;
  let newHeight = window.innerHeight;

  camera.aspect = newWidth / newHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(newWidth, newHeight);
}

setRendererSize();
renderer.setClearColor(0x000000, 0);
renderer.domElement.className = "canvas-warren-llp";
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", setRendererSize, { passive: true });


// -----------------------------------------------------
// Points (unique speeds, slower min, no near-duplicates)
// -----------------------------------------------------
let radius = 2;
let points = [];

// speed settings
const minSpeed = 0.0015;
const maxSpeed = 0.019;
const minDifference = 0.0025;

// global slowdown (0.7 = 30% slower, 0.6 = 40% slower)
const TIME_SCALE = 0.65;

let generatedSpeeds = [];

function generateUniqueSpeed() {
  let s;
  let attempts = 0;
  do {
      s = minSpeed + Math.random() * (maxSpeed - minSpeed);
      attempts++;
      if (attempts > 40) break;
  } while (
      generatedSpeeds.some(v => Math.abs(v - s) < minDifference)
  );
  generatedSpeeds.push(s);
  return s;
}

for (let i = 0; i < 7; i++) {
  let angle = Math.random() * Math.PI * 2;
  let speed = generateUniqueSpeed();
  let direction = Math.random() < 0.5 ? -1 : 1;

  points.push({
      position: new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0),
      speed,
      direction,
      angle
  });
}


// -----------------------------------------------------
// Thick line with round caps
// -----------------------------------------------------
let lines = [];

function addLine(start, end) {
  const thickness = 0.025;

  let dir = end.clone().sub(start);
  let length = dir.length();

  let rectGeo = new THREE.PlaneGeometry(length, thickness);
  let material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  let rect = new THREE.Mesh(rectGeo, material);

  let mid = start.clone().add(end).multiplyScalar(0.5);
  rect.position.copy(mid);

  let angle = Math.atan2(end.y - start.y, end.x - start.x);
  rect.rotation.z = angle;

  let circleGeo = new THREE.CircleGeometry(thickness / 2, 24);
  let capStart = new THREE.Mesh(circleGeo, material);
  let capEnd   = new THREE.Mesh(circleGeo, material);

  capStart.position.copy(start);
  capEnd.position.copy(end);

  capStart.lookAt(camera.position);
  capEnd.lookAt(camera.position);

  let group = new THREE.Group();
  group.add(rect);
  group.add(capStart);
  group.add(capEnd);

  group.userData = { start, end };

  scene.add(group);

  return { line: group, start, end };
}


// -----------------------------------------------------
// Build line network
// -----------------------------------------------------
function initLines() {
  for (let i = 0; i < points.length; i++) {
      lines.push(addLine(points[i].position, points[(i + 1) % 7].position));
      lines.push(addLine(points[i].position, points[(i + 3) % 7].position));
  }
}

initLines();
camera.position.set(0, 0, 5);


// -----------------------------------------------------
// Animation (delta time)
// -----------------------------------------------------
let lastTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);

  // delta normalized to 60fps
  let delta = (now - lastTime) / 16.666;
  lastTime = now;

  // clamp delta to avoid jumps after tab sleep
  delta = Math.min(delta, 2);

  // move points
  for (let point of points) {
      point.angle += point.speed * point.direction * delta * TIME_SCALE;
      point.position.x = Math.cos(point.angle) * radius;
      point.position.y = Math.sin(point.angle) * radius;
  }

  // update lines
  for (let item of lines) {
      let start = item.start;
      let end   = item.end;

      let dir = end.clone().sub(start);
      let length = dir.length();

      let mid = start.clone().add(end).multiplyScalar(0.5);
      let angle = Math.atan2(end.y - start.y, end.x - start.x);

      let group = item.line;
      let rect = group.children[0];
      let capStart = group.children[1];
      let capEnd = group.children[2];

      rect.position.copy(mid);
      rect.rotation.z = angle;
      rect.scale.x = length / rect.geometry.parameters.width;

      capStart.position.copy(start);
      capEnd.position.copy(end);

      capStart.lookAt(camera.position);
      capEnd.lookAt(camera.position);
  }

  renderer.render(scene, camera);
}

animate(performance.now());
