function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function closestPointOnSegment(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const len2 = dx * dx + dz * dz;
  if (len2 < 0.0001) return { x: ax, z: az, t: 0 };

  const t = clamp(((px - ax) * dx + (pz - az) * dz) / len2, 0, 1);
  return { x: ax + dx * t, z: az + dz * t, t };
}

function corridorConstraint(x, z, segments, radius) {
  let bestDist = Infinity;
  let bestPoint = { x, z };
  let insideAny = false;

  for (const segment of segments) {
    const halfWidth = segment.width * 0.5 - radius * 0.85;
    const closest = closestPointOnSegment(
      x,
      z,
      segment.from.x,
      segment.from.z,
      segment.to.x,
      segment.to.z
    );
    const dist = Math.hypot(x - closest.x, z - closest.z);
    if (dist <= halfWidth) insideAny = true;
    if (dist < bestDist) {
      bestDist = dist;
      bestPoint = closest;
    }
  }

  return { insideAny, bestDist, bestPoint };
}

export function createBallState(level) {
  return {
    x: level.spawn.x,
    y: level.ballRadius + 0.02,
    z: level.spawn.z,
    vx: 0,
    vz: 0,
    falling: false,
  };
}

export function stepBall(state, level, tiltX, tiltZ, dt) {
  const radius = level.ballRadius;
  const maxSpeed = 6.5;
  const gravity = 16;

  if (!state.falling) {
    const ax = Math.sin(tiltX) * gravity;
    const az = Math.sin(tiltZ) * gravity;
    state.vx += ax * dt;
    state.vz += az * dt;

    const damping = Math.pow(0.12, dt);
    state.vx *= 1 - damping;
    state.vz *= 1 - damping;

    const speed = Math.hypot(state.vx, state.vz);
    if (speed > maxSpeed) {
      state.vx = (state.vx / speed) * maxSpeed;
      state.vz = (state.vz / speed) * maxSpeed;
    }

    state.x += state.vx * dt;
    state.z += state.vz * dt;

    const constraint = corridorConstraint(state.x, state.z, level.segments, radius);
    const halfWidthLimit = Math.min(...level.segments.map((s) => s.width * 0.5 - radius * 0.85));

    if (constraint.insideAny) {
      // keep on track
    } else if (constraint.bestDist > halfWidthLimit + 0.02) {
      state.falling = true;
    } else {
      const pushX = state.x - constraint.bestPoint.x;
      const pushZ = state.z - constraint.bestPoint.z;
      const pushLen = Math.hypot(pushX, pushZ) || 1;
      const limit = halfWidthLimit;
      state.x = constraint.bestPoint.x + (pushX / pushLen) * limit;
      state.z = constraint.bestPoint.z + (pushZ / pushLen) * limit;

      const nx = pushX / pushLen;
      const nz = pushZ / pushLen;
      const vn = state.vx * nx + state.vz * nz;
      if (vn > 0) {
        state.vx -= vn * nx * 1.2;
        state.vz -= vn * nz * 1.2;
      }
    }
  } else {
    state.vx *= 0.98;
    state.vz *= 0.98;
    state.x += state.vx * dt;
    state.z += state.vz * dt;
    state.y -= 4.5 * dt;
  }

  const holeDx = state.x - level.hole.x;
  const holeDz = state.z - level.hole.z;
  const holeDist = Math.hypot(holeDx, holeDz);
  const reachedHole = holeDist < level.hole.radius * 0.75 && (state.falling || state.y <= radius * 0.8);

  return {
    reachedHole,
    fellOut: state.falling && state.y < level.fallThreshold,
  };
}

export function resetBall(state, level) {
  state.x = level.spawn.x;
  state.y = level.ballRadius + 0.02;
  state.z = level.spawn.z;
  state.vx = 0;
  state.vz = 0;
  state.falling = false;
}
