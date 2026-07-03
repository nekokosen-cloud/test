import * as THREE from "three";
import { LEVELS } from "./levels.js?v=20260703b";
import { buildLevelScene } from "./maze.js?v=20260703b";
import { createBallState, resetBall, stepBall } from "./physics.js?v=20260703b";

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
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x241710);

// 固定相机：盘子不动，只观察
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 10.5, 7.8);
camera.lookAt(0, 0, 0);

scene.add(new THREE.AmbientLight(0xfff2df, 0.55));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
keyLight.position.set(5, 11, 7);
scene.add(keyLight);

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
let lastFrameTime = performance.now();

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

  elapsed = 0;
  updateTimerDisplay(level.timeLimit);
  levelLabel.textContent = `第 ${level.id} 关 · ${level.name}`;
  hintEl.textContent = "盘子固定不动，倾斜手机让钢球滚进终点洞口";
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

function calibrateOrientation(event) {
  baseGamma = event.gamma ?? 0;
  baseBeta = event.beta ?? 45;
  calibrated = true;
}

function bindMotionListeners() {
  window.addEventListener(
    "deviceorientation",
    (event) => {
      if (!motionEnabled) return;
      if (!calibrated) calibrateOrientation(event);

      const gamma = event.gamma ?? 0;
      const beta = event.beta ?? 45;
      const maxG = 0.38;

      // 手机倾斜 → 重力方向（盘子不动，只有球受力滚动）
      targetGravityX = clamp((gamma - baseGamma) * 0.018, -maxG, maxG);
      targetGravityZ = clamp((beta - baseBeta) * 0.018, -maxG, maxG);
    },
    true
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updateGravity(dt) {
  const smooth = 1 - Math.pow(0.001, dt);
  gravityX += (targetGravityX - gravityX) * smooth;
  gravityZ += (targetGravityZ - gravityZ) * smooth;
}

function startGame() {
  phase = "playing";
  elapsed = 0;
  lastFrameTime = performance.now();
  calibrated = false;
  resetBall(ballState, getLevel());
  syncBallMesh();
  gravityX = 0;
  gravityZ = 0;
  targetGravityX = 0;
  targetGravityZ = 0;
  hideOverlay();
}

function winLevel() {
  phase = "won";
  if (navigator.vibrate) navigator.vibrate(80);
  hintEl.textContent = "进洞成功！";

  const hasNext = currentLevelIndex + 1 < LEVELS.length;
  showOverlay({
    title: "过关！",
    message: "钢球滚进了终点洞口。",
    primaryText: hasNext ? "下一关" : "再玩一次",
    secondaryText: "重试",
    onPrimary: () => {
      loadLevel(hasNext ? currentLevelIndex + 1 : 0);
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
  hintEl.textContent = reason;

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

  if (phase === "playing") {
    updateGravity(dt);
  }

  if (phase === "playing" && ballState) {
    elapsed += dt;
    const level = getLevel();
    const remaining = level.timeLimit - elapsed;
    updateTimerDisplay(remaining);

    if (remaining <= 0) {
      loseLevel("时间耗尽");
      return;
    }

    const result = stepBall(ballState, level, gravityX, gravityZ, dt);
    syncBallMesh();

    if (result.reachedHole) {
      winLevel();
      return;
    }
    if (result.fellOut) {
      loseLevel(result.trapHole ? "掉进陷阱洞" : "钢球掉出盘子");
    }
  }

  renderer.render(scene, camera);
}

function showStartScreen() {
  phase = "ready";
  showOverlay({
    title: "平衡球",
    message: "盘子固定不动。绿圈是起点，倾斜手机让钢球滚进终点洞口。开局时保持手机水平校准。",
    primaryText: motionEnabled ? "开始游戏" : "授权并开始",
    onPrimary: async () => {
      if (!motionEnabled) {
        const granted = await requestMotionPermission();
        if (!granted) {
          overlayMessage.textContent = "需要「动作与方向」权限。请到 Safari 设置中允许后重试。";
          return;
        }
        motionEnabled = true;
      }
      loadLevel(0);
      startGame();
    },
  });
}

function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", handleResize);
bindMotionListeners();
loadLevel(0);
showStartScreen();
requestAnimationFrame(tick);
