import * as THREE from "three";
import { LEVELS } from "./levels.js?v=20260703c";
import { buildLevelScene } from "./maze.js?v=20260703c";
import { createBallState, resetBall, stepBall } from "./physics.js?v=20260703c";

const canvas = document.getElementById("game-canvas");
const levelLabel = document.getElementById("level-label");
const timerEl = document.getElementById("timer");
const hintEl = document.getElementById("hint");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMessage = document.getElementById("overlay-message");
const primaryBtn = document.getElementById("primary-btn");
const secondaryBtn = document.getElementById("secondary-btn");

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x3d2817);

// 正俯视，整盘迷宫一目了然
const camera = new THREE.OrthographicCamera(-5.5, 5.5, 5.5, -5.5, 0.1, 50);
camera.position.set(0, 12, 0);
camera.lookAt(0, 0, 0);

scene.add(new THREE.AmbientLight(0xffffff, 1.0));
scene.add(new THREE.DirectionalLight(0xffffff, 0.6));

const mazeGroup = new THREE.Group();
scene.add(mazeGroup);

let ballMesh = null;
let ballState = null;
let currentLevelIndex = 0;
let elapsed = 0;
let phase = "ready";
let motionEnabled = false;
let gravityX = 0;
let gravityZ = 0;
let targetGravityX = 0;
let targetGravityZ = 0;
let baseGamma = 0;
let baseBeta = 45;
let calibrated = false;
let gravityActive = false;
let calibrateUntil = 0;
let lastFrameTime = performance.now();

function resizeRenderer() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h);
  const aspect = w / h;
  const view = 5.8;
  if (aspect >= 1) {
    camera.left = -view * aspect;
    camera.right = view * aspect;
    camera.top = view;
    camera.bottom = -view;
  } else {
    camera.left = -view;
    camera.right = view;
    camera.top = view / aspect;
    camera.bottom = -view / aspect;
  }
  camera.updateProjectionMatrix();
}

function getLevel() {
  return LEVELS[currentLevelIndex];
}

function loadLevel(index) {
  while (mazeGroup.children.length) mazeGroup.remove(mazeGroup.children[0]);
  ballMesh = null;

  currentLevelIndex = index;
  const level = getLevel();
  const built = buildLevelScene(level);
  mazeGroup.add(built.group);

  ballMesh = built.ball;
  mazeGroup.add(ballMesh);
  scene.background = new THREE.Color(built.theme.bg);

  ballState = createBallState(level);
  syncBallMesh();

  gravityX = 0;
  gravityZ = 0;
  targetGravityX = 0;
  targetGravityZ = 0;
  calibrated = false;
  gravityActive = false;

  elapsed = 0;
  updateTimerDisplay(level.timeLimit);
  levelLabel.textContent = `第 ${level.id} 关 · ${level.name}`;
  hintEl.textContent = "绿点=起点，绿圈=终点洞，倾斜手机让橙球滚进去";
}

function syncBallMesh() {
  if (!ballMesh || !ballState) return;
  ballMesh.position.set(ballState.x, ballState.y, ballState.z);
}

function updateTimerDisplay(value) {
  timerEl.textContent = String(Math.ceil(Math.max(0, value)));
  timerEl.classList.toggle("danger", value <= 10);
}

function showOverlay({ title, message, primaryText, secondaryText, onPrimary, onSecondary }) {
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  primaryBtn.textContent = primaryText;
  primaryBtn.onclick = onPrimary;
  if (secondaryText) {
    secondaryBtn.classList.remove("hidden");
    secondaryBtn.textContent = secondaryText;
    secondaryBtn.onclick = onSecondary;
  } else {
    secondaryBtn.classList.add("hidden");
    secondaryBtn.onclick = null;
  }
  overlay.classList.add("visible");
}

function hideOverlay() {
  overlay.classList.remove("visible");
}

async function requestMotionPermission() {
  if (typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function") {
    const result = await DeviceOrientationEvent.requestPermission();
    return result === "granted";
  }
  return true;
}

