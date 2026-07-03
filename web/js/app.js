import * as THREE from "three";
import { LEVELS } from "./levels.js?v=20260703";
import { buildLevelScene } from "./maze.js?v=20260703";
import { createBallState, resetBall, stepBall } from "./physics.js?v=20260703";

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

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 8.2, 6.4);
camera.lookAt(0, 0, 0);

scene.add(new THREE.AmbientLight(0xfff2df, 0.55));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
keyLight.position.set(5, 11, 7);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xffdcb0, 0.35);
fillLight.position.set(-4, 6, -3);
scene.add(fillLight);

const mazeGroup = new THREE.Group();
scene.add(mazeGroup);

let ballMesh = null;
let ballState = null;
let currentLevelIndex = 0;
let elapsed = 0;
let phase = "ready";
let motionEnabled = false;
let tiltX = 0;
let tiltZ = 0;
let targetTiltX = 0;
let targetTiltZ = 0;
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
  mazeGroup.rotation.set(0, 0, 0);
  tiltX = 0;
  tiltZ = 0;
  targetTiltX = 0;
  targetTiltZ = 0;
  calibrated = false;

  elapsed = 0;
  updateTimerDisplay(level.timeLimit);
  levelLabel.textContent = `第 ${level.id} 关 · ${level.name}`;
  hintEl.textContent = "平放手机为水平，倾斜托盘让钢球滚进洞口";
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

      const maxTilt = 0.32;
      const gamma = event.gamma ?? 0;
      const beta = event.beta ?? 45;

      targetTiltX = clamp((gamma - baseGamma) * 0.017, -maxTilt, maxTilt);
      targetTiltZ = clamp((beta - baseBeta) * 0.017, -maxTilt, maxTilt);
    },
    true
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updateTilt(dt) {
  const smooth = 1 - Math.pow(0.001, dt);
  tiltX += (targetTiltX - tiltX) * smooth;
  tiltZ += (targetTiltZ - tiltZ) * smooth;
  mazeGroup.rotation.x = tiltX;
  mazeGroup.rotation.z = tiltZ;
}

function startGame() {
  phase = "playing";
  elapsed = 0;
  lastFrameTime = performance.now();
  calibrated = false;
  resetBall(ballState, getLevel());
  syncBallMesh();
  mazeGroup.rotation.set(0, 0, 0);
  tiltX = 0;
  tiltZ = 0;
  targetTiltX = 0;
  targetTiltZ = 0;
  hideOverlay();
}

function winLevel() {
  phase = "won";
  if (navigator.vibrate) navigator.vibrate(80);
  hintEl.textContent = "进洞！托盘平衡成功。";

  const hasNext = currentLevelIndex + 1 < LEVELS.length;
  showOverlay({
    title: "过关！",
    message: "钢球稳稳滚进了目标洞口。",
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
    updateTilt(dt);
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

    const result = stepBall(ballState, level, tiltX, tiltZ, dt);
    syncBallMesh();

    if (result.reachedHole) {
      winLevel();
      return;
    }
    if (result.fellOut) {
      loseLevel(result.trapHole ? "掉进陷阱洞" : "钢球掉出托盘");
    }
  }

  renderer.render(scene, camera);
}

function showStartScreen() {
  phase = "ready";
  showOverlay({
    title: "平衡球",
    message: "经典 Teeter 玩法：整盘迷宫随手机倾斜，把钢球滚进目标洞口。开局时保持手机水平作为基准。",
    primaryText: motionEnabled ? "开始游戏" : "授权并开始",
    onPrimary: async () => {
      if (!motionEnabled) {
        const granted = await requestMotionPermission();
        if (!granted) {
          overlayMessage.textContent = "需要「动作与方向」权限才能倾斜托盘。请到 Safari 设置中允许后重试。";
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
