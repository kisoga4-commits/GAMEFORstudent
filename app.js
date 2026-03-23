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
const levelModal = document.getElementById("levelModal");
const levelName = document.getElementById("levelName");
const levelDescription = document.getElementById("levelDescription");
const levelLock = document.getElementById("levelLock");
const startLevelBtn = document.getElementById("startLevelBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

const MAP_SIZE = 100;
const HERO_SIZE = 10;
const LEVEL_SIZE = 13;
const STEP = 3;

const levels = [
  {
    id: "forest",
    name: "ด่านป่าคณิต",
    description: "ฝึกบวกเลขกับเพื่อนสัตว์ในป่า",
    unlockOrder: 1,
    x: 12,
    y: 18
  },
  {
    id: "river",
    name: "ด่านแม่น้ำคำศัพท์",
    description: "พายเรือสะกดคำศัพท์ง่าย ๆ",
    unlockOrder: 2,
    x: 62,
    y: 30
  },
  {
    id: "castle",
    name: "ด่านปราสาทตรรกะ",
    description: "แก้ปริศนาตรรกะเพื่อขึ้นปราสาท",
    unlockOrder: 3,
    x: 38,
    y: 68
  }
];

const hero = {
  x: 50,
  y: 52,
  el: null
};

let playerData = null;
let activeLevel = null;

const setStatus = (message, isError = false) => {
  worldStatus.textContent = message;
  worldStatus.classList.toggle("error", isError);
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const createLevelNode = (level) => {
  const levelNode = document.createElement("button");
  levelNode.type = "button";
  levelNode.className = "level-node";
  levelNode.dataset.levelId = level.id;
  levelNode.style.left = `${level.x}%`;
  levelNode.style.top = `${level.y}%`;
  levelNode.textContent = "🏁";
  levelNode.setAttribute("aria-label", level.name);
  return levelNode;
};

const createHeroNode = () => {
  const node = document.createElement("div");
  node.className = "hero";
  node.innerHTML = '<span class="hero-face">😊</span>';
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

  openLevelModal(hitLevel);
};

const moveHero = (direction) => {
  switch (direction) {
    case "up":
      hero.y = clamp(hero.y - STEP, HERO_SIZE / 2, MAP_SIZE - HERO_SIZE / 2);
      break;
    case "down":
      hero.y = clamp(hero.y + STEP, HERO_SIZE / 2, MAP_SIZE - HERO_SIZE / 2);
      break;
    case "left":
      hero.x = clamp(hero.x - STEP, HERO_SIZE / 2, MAP_SIZE - HERO_SIZE / 2);
      break;
    case "right":
      hero.x = clamp(hero.x + STEP, HERO_SIZE / 2, MAP_SIZE - HERO_SIZE / 2);
      break;
    default:
      return;
  }

  updateHeroPosition();
  checkLevelCollision();
};

const closeLevelModal = () => {
  levelModal.hidden = true;
  activeLevel = null;
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
};

const bindControls = () => {
  document.querySelectorAll("[data-dir]").forEach((button) => {
    button.addEventListener("click", () => {
      moveHero(button.dataset.dir);
    });
  });

  window.addEventListener("keydown", (event) => {
    if (!levelModal.hidden) return;

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

  closeModalBtn.addEventListener("click", closeLevelModal);
  levelModal.addEventListener("click", (event) => {
    if (event.target === levelModal) {
      closeLevelModal();
    }
  });

  startLevelBtn.addEventListener("click", () => {
    if (!activeLevel || startLevelBtn.disabled) return;
    setStatus(`กำลังเตรียม ${activeLevel.name}... (เดี๋ยวเชื่อมระบบด่านจริง)`);
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

const init = async () => {
  try {
    setStatus("กำลังโหลดโปรไฟล์...");
    const user = await ensureUser();
    playerData = await loadPlayer(user.uid);

    if (!playerData?.playerName || !playerData?.playerCode) {
      window.location.href = "./setup.html";
      return;
    }

    playerGreeting.textContent = `สวัสดี ${playerData.playerName} พร้อมผจญภัย!`;
    setStatus("เดินด้วยปุ่มบนจอ หรือปุ่มลูกศร/WASD เพื่อชนจุดด่าน");
    renderWorld();
    bindControls();

    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.register("./service-worker.js");
    }
  } catch {
    setStatus("เชื่อมต่อเกมไม่สำเร็จ ลองใหม่อีกครั้ง", true);
  }
};

init();
