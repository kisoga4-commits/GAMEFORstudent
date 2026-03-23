import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  signInAnonymously,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
import { WORLD_LEVELS } from "./level-data.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const worldShell = document.getElementById("worldShell");
const levelShell = document.getElementById("levelShell");
const worldMap = document.getElementById("worldMap");
const worldStatus = document.getElementById("worldStatus");
const playerGreeting = document.getElementById("playerGreeting");
const levelModal = document.getElementById("levelModal");
const levelName = document.getElementById("levelName");
const levelDescription = document.getElementById("levelDescription");
const levelLock = document.getElementById("levelLock");
const startLevelBtn = document.getElementById("startLevelBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const levelSceneTitle = document.getElementById("levelSceneTitle");
const levelSceneQuestion = document.getElementById("levelSceneQuestion");
const levelArena = document.getElementById("levelArena");
const levelFeedback = document.getElementById("levelFeedback");
const submitAnswerBtn = document.getElementById("submitAnswerBtn");
const backToWorldBtn = document.getElementById("backToWorldBtn");
const logoutBtn = document.getElementById("logoutBtn");

const MAP_SIZE = 100;
const HERO_SIZE = 9;
const LEVEL_SIZE = 14;
const ANSWER_SIZE = 14;
const STEP = 2.5;
const MODAL_REOPEN_COOLDOWN_MS = 1500;

const hero = {
  x: 50,
  y: 90,
  el: null
};

const levelHero = {
  x: 50,
  y: 84,
  el: null
};

let playerData = null;
let currentUser = null;
let activeLevel = null;
let selectedChoiceId = null;
let holdMoveTimer = null;
let currentScene = "world";
let activeTriggerLevelId = null;
const modalCooldownUntilByLevel = new Map();
const triggerExitRequiredLevels = new Set();

const setStatus = (message, isError = false) => {
  worldStatus.textContent = message;
  worldStatus.classList.toggle("error", isError);
};

const setLevelFeedback = (message, isError = false) => {
  levelFeedback.textContent = message;
  levelFeedback.classList.toggle("error", isError);
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const createLevelNode = (level) => {
  const levelNode = document.createElement("button");
  levelNode.type = "button";
  levelNode.className = "level-node";
  levelNode.dataset.levelId = level.id;
  levelNode.style.left = `${level.x}%`;
  levelNode.style.top = `${level.y}%`;
  levelNode.innerHTML = `
    <span class="level-emoji" aria-hidden="true">${level.emoji}</span>
    <span class="level-label">${level.shortName}</span>
  `;
  levelNode.setAttribute("aria-label", level.name);
  return levelNode;
};

const createHeroNode = (extraClass = "") => {
  const node = document.createElement("div");
  node.className = `hero ${extraClass}`.trim();
  node.innerHTML = '<span class="hero-face">🧒</span>';
  return node;
};

const createAnswerNode = (choice) => {
  const answerNode = document.createElement("div");
  answerNode.className = "answer-node";
  answerNode.dataset.choiceId = choice.id;
  answerNode.style.left = `${choice.x}%`;
  answerNode.style.top = `${choice.y}%`;
  answerNode.textContent = choice.label;
  return answerNode;
};

const getUnlockedCount = () => {
  const unlockedRaw = playerData?.unlockedLevels;
  const unlockedCount = Number.parseInt(unlockedRaw, 10);
  if (!Number.isFinite(unlockedCount) || unlockedCount < 1) {
    return 1;
  }
  return unlockedCount;
};

const isLevelUnlocked = (level) => {
  return getUnlockedCount() >= level.unlockOrder;
};

const updateHeroPosition = () => {
  if (!hero.el) return;
  hero.el.style.left = `${hero.x}%`;
  hero.el.style.top = `${hero.y}%`;
};

const updateLevelHeroPosition = () => {
  if (!levelHero.el) return;
  levelHero.el.style.left = `${levelHero.x}%`;
  levelHero.el.style.top = `${levelHero.y}%`;
};

const closeLevelModal = ({ resetActive = true, applyCooldown = true } = {}) => {
  if (levelModal.hidden) return;

  if (applyCooldown && activeLevel?.id) {
    modalCooldownUntilByLevel.set(activeLevel.id, Date.now() + MODAL_REOPEN_COOLDOWN_MS);
    triggerExitRequiredLevels.add(activeLevel.id);
  }

  levelModal.hidden = true;
  console.debug("[world] modal closed", { levelId: activeLevel?.id ?? null, applyCooldown });

  if (resetActive) {
    activeLevel = null;
  }
};

const openLevelModal = (level) => {
  activeLevel = level;
  const unlocked = isLevelUnlocked(level);

  levelName.textContent = level.name;
  levelDescription.textContent = level.description;
  levelLock.textContent = unlocked ? "สถานะ: ✅ ปลดล็อกแล้ว" : "สถานะ: 🔒 ยังไม่ปลดล็อก";

  startLevelBtn.disabled = !unlocked;
  startLevelBtn.textContent = unlocked ? "เริ่มด่าน" : "ยังเริ่มไม่ได้";

  levelModal.hidden = false;
  console.debug("[world] modal opened", { levelId: level.id });
};

const checkLevelCollision = () => {
  const hitLevel = WORLD_LEVELS.find((level) => {
    const dx = Math.abs(hero.x - level.x);
    const dy = Math.abs(hero.y - level.y);
    return dx <= (HERO_SIZE + LEVEL_SIZE) / 2 && dy <= (HERO_SIZE + LEVEL_SIZE) / 2;
  });

  if (!hitLevel) {
    if (activeTriggerLevelId) {
      triggerExitRequiredLevels.delete(activeTriggerLevelId);
    }
    activeTriggerLevelId = null;
    return;
  }

  if (activeTriggerLevelId !== hitLevel.id) {
    activeTriggerLevelId = hitLevel.id;
    console.debug("[world] entered level trigger", { levelId: hitLevel.id });
  }

  const cooldownUntil = modalCooldownUntilByLevel.get(hitLevel.id) ?? 0;
  const isCoolingDown = Date.now() < cooldownUntil;
  const requiresExitFirst = triggerExitRequiredLevels.has(hitLevel.id);

  if (activeLevel?.id === hitLevel.id || !levelModal.hidden || isCoolingDown || requiresExitFirst) {
    return;
  }

  openLevelModal(hitLevel);
};

const markSelectedChoice = () => {
  levelArena.querySelectorAll(".answer-node").forEach((node) => {
    node.classList.toggle("active", node.dataset.choiceId === selectedChoiceId);
  });
};

const checkAnswerCollision = () => {
  if (!activeLevel?.challenge) return;

  const hitChoice = activeLevel.challenge.choices.find((choice) => {
    const dx = Math.abs(levelHero.x - choice.x);
    const dy = Math.abs(levelHero.y - choice.y);
    return dx <= (HERO_SIZE + ANSWER_SIZE) / 2 && dy <= (HERO_SIZE + ANSWER_SIZE) / 2;
  });

  selectedChoiceId = hitChoice?.id ?? null;
  markSelectedChoice();

  if (selectedChoiceId) {
    setLevelFeedback(`เลือกคำตอบ: ${hitChoice.label} แล้ว กดปุ่มตอบได้เลย`);
  }
};

const moveHero = (direction) => {
  if (levelModal.hidden === false) return;

  const targetHero = currentScene === "world" ? hero : levelHero;

  switch (direction) {
    case "up":
      targetHero.y = clamp(targetHero.y - STEP, HERO_SIZE / 2, MAP_SIZE - HERO_SIZE / 2);
      break;
    case "down":
      targetHero.y = clamp(targetHero.y + STEP, HERO_SIZE / 2, MAP_SIZE - HERO_SIZE / 2);
      break;
    case "left":
      targetHero.x = clamp(targetHero.x - STEP, HERO_SIZE / 2, MAP_SIZE - HERO_SIZE / 2);
      break;
    case "right":
      targetHero.x = clamp(targetHero.x + STEP, HERO_SIZE / 2, MAP_SIZE - HERO_SIZE / 2);
      break;
    default:
      return;
  }

  if (currentScene === "world") {
    updateHeroPosition();
    checkLevelCollision();
    return;
  }

  updateLevelHeroPosition();
  checkAnswerCollision();
};

const stopHoldMove = () => {
  if (!holdMoveTimer) return;
  window.clearInterval(holdMoveTimer);
  holdMoveTimer = null;
};

const startHoldMove = (direction) => {
  stopHoldMove();
  moveHero(direction);
  holdMoveTimer = window.setInterval(() => moveHero(direction), 120);
};

const saveProgress = async (level) => {
  if (!currentUser) return;

  const nextUnlocked = Math.max(level.unlockOrder + 1, getUnlockedCount());
  const completedLevels = Array.isArray(playerData?.completedLevels)
    ? new Set(playerData.completedLevels)
    : new Set();

  completedLevels.add(level.id);

  const payload = {
    unlockedLevels: nextUnlocked,
    completedLevels: Array.from(completedLevels),
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, "players", currentUser.uid), payload, { merge: true });
  playerData = {
    ...playerData,
    ...payload
  };
};

const backToWorld = () => {
  currentScene = "world";
  levelShell.hidden = true;
  worldShell.hidden = false;
  activeLevel = null;
  selectedChoiceId = null;
  setStatus("กลับสู่แผนที่แล้ว เดินหาด่านต่อได้เลย");
};

const submitAnswer = async () => {
  if (!activeLevel?.challenge) return;

  if (!selectedChoiceId) {
    setLevelFeedback("ยังไม่ได้ชนคำตอบนะ ลองเดินไปชนคำตอบก่อน", true);
    return;
  }

  const isCorrect = selectedChoiceId === activeLevel.challenge.correctChoiceId;

  if (!isCorrect) {
    setLevelFeedback(activeLevel.challenge.failMessage, true);
    return;
  }

  submitAnswerBtn.disabled = true;
  try {
    await saveProgress(activeLevel);
    setLevelFeedback(activeLevel.challenge.successMessage);
    setStatus(`ผ่าน ${activeLevel.name} แล้ว! ปลดล็อกด่านถัดไปสำเร็จ ✅`);
  } catch {
    setLevelFeedback("ผ่านโจทย์แล้ว แต่บันทึกผลไม่สำเร็จ ลองกดตอบใหม่อีกครั้ง", true);
    submitAnswerBtn.disabled = false;
    return;
  }

  window.setTimeout(() => {
    submitAnswerBtn.disabled = false;
    backToWorld();
  }, 1200);
};

const startLevel = (level) => {
  if (!level.challenge) {
    setStatus("ด่านนี้ยังไม่เปิดให้เล่นในเวอร์ชันนี้");
    closeLevelModal();
    return;
  }

  console.debug("[world] navigating to level", { levelId: level.id, targetScene: "level" });
  activeLevel = level;
  selectedChoiceId = null;
  levelSceneTitle.textContent = level.name;
  levelSceneQuestion.textContent = level.challenge.question;
  setLevelFeedback("เดินชนคำตอบ แล้วกดปุ่มตอบ");
  submitAnswerBtn.disabled = false;

  levelArena.innerHTML = "";
  level.challenge.choices.forEach((choice) => {
    levelArena.appendChild(createAnswerNode(choice));
  });

  levelHero.x = 50;
  levelHero.y = 84;
  levelHero.el = createHeroNode("level-hero");
  levelArena.appendChild(levelHero.el);
  updateLevelHeroPosition();

  closeLevelModal({ resetActive: false, applyCooldown: false });
  currentScene = "level";
  worldShell.hidden = true;
  levelShell.hidden = false;
};

const bindControls = () => {
  worldMap.addEventListener("click", (event) => {
    if (currentScene !== "world" || !levelModal.hidden) return;
    const levelNode = event.target.closest(".level-node");
    if (!levelNode) return;
    const level = WORLD_LEVELS.find((item) => item.id === levelNode.dataset.levelId);
    if (!level) return;
    openLevelModal(level);
  });

  document.querySelectorAll("[data-dir]").forEach((button) => {
    const direction = button.dataset.dir;
    button.addEventListener("click", () => moveHero(direction));

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      startHoldMove(direction);
    });

    button.addEventListener("pointerup", stopHoldMove);
    button.addEventListener("pointercancel", stopHoldMove);
    button.addEventListener("pointerleave", stopHoldMove);
  });

  window.addEventListener("keydown", (event) => {
    const keyMap = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      s: "down",
      a: "left",
      d: "right"
    };

    const direction = keyMap[event.key];
    if (direction) {
      event.preventDefault();
      moveHero(direction);
    }
  });

  window.addEventListener("pointerup", stopHoldMove);

  closeModalBtn.addEventListener("click", () => closeLevelModal());
  levelModal.addEventListener("click", (event) => {
    if (event.target === levelModal) {
      closeLevelModal();
    }
  });

  startLevelBtn.addEventListener("click", () => {
    if (!activeLevel || startLevelBtn.disabled) return;
    console.debug("[world] start level clicked", { levelId: activeLevel.id });
    startLevel(activeLevel);
  });

  submitAnswerBtn.addEventListener("click", submitAnswer);
  backToWorldBtn.addEventListener("click", backToWorld);
  logoutBtn.addEventListener("click", async () => {
    setStatus("กำลังออกจากระบบ...");
    logoutBtn.disabled = true;
    try {
      await signOut(auth);
      window.location.href = "./setup.html";
    } catch {
      setStatus("ออกจากระบบไม่สำเร็จ ลองใหม่อีกครั้ง", true);
      logoutBtn.disabled = false;
    }
  });
};

