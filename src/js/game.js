import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { auth } from "./firebase.js";
import { getPlayerProfile } from "./services/player.js";
import { getLevelById, listLevels } from "./services/levels.js";

const levelSelect = document.getElementById("levelSelect");
const loadLevelBtn = document.getElementById("loadLevelBtn");
const levelTitle = document.getElementById("levelTitle");
const levelWorld = document.getElementById("levelWorld");
const levelDescription = document.getElementById("levelDescription");
const levelQuestion = document.getElementById("levelQuestion");
const levelChoices = document.getElementById("levelChoices");
const levelAnswer = document.getElementById("levelAnswer");
const levelReward = document.getElementById("levelReward");
const statusMessage = document.getElementById("statusMessage");

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "./index.html";
    return;
  }

  currentUser = user;

  try {
    setStatus("กำลังโหลดข้อมูลผู้เล่น...");
    const profile = await getPlayerProfile(user.uid);

    if (!profile?.characterName) {
      setStatus("ไม่พบข้อมูลผู้เล่น กลับหน้าเข้าเกม", true);
      setTimeout(() => {
        window.location.href = "./index.html";
      }, 900);
      return;
    }

    await initLevelSelector(profile.progress?.currentLevel);
    bindEvents();

    setStatus("โหลดรายชื่อด่านสำเร็จ");
  } catch (error) {
    console.error(error);
    setStatus("โหลดฉากเกมไม่สำเร็จ โปรดลองอีกครั้ง", true);
  }
});

function bindEvents() {
  loadLevelBtn?.addEventListener("click", async () => {
    const levelId = levelSelect?.value;

    if (!levelId) {
      setStatus("กรุณาเลือกด่านก่อน", true);
      return;
    }

    await loadLevelScene(levelId);
  });
}

async function initLevelSelector(defaultDifficultyRank) {
  const levels = await listLevels();

  if (levels.length === 0) {
    setStatus("ยังไม่มีด่าน active ใน Firestore ให้เพิ่มใน collection: levels", true);
    setLevelView(null);
    return;
  }

  if (levelSelect) {
    levelSelect.innerHTML = "";

    levels.forEach((level) => {
      const option = document.createElement("option");
      option.value = level.levelId;
      option.textContent = `${level.difficultyRank}. ${level.title || level.levelId}`;
      levelSelect.appendChild(option);
    });
  }

  const preferredLevel =
    levels.find((level) => Number(level.difficultyRank) === Number(defaultDifficultyRank)) || levels[0];

  if (levelSelect) {
    levelSelect.value = preferredLevel.levelId;
  }

  await loadLevelScene(preferredLevel.levelId);
}

async function loadLevelScene(levelId) {
  if (!currentUser) {
    return;
  }

  try {
    setLoading(true);
    setStatus(`กำลังโหลดด่าน ${levelId} จาก Firestore...`);

    const level = await getLevelById(levelId);

    if (!level || level.status !== "active") {
      setLevelView(null);
      setStatus(`ไม่พบด่าน active: ${levelId}`, true);
      return;
    }

    setLevelView(level);
    setStatus(`โหลดด่าน ${level.levelId} สำเร็จ`);
  } catch (error) {
    console.error(error);
    setStatus("เกิดข้อผิดพลาดระหว่างโหลดด่าน", true);
  } finally {
    setLoading(false);
  }
}

function setLevelView(level) {
  if (!level) {
    levelTitle.textContent = "ไม่พบข้อมูลด่าน";
    levelWorld.textContent = "-";
    levelDescription.textContent = "-";
    levelQuestion.textContent = "-";
    levelChoices.textContent = "-";
    levelAnswer.textContent = "-";
    levelReward.textContent = "-";
    return;
  }

  levelTitle.textContent = `${level.difficultyRank || "-"}. ${level.title || level.levelId}`;
  levelWorld.textContent = level.worldId || "-";
  levelDescription.textContent = level.description || "-";
  levelQuestion.textContent = level.questionText || "-";
  levelChoices.textContent = `A) ${level.choiceA} | B) ${level.choiceB} | C) ${level.choiceC}`;
  levelAnswer.textContent = `${level.correctAnswer} (${level[`choice${level.correctAnswer}`] || "-"})`;
  levelReward.textContent = `${level.rewardCoins} coins, item chance ${level.rewardItemChance}`;
}

function setLoading(isLoading) {
  if (loadLevelBtn) {
    loadLevelBtn.disabled = isLoading;
  }
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("status-error", isError);
  statusMessage.classList.toggle("status-success", !isError && Boolean(message));
}
