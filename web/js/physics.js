function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function closestPointOnSegment(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz;
  if (len2 < 0.0001) return { x: ax, z: az };

  const t = clamp(((px - ax) * dx + (pz - az) * dz) / len2, 0, 1);
  return { x: ax + dx * t, z: az + dz * t };
}

function dist2(x1, z1, x2, z2) {
  return Math.hypot(x1 - x2, z1 - z2);
}

function isOverAnyHole(x, z, holes, radius) {
  return holes.some((hole) => dist2(x, z, hole.x, hole.z) < hole.radius - radius * 0.35);
}

function corridorHalfWidth(segment, radius) {
  return segment.width * 0.5 - radius * 0.92;
}

function constrainToCorridor(state, level, radius) {
  let bestDist = Infinity;
  let bestPoint = { x: state.x, z: state.z };
  let insideAny = false;
  let bestHalfWidth = 0;

  for (const segment of level.segments) {
    const halfWidth = corridorHalfWidth(segment, radius);
    const closest = closestPointOnSegment(
      state.x,
      state.z,
      segment.from.x,
      segment.from.z,
      segment.to.x,
      segment.to.z
    );
    const dist = dist2(state.x, state.z, closest.x, closest.z);
    if (dist <= halfWidth) insideAny = true;
    if (dist < bestDist) {
      bestDist = dist;
      bestPoint = closest;
      bestHalfWidth = halfWidth;
    }
  }

  if (insideAny) return;

  if (bestDist <= bestHalfWidth + 0.001) return;

  const pushX = state.x - bestPoint.x;
  const pushZ = state.z - bestPoint.z;
  const pushLen = Math.hypot(pushX, pushZ) || 1;
  const nx = pushX / pushLen;
  const nz = pushZ / pushLen;

  state.x = bestPoint.x + nx * bestHalfWidth;
  state.z = bestPoint.z + nz * bestHalfWidth;

  const vn = state.vx * nx + state.vz * nz;
  if (vn > 0) {
    state.vx -= vn * nx * 1.05;
    state.vz -= vn * nz * 1.05;
  }
}

function constrainToBoardRim(state, level, radius) {
  const maxX = level.board.halfW - radius * 0.8;
  const maxZ = level.board.halfD - radius * 0.8;

  if (Math.abs(state.x) > maxX) {
    state.x = Math.sign(state.x) * maxX;
    state.vx *= -0.35;
  }
  if (Math.abs(state.z) > maxZ) {
    state.z = Math.sign(state.z) * maxZ;
    state.vz *= -0.35;
  }
}

export function createBallState(level) {
  return {
    x: level.spawn.x,
    y: level.ballRadius,
    z: level.spawn.z,
    vx: 0,
    vz: 0,
    vy: 0,
    supported: true,
    mode: "rolling",
  };
}

export function resetBall(state, level) {
  state.x = level.spawn.x;
  state.y = level.ballRadius;
  state.z = level.spawn.z;
  state.vx = 0;
  state.vz = 0;
  state.vy = 0;
  state.supported = true;
  state.mode = "rolling";
}

export function stepBall(state, level, tiltX, tiltZ, dt) {
  const radius = level.ballRadius;
  const gravity = 14;
  const maxSpeed = 5.8;

  if (state.mode === "rolling" && state.supported) {
    state.vx += Math.sin(tiltX) * gravity * dt;
    state.vz += Math.sin(tiltZ) * gravity * dt;

    const friction = Math.pow(0.08, dt);
    state.vx *= 1 - friction;
    state.vz *= 1 - friction;

    const speed = Math.hypot(state.vx, state.vz);
    if (speed > maxSpeed) {
      state.vx = (state.vx / speed) * maxSpeed;
      state.vz = (state.vz / speed) * maxSpeed;
    }

    state.x += state.vx * dt;
    state.z += state.vz * dt;

    constrainToCorridor(state, level, radius);
    constrainToBoardRim(state, level, radius);

    if (isOverAnyHole(state.x, state.z, level.holes, radius)) {
      state.supported = false;
      state.mode = "dropping";
      state.vy = -0.05;
    } else {
      state.y = radius;
    }
  } else if (state.mode === "dropping") {
    state.vy -= gravity * 1.35 * dt;
    state.y += state.vy * dt;
    state.x += state.vx * dt;
    state.z += state.vz * dt;
    state.vx *= 1 - 0.4 * dt;
    state.vz *= 1 - 0.4 * dt;
  } else if (state.mode === "fallen") {
    state.vy -= gravity * dt;
    state.y += state.vy * dt;
    state.x += state.vx * dt;
    state.z += state.vz * dt;
  }

  const offBoard =
    Math.abs(state.x) > level.board.halfW + 0.05 ||
    Math.abs(state.z) > level.board.halfD + 0.05;

  if (offBoard && state.mode === "rolling") {
    state.mode = "fallen";
    state.supported = false;
    state.vy = -0.2;
  }

  for (const hole of level.holes) {
    const inHole = dist2(state.x, state.z, hole.x, hole.z) < hole.radius * 0.72;
    if (hole.goal && inHole && state.y < radius * 0.35 && state.mode === "dropping") {
      return { reachedHole: true, fellOut: false, trapHole: false };
    }
    if (!hole.goal && inHole && state.y < radius * 0.5 && (state.mode === "dropping" || state.mode === "fallen")) {
      return { reachedHole: false, fellOut: true, trapHole: true };
    }
  }

  if (state.mode === "fallen" && state.y < level.fallThreshold) {
    return { reachedHole: false, fellOut: true, trapHole: false };
  }

  if (state.mode === "dropping" && state.y < level.fallThreshold) {
    return { reachedHole: false, fellOut: true, trapHole: false };
  }

  return { reachedHole: false, fellOut: false, trapHole: false };
}
