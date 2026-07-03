import * as THREE from "three";

const THEMES = {
  wood: {
    board: 0x9a6537,
    boardEdge: 0x6f4522,
    floor: 0xb8824f,
    wall: 0x5c3a1e,
    ball: 0xd8dde3,
    ballSpecular: 0xffffff,
    hole: 0x120a04,
    rim: 0x4a2f18,
    bg: 0x241710,
  },
};

function makeMaterial(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: opts.metalness ?? 0.08,
    roughness: opts.roughness ?? 0.72,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
  });
}

function addBoard(group, level, theme) {
  const boardW = level.board.halfW * 2 + 0.6;
  const boardD = level.board.halfD * 2 + 0.6;
  const thickness = 0.18;

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(boardW, thickness, boardD),
    makeMaterial(theme.board)
  );
  base.position.y = -thickness * 0.5 - 0.04;
  group.add(base);

  const rimHeight = 0.16;
  const rimThickness = 0.12;
  const rimMat = makeMaterial(theme.rim, { roughness: 0.8 });
  const halfW = level.board.halfW + 0.18;
  const halfD = level.board.halfD + 0.18;

  const rims = [
    [boardW + rimThickness, halfD * 2 + rimThickness * 2, 0, halfD + rimThickness * 0.5],
    [boardW + rimThickness, halfD * 2 + rimThickness * 2, 0, -halfD - rimThickness * 0.5],
    [halfW * 2 + rimThickness * 2, rimThickness, halfW + rimThickness * 0.5, 0],
    [halfW * 2 + rimThickness * 2, rimThickness, -halfW - rimThickness * 0.5, 0],
  ];

  rims.forEach(([w, d, x, z]) => {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(w, rimHeight, d), rimMat);
    rim.position.set(x, rimHeight * 0.5, z);
    group.add(rim);
  });
}

function addCorridorSegment(group, start, end, width, theme, holes) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.hypot(dx, dz);
  if (length < 0.001) return;

  const centerX = (start.x + end.x) * 0.5;
  const centerZ = (start.z + end.z) * 0.5;
  const angle = Math.atan2(dx, dz);
  const floorThickness = 0.06;
  const wallHeight = 0.2;
  const wallThickness = 0.07;

  const floorMat = makeMaterial(theme.floor, { roughness: 0.65 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(width, floorThickness, length), floorMat);
  floor.position.set(centerX, floorThickness * 0.5, centerZ);
  floor.rotation.y = angle;
  group.add(floor);

  const wallMat = makeMaterial(theme.wall, { roughness: 0.85 });
  const perpX = -Math.sin(angle);
  const perpZ = Math.cos(angle);
  const offset = width * 0.5 + wallThickness * 0.5;

  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, length),
      wallMat
    );
    wall.position.set(
      centerX + perpX * offset * side,
      wallHeight * 0.5 + floorThickness,
      centerZ + perpZ * offset * side
    );
    wall.rotation.y = angle;
    group.add(wall);
  }
}

function addHole(group, hole, theme) {
  const depth = 0.35;
  const pit = new THREE.Mesh(
    new THREE.CylinderGeometry(hole.radius * 0.92, hole.radius * 0.75, depth, 28),
    makeMaterial(theme.hole, { roughness: 1, metalness: 0 })
  );
  pit.position.set(hole.x, -depth * 0.5 + 0.02, hole.z);
  group.add(pit);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(hole.radius, 0.018, 8, 32),
    makeMaterial(hole.goal === false ? 0x661111 : 0x2d1808, { roughness: 0.9 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(hole.x, 0.055, hole.z);
  group.add(ring);
}

function addStartMark(group, spawn) {
  const mark = new THREE.Mesh(
    new THREE.RingGeometry(0.14, 0.2, 24),
    makeMaterial(0x3fa34d, { roughness: 0.5, metalness: 0.1 })
  );
  mark.rotation.x = -Math.PI / 2;
  mark.position.set(spawn.x, 0.062, spawn.z);
  group.add(mark);
}

export function buildLevelScene(level) {
  const theme = THEMES[level.theme] ?? THEMES.wood;
  const group = new THREE.Group();

  addBoard(group, level, theme);

  level.segments.forEach((segment) => {
    addCorridorSegment(group, segment.from, segment.to, segment.width, theme, level.holes);
  });

  level.holes.forEach((hole) => addHole(group, hole, theme));
  addStartMark(group, level.spawn);

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(level.ballRadius, 28, 28),
    makeMaterial(theme.ball, { metalness: 0.95, roughness: 0.12 })
  );
  ball.castShadow = true;

  return { group, ball, theme };
}