function bindMotionListeners() {
  window.addEventListener(
    "deviceorientation",
    (event) => {
      if (!motionEnabled) return;

      if (!calibrated) {
        baseGamma = event.gamma ?? 0;
        baseBeta = event.beta ?? 45;
        calibrated = true;
      }

      if (!gravityActive) return;

      const gamma = event.gamma ?? 0;
      const beta = event.beta ?? 45;
      const maxG = 0.35;

      targetGravityX = clamp((gamma - baseGamma) * 0.016, -maxG, maxG);
      targetGravityZ = clamp((beta - baseBeta) * 0.016, -maxG, maxG);
    },
    true
  );
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function updateGravity(dt) {
  if (!gravityActive) {
    targetGravityX = 0;
    targetGravityZ = 0;
  }
  const smooth = 1 - Math.pow(0.001, dt);
  gravityX += (targetGravityX - gravityX) * smooth;
  gravityZ += (targetGravityZ - gravityZ) * smooth;
}

function startGame() {
  phase = "playing";
  elapsed = 0;
  lastFrameTime = performance.now();
  calibrated = false;
  gravityActive = false;
  calibrateUntil = performance.now() + 1200;

  resetBall(ballState, getLevel());
  syncBallMesh();
  gravityX = 0;
  gravityZ = 0;
  targetGravityX = 0;
  targetGravityZ = 0;
  hideOverlay();
  hintEl.textContent = "保持手机水平 1 秒…";
}

function winLevel() {
  phase = "won";
  if (navigator.vibrate) navigator.vibrate(80);
  showOverlay({
    title: "过关！",
    message: "橙球滚进了绿色洞口。",
    primaryText: currentLevelIndex + 1 < LEVELS.length ? "下一关" : "再玩一次",
    secondaryText: "重试",
    onPrimary: () => {
      loadLevel(currentLevelIndex + 1 < LEVELS.length ? currentLevelIndex + 1 : 0);
      startGame();
    },
    onSecondary: () => {
      loadLevel(currentLevelIndex);
      startGame();
    },
  });
}

function loseLevel(reason) {
  phase = "lost";
  if (navigator.vibrate) navigator.vibrate([40, 40, 40]);
  showOverlay({
    title: "失败",
    message: reason,
    primaryText: "重试",
    onPrimary: () => {
      loadLevel(currentLevelIndex);
      startGame();
    },
  });
}

function tick(now) {
  requestAnimationFrame(tick);

  const dt = Math.min(0.033, (now - lastFrameTime) / 1000);
  lastFrameTime = now;

  if (phase === "playing" && !gravityActive && now >= calibrateUntil) {
    gravityActive = true;
    calibrated = false;
    hintEl.textContent = "倾斜手机，把橙球滚进绿色洞口";
  }

  if (phase === "playing") updateGravity(dt);

  if (phase === "playing" && ballState) {
    elapsed += dt;
    const level = getLevel();
    updateTimerDisplay(level.timeLimit - elapsed);

    if (level.timeLimit - elapsed <= 0) {
      loseLevel("时间耗尽");
      return;
    }

    const result = stepBall(ballState, level, gravityActive ? gravityX : 0, gravityActive ? gravityZ : 0, dt);
    syncBallMesh();

    if (result.reachedHole) winLevel();
    else if (result.fellOut) loseLevel(result.trapHole ? "掉进陷阱洞" : "球掉出盘子");
  }

  renderer.render(scene, camera);
}

function showStartScreen() {
  phase = "ready";
  showOverlay({
    title: "平衡球",
    message: "绿点=起点，绿色光圈=终点洞，橙色=球。盘子不动，倾斜手机让球滚进洞。",
    primaryText: motionEnabled ? "开始游戏" : "授权并开始",
    onPrimary: async () => {
      if (!motionEnabled) {
        const granted = await requestMotionPermission();
        if (!granted) {
          overlayMessage.textContent = "需要「动作与方向」权限。请到 Safari 设置中允许。";
          return;
        }
        motionEnabled = true;
      }
      loadLevel(0);
      startGame();
    },
  });
}

window.addEventListener("resize", resizeRenderer);
bindMotionListeners();
resizeRenderer();
loadLevel(0);
showStartScreen();
requestAnimationFrame(tick);
