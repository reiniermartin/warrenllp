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

window.addEventListener('resize', setRendererSize, { passive: true });

let radius = 2;
let points = [];
const speeds = [0.01, 0.002, 0.0145, 0.0125, 0.019, 0.0065, 0.0095];
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

for (let i = 0; i < 7; i++) {
    let angle = Math.random() * 2 * Math.PI;
    let speed = speeds[i] || 0.05;
    let direction = (i & 1) === 0 ? -1 : 1;

    points.push({
        position: new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0),
        speed: speed,
        direction: direction,
        angle: angle
    });
}

let lines = [];

function initLines() {
    for (let i = 0; i < points.length; i++) {
        lines.push(addLine(points[i].position, points[(i + 1) % 7].position));
        lines.push(addLine(points[i].position, points[(i + 3) % 7].position));
    }
}

function addLine(start, end) {
    let geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    let line = new THREE.Line(geometry, lineMaterial);
    scene.add(line);
    return { line, vertices: [start, end] };
}

initLines();
camera.position.set(0, 0, 5);

function animate() {
    requestAnimationFrame(animate);

    for (let point of points) {
        point.angle += point.speed * point.direction;
        point.position.x = Math.cos(point.angle) * radius;
        point.position.y = Math.sin(point.angle) * radius;
    }

    for (let item of lines) {
        item.line.geometry.setFromPoints(item.vertices);
        item.line.geometry.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
}

animate();
