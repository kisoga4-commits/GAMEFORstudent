import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { doc, getDoc, getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const worldMap = document.getElementById("worldMap");
const worldStatus = document.getElementById("worldStatus");
const playerGreeting = document.getElementById("playerGreeting");
const coinCount = document.getElementById("coinCount");
const unlockCount = document.getElementById("unlockCount");
const onboardingHint = document.getElementById("onboardingHint");
const levelModal = document.getElementById("levelModal");
const levelName = document.getElementById("levelName");
const levelDescription = document.getElementById("levelDescription");
const levelReward = document.getElementById("levelReward");
const levelBadge = document.getElementById("levelBadge");
const levelLock = document.getElementById("levelLock");
const enterLevelFx = document.getElementById("enterLevelFx");
const startLevelBtn = document.getElementById("startLevelBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

const MAP_SIZE = 100;
const HERO_SIZE = 10;
const LEVEL_SIZE = 14;
const STEP = 2.4;

const levels = [
  {
    id: "forest",
    shortName: "ป่าคณิต",
    name: "ด่านป่าคณิต",
    description: "ชวนเพื่อนสัตว์มาช่วยบวกเลขง่าย ๆ",
    unlockOrder: 1,
    emoji: "🧮",
    reward: "⭐ +1",
    tag: "ลองเลย",
    x: 16,
    y: 26
  },
  {
    id: "river",
    shortName: "แม่น้ำศัพท์",
    name: "ด่านแม่น้ำคำศัพท์",
    description: "ล่องเรือสะกดคำทีละพยางค์",
    unlockOrder: 2,
    emoji: "📘",
    reward: "🪙 +8",
    tag: "มีรางวัล",
    x: 84,
    y: 30
  },
  {
    id: "castle",
    shortName: "ปราสาทตรรกะ",
    name: "ด่านปราสาทตรรกะ",
    description: "แก้ปริศนาเพื่อเปิดประตูปราสาท",
    unlockOrder: 3,
    emoji: "🧩",
    reward: "⭐ +2",
    tag: "ด่านใหม่",
    x: 77,
    y: 74
  }
];

const hero = {
  x: 24,
  y: 78,
  facing: "right",
  el: null
};

let playerData = null;
let activeLevel = null;
let holdMoveTimer = null;
let moveStopTimer = null;

const setStatus = (message, isError = false) => {
  worldStatus.textContent = message;
  worldStatus.classList.toggle("error", isError);
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const showHintOnce = () => {
  const shown = localStorage.getItem("world-hint-v3");
  if (shown) return;
  onboardingHint.hidden = false;
  localStorage.setItem("world-hint-v3", "1");
  window.setTimeout(() => {
    onboardingHint.hidden = true;
  }, 3600);
};

const createLevelNode = (level) => {
  const levelNode = document.createElement("button");
  levelNode.type = "button";
  const unlocked = isLevelUnlocked(level);
  levelNode.className = `level-node ${unlocked ? "unlocked" : "locked"}`;
  levelNode.dataset.levelId = level.id;
  levelNode.style.left = `${level.x}%`;
  levelNode.style.top = `${level.y}%`;
  levelNode.innerHTML = `
    <span class="level-emoji" aria-hidden="true">${level.emoji}</span>
    <span class="level-label">${level.shortName}</span>
    <span class="level-reward">${level.reward}</span>
    <span class="level-tag">${level.tag}</span>
  `;
  levelNode.setAttribute("aria-label", level.name);
  levelNode.addEventListener("click", () => openLevelModal(level));
  return levelNode;
};

const createHeroNode = () => {
  const node = document.createElement("div");
  node.className = "hero";
  node.innerHTML = '<span class="hero-face">🧒</span>';
  return node;
};

const isLevelUnlocked = (level) => {
  const unlockedCount = Number(playerData?.unlockedLevels ?? 1);
  return unlockedCount >= level.unlockOrder;
};

const updateHeroPosition = () => {
  if (!hero.el) return;
  hero.el.style.left = `${hero.x}%`;
  hero.el.style.top = `${hero.y}%`;
  hero.el.classList.toggle("face-left", hero.facing === "left");
};

const heroReaction = () => {
  if (!hero.el) return;
  hero.el.classList.remove("react");
  window.requestAnimationFrame(() => {
    hero.el.classList.add("react");
  });
};

const highlightLevelHit = (levelId) => {
  const node = worldMap.querySelector(`[data-level-id="${levelId}"]`);
  if (!node) return;
  node.classList.add("hit");
  window.setTimeout(() => node.classList.remove("hit"), 260);
};

const checkLevelCollision = () => {
  const hitLevel = levels.find((level) => {
    const dx = Math.abs(hero.x - level.x);
    const dy = Math.abs(hero.y - level.y);
    return dx <= (HERO_SIZE + LEVEL_SIZE) / 2 && dy <= (HERO_SIZE + LEVEL_SIZE) / 2;
  });

  if (!hitLevel || activeLevel?.id === hitLevel.id || !levelModal.hidden) {
    return;
  }

  hero.facing = hero.x > hitLevel.x ? "left" : "right";
  updateHeroPosition();
  heroReaction();
  highlightLevelHit(hitLevel.id);
  openLevelModal(hitLevel);
};

const markHeroMoving = () => {
  if (!hero.el) return;
  hero.el.classList.add("moving");
  window.clearTimeout(moveStopTimer);
  moveStopTimer = window.setTimeout(() => {
    hero.el?.classList.remove("moving");
  }, 180);
};

const moveHero = (direction) => {
  if (!levelModal.hidden) return;

  switch (direction) {
    case "up":
      hero.y = clamp(hero.y - STEP, HERO_SIZE / 2, MAP_SIZE - HERO_SIZE / 2);
      break;
    case "down":
      hero.y = clamp(hero.y + STEP, HERO_SIZE / 2, MAP_SIZE - HERO_SIZE / 2);
      break;
    case "left":
      hero.x = clamp(hero.x - STEP, HERO_SIZE / 2, MAP_SIZE - HERO_SIZE / 2);
      hero.facing = "left";
      break;
    case "right":
      hero.x = clamp(hero.x + STEP, HERO_SIZE / 2, MAP_SIZE - HERO_SIZE / 2);
      hero.facing = "right";
      break;
    default:
      return;
  }

  markHeroMoving();
  updateHeroPosition();
  checkLevelCollision();
};

const hideModal = () => {
  levelModal.classList.remove("show");
  window.setTimeout(() => {
    levelModal.hidden = true;
  }, 190);
};

const closeLevelModal = () => {
  hideModal();
  activeLevel = null;
};

const openLevelModal = (level) => {
  activeLevel = level;
  const unlocked = isLevelUnlocked(level);

  levelName.textContent = level.name;
  levelDescription.textContent = level.description;
  levelReward.textContent = `รางวัลด่าน: ${level.reward}`;
  levelBadge.textContent = level.tag;
  levelLock.textContent = unlocked ? "สถานะ: ✅ ปลดล็อกแล้ว" : "สถานะ: 🔒 ยังไม่ปลดล็อก";

  startLevelBtn.disabled = !unlocked;
  startLevelBtn.textContent = unlocked ? "เริ่มด่าน" : "ยังเริ่มไม่ได้";

  levelModal.hidden = false;
  window.requestAnimationFrame(() => levelModal.classList.add("show"));
};

const playStartTone = () => {
  try {
    const ctx = new window.AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 520;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
    osc.frequency.exponentialRampToValueAtTime(760, ctx.currentTime + 0.25);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // ignore no-audio environments
  }
};

const showEnterTransition = () => {
  enterLevelFx.hidden = false;
  playStartTone();
  window.setTimeout(() => {
    enterLevelFx.hidden = true;
  }, 540);
};

const stopHoldMove = () => {
  if (!holdMoveTimer) return;
  window.clearInterval(holdMoveTimer);
  holdMoveTimer = null;
};

const startHoldMove = (direction) => {
  stopHoldMove();
  moveHero(direction);
  holdMoveTimer = window.setInterval(() => moveHero(direction), 110);
};

const bindControls = () => {
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

  closeModalBtn.addEventListener("click", closeLevelModal);
  levelModal.addEventListener("click", (event) => {
    if (event.target === levelModal) {
      closeLevelModal();
    }
  });

  startLevelBtn.addEventListener("click", () => {
    if (!activeLevel || startLevelBtn.disabled) return;
    showEnterTransition();
    setStatus(`กำลังเข้า ${activeLevel.name}... (ระบบด่านเต็มจะมาในรอบถัดไป)`);
    closeLevelModal();
  });
};

const renderWorld = () => {
  levels.forEach((level) => {
    worldMap.appendChild(createLevelNode(level));
  });

  hero.el = createHeroNode();
  worldMap.appendChild(hero.el);
  updateHeroPosition();
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

const paintHud = () => {
  const unlocked = Number(playerData?.unlockedLevels ?? 1);
  const coins = Number(playerData?.coins ?? unlocked * 12);
  coinCount.textContent = String(coins);
  unlockCount.textContent = `${Math.min(unlocked, levels.length)}/${levels.length}`;
};

const init = async () => {
  try {
    setStatus("กำลังโหลดโปรไฟล์ผู้เล่น...");
    const user = await ensureUser();
    playerData = await loadPlayer(user.uid);

    if (!playerData?.playerName || !playerData?.playerCode) {
      window.location.href = "./setup.html";
      return;
    }

    playerGreeting.textContent = `${playerData.playerName}`;
    paintHud();
    setStatus("เดินสำรวจแล้วชนด่านเพื่อรับรางวัล ⭐");
    renderWorld();
    bindControls();
    showHintOnce();

    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.register("./service-worker.js?v=3");
    }
  } catch {
    setStatus("เชื่อมต่อโลกเกมไม่สำเร็จ กรุณาลองใหม่", true);
  }
};

init();
