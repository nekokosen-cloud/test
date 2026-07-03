import * as THREE from "three";

const THEMES = {
  wood: {
    board: 0xc89555,
    floor: 0xe0b878,
    wall: 0x6b4226,
    rim: 0x5a3518,
    bg: 0x3d2817,
  },
};

function makeMaterial(color, opts = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

function addBoard(group, level, theme) {
  const boardW = level.board.halfW * 2 + 0.5;
  const boardD = level.board.halfD * 2 + 0.5;
  const thickness = 0.2;

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(boardW, thickness, boardD),
    makeMaterial(theme.board)
  );
  base.position.y = -thickness * 0.5;
  group.add(base);

  const rimH = 0.18;
  const rimT = 0.1;
  const rimMat = makeMaterial(theme.rim);
  const hw = level.board.halfW + 0.15;
  const hd = level.board.halfD + 0.15;

  [
    [boardW + rimT, hd * 2 + rimT * 2, 0, hd + rimT * 0.5],
    [boardW + rimT, hd * 2 + rimT * 2, 0, -hd - rimT * 0.5],
    [hw * 2 + rimT * 2, rimT, hw + rimT * 0.5, 0],
    [hw * 2 + rimT * 2, rimT, -hw - rimT * 0.5, 0],
  ].forEach(([w, d, x, z]) => {
    const rim = new THREE.Mesh(new THREE.BoxGeometry(w, rimH, d), rimMat);
    rim.position.set(x, rimH * 0.5 + 0.02, z);
    group.add(rim);
  });
}

function addCorridorSegment(group, start, end, width, theme) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.hypot(dx, dz);
  if (length < 0.001) return;

  const cx = (start.x + end.x) * 0.5;
  const cz = (start.z + end.z) * 0.5;
  const angle = Math.atan2(dx, dz);
  const floorH = 0.08;
  const wallH = 0.22;
  const wallT = 0.08;

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(width, floorH, length),
    makeMaterial(theme.floor)
  );
  floor.position.set(cx, floorH * 0.5, cz);
  floor.rotation.y = angle;
  group.add(floor);

  const perpX = -Math.sin(angle);
  const perpZ = Math.cos(angle);
  const off = width * 0.5 + wallT * 0.5;
  const wallMat = makeMaterial(theme.wall);

  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(wallT, wallH, length),
      wallMat
    );
    wall.position.set(cx + perpX * off * side, wallH * 0.5 + floorH, cz + perpZ * off * side);
    wall.rotation.y = angle;
    group.add(wall);
  }
}

function addHole(group, hole) {
  const r = hole.radius;

  // 洞口黑圈（一定看得见）
  const pit = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.92, r * 0.92, 0.12, 32),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
  );
  pit.position.set(hole.x, 0.05, hole.z);
  group.add(pit);

  // 高亮边环
  const ringColor = hole.goal ? 0x33ff66 : 0xff3333;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(r, 0.045, 10, 40),
    new THREE.MeshBasicMaterial({ color: ringColor })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(hole.x, 0.1, hole.z);
  group.add(ring);

  if (hole.goal) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.35, 8),
      new THREE.MeshBasicMaterial({ color: 0xff2222 })
    );
    pole.position.set(hole.x + r * 0.55, 0.28, hole.z);
    group.add(pole);

    const flag = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.14, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xffcc00 })
    );
    flag.position.set(hole.x + r * 0.7, 0.38, hole.z);
    group.add(flag);
  }
}

function addStartMark(group, spawn) {
  const pad = new THREE.Mesh(
    new THREE.CircleGeometry(0.22, 28),
    new THREE.MeshBasicMaterial({ color: 0x33dd55 })
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(spawn.x, 0.09, spawn.z);
  group.add(pad);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.24, 0.3, 28),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(spawn.x, 0.095, spawn.z);
  group.add(ring);
}

export function buildLevelScene(level) {
  const theme = THEMES[level.theme] ?? THEMES.wood;
  const group = new THREE.Group();

  addBoard(group, level, theme);
  level.segments.forEach((seg) => addCorridorSegment(group, seg.from, seg.to, seg.width, theme));
  level.holes.forEach((hole) => addHole(group, hole));
  addStartMark(group, level.spawn);

  // 亮橙色球 — MeshBasic 不依赖灯光，手机一定可见
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(level.ballRadius, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xff6600 })
  );

  return { group, ball, theme };
}
