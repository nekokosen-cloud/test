import * as THREE from "three";
import { LEVELS } from "./levels.js";
import { buildLevelScene } from "./maze.js";
import { createBallState, resetBall, stepBall } from "./physics.js";

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
scene.background = new THREE.Color(0x020308);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 11.5, 0.01);
camera.lookAt(0, 0, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.28));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
keyLight.position.set(4, 10, 6);
keyLight.castShadow = true;
scene.add(keyLight);

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
let lastFrameTime = performance.now();

function getLevel() {
  return LEVELS[currentLevelIndex];
}

function loadLevel(index) {
  while (mazeGroup.children.length) mazeGroup.remove(mazeGroup.children[0]);
  if (ballMesh) {
    scene.remove(ballMesh);
    ballMesh = null;
  }

  currentLevelIndex = index;
  const level = getLevel();
  const built = buildLevelScene(level);
  mazeGroup.add(built.group);
  ballMesh = built.ball;
  scene.add(ballMesh);
  scene.background = new THREE.Color(built.theme.bg);

  ballState = createBallState(level);
  syncBallMesh();
  mazeGroup.rotation.set(0, 0, 0);

  elapsed = 0;
  updateTimerDisplay(level.timeLimit);
  levelLabel.textContent = `第 ${level.id} 关 · ${level.name}`;
  hintEl.textContent = `限时 ${level.timeLimit} 秒 · 掉出轨道即失败`;
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
  window.addEventListener("deviceorientation", (event) => {
    if (!motionEnabled || phase !== "playing") return;

    const gamma = event.gamma ?? 0;
    const beta = event.beta ?? 0;
    const maxTilt = 0.42;

    tiltX = clamp((gamma / 180) * Math.PI * 0.85, -maxTilt, maxTilt);
    tiltZ = clamp(((beta - 45) / 180) * Math.PI * 0.85, -maxTilt, maxTilt);

    mazeGroup.rotation.x = tiltX;
    mazeGroup.rotation.z = tiltZ;
  }, true);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function startGame() {
  phase = "playing";
  elapsed = 0;
  lastFrameTime = performance.now();
  resetBall(ballState, getLevel());
  syncBallMesh();
  mazeGroup.rotation.set(0, 0, 0);
  hideOverlay();
}

function winLevel() {
  phase = "won";
  if (navigator.vibrate) navigator.vibrate(80);
  hintEl.textContent = "虫洞捕获成功！";

  const hasNext = currentLevelIndex + 1 < LEVELS.length;
  showOverlay({
    title: "过关！",
    message: "你成功把能量球送入了虫洞。",
    primaryText: hasNext ? "下一关" : "再玩一次",
    secondaryText: "重试",
    onPrimary: () => {
      if (hasNext) {
        loadLevel(currentLevelIndex + 1);
      } else {
        loadLevel(0);
      }
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
      loseLevel("坠出轨道");
    }
  }

  renderer.render(scene, camera);
}

function showStartScreen() {
  phase = "ready";
  showOverlay({
    title: "Space Ball",
    message: "固定俯视 3D 迷宫。倾斜 iPhone 控制重力，限时内滚进发光虫洞。",
    primaryText: motionEnabled ? "开始游戏" : "授权并开始",
    onPrimary: async () => {
      if (!motionEnabled) {
        const granted = await requestMotionPermission();
        if (!granted) {
          overlayMessage.textContent = "需要「动作与方向」权限才能倾斜控制。请到 Safari 设置中允许后重试。";
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
