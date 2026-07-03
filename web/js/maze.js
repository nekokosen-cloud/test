import * as THREE from "three";

const THEMES = {
  space: {
    floor: 0x1a2230,
    floorEmissive: 0x0a1a33,
    wall: 0x2d8cf2,
    wallEmissive: 0x0a3366,
    ball: 0xf5fbff,
    ballEmissive: 0x3399ff,
    hole: 0x33f0ff,
    bg: 0x020308,
    pad: 0x22cc77,
  },
  nebula: {
    floor: 0x2a1238,
    floorEmissive: 0x330855,
    wall: 0xbf40f2,
    wallEmissive: 0x550866,
    ball: 0xffe8fa,
    ballEmissive: 0xff66dd,
    hole: 0xff66ee,
    bg: 0x08010f,
    pad: 0xff66ee,
  },
};

function makePBRMaterial(color, emissive, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: opts.emissiveIntensity ?? 0.45,
    metalness: opts.metalness ?? 0.75,
    roughness: opts.roughness ?? 0.35,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });
}

function addCorridorSegment(group, start, end, width, wallHeight, floorThickness, theme) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.hypot(dx, dz);
  if (length < 0.001) return;

  const centerX = (start.x + end.x) * 0.5;
  const centerZ = (start.z + end.z) * 0.5;
  const angle = Math.atan2(dx, dz);

  const floorGeo = new THREE.BoxGeometry(width, floorThickness, length);
  const floorMat = makePBRMaterial(theme.floor, theme.floorEmissive);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(centerX, -floorThickness * 0.5, centerZ);
  floor.rotation.y = angle;
  group.add(floor);

  const wallThickness = 0.08;
  const wallMat = makePBRMaterial(theme.wall, theme.wallEmissive, { metalness: 0.9, roughness: 0.2 });
  const perpX = -Math.sin(angle);
  const perpZ = Math.cos(angle);
  const offset = width * 0.5 + wallThickness * 0.5;

  for (const side of [-1, 1]) {
    const wallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, length);
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(
      centerX + perpX * offset * side,
      wallHeight * 0.5,
      centerZ + perpZ * offset * side
    );
    wall.rotation.y = angle;
    group.add(wall);
  }
}

function addHole(group, hole, theme) {
  const ringGeo = new THREE.TorusGeometry(hole.radius, 0.04, 12, 48);
  const ringMat = makePBRMaterial(theme.hole, theme.hole, { emissiveIntensity: 1, metalness: 1, roughness: 0.15 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(hole.x, 0.02, hole.z);
  group.add(ring);

  const glowGeo = new THREE.CylinderGeometry(hole.radius * 0.85, hole.radius * 0.85, 0.02, 32);
  const glowMat = makePBRMaterial(theme.hole, theme.hole, {
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.65,
    metalness: 0.2,
    roughness: 0.5,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(hole.x, -0.01, hole.z);
  group.add(glow);

  const light = new THREE.PointLight(theme.hole, 2.2, 4);
  light.position.set(hole.x, 1.2, hole.z);
  group.add(light);
}

function addStartPad(group, spawn, theme) {
  const padGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.03, 24);
  const padMat = makePBRMaterial(theme.pad, theme.pad, { emissiveIntensity: 0.7, metalness: 0.2, roughness: 0.4 });
  const pad = new THREE.Mesh(padGeo, padMat);
  pad.position.set(spawn.x, 0.02, spawn.z);
  group.add(pad);
}

function addStars(group) {
  const count = 120;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 24;
    positions[i * 3 + 1] = 4 + Math.random() * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 24;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.85 });
  group.add(new THREE.Points(geo, mat));
}

export function buildLevelScene(level) {
  const theme = THEMES[level.theme] ?? THEMES.space;
  const group = new THREE.Group();

  level.segments.forEach((segment) => {
    addCorridorSegment(group, segment.from, segment.to, segment.width, 0.28, 0.12, theme);
  });

  addHole(group, level.hole, theme);
  if (level.theme === "space") {
    addStartPad(group, level.spawn, theme);
    addStars(group);
  }

  const ballGeo = new THREE.SphereGeometry(level.ballRadius, 32, 32);
  const ballMat = makePBRMaterial(theme.ball, theme.ballEmissive, { emissiveIntensity: 0.8, metalness: 0.95, roughness: 0.08 });
  const ball = new THREE.Mesh(ballGeo, ballMat);
  ball.castShadow = true;

  return { group, ball, theme };
}