const renderWorld = () => {
  WORLD_LEVELS.forEach((level) => {
    worldMap.appendChild(createLevelNode(level));
  });

  console.debug("[world] world loaded", { levelCount: WORLD_LEVELS.length });
  hero.el = createHeroNode();
  worldMap.appendChild(hero.el);
  updateHeroPosition();
  console.debug("[world] player spawned", { x: hero.x, y: hero.y });
};

const ensureUser = async () => {
  await setPersistence(auth, browserLocalPersistence);
  if (auth.currentUser?.uid) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
};

const loadPlayer = async (uid) => {
  const ref = doc(db, "players", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
};

const init = async () => {
  try {
    setStatus("กำลังโหลดโปรไฟล์ผู้เล่น...");
    currentUser = await ensureUser();
    playerData = await loadPlayer(currentUser.uid);

    if (!playerData?.playerName || !playerData?.playerCode) {
      window.location.href = "./setup.html";
      return;
    }

    playerGreeting.textContent = `สวัสดี ${playerData.playerName} ออกสำรวจโลกกัน!`;
    setStatus("เดินชนด่านเพื่อเปิดหน้าต่างเริ่มทดสอบ");
    renderWorld();
    bindControls();

    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.register("./service-worker.js");
    }
  } catch {
    setStatus("เชื่อมต่อโลกเกมไม่สำเร็จ กรุณาลองใหม่", true);
  }
};

init();
