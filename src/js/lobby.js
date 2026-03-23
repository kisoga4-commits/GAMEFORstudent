import { ensureAnonymousSession } from "./services/auth.js";
import { getPlayerProfileByUid } from "./services/player.js";

const lobbyStatus = document.getElementById("lobbyStatus");
const profileName = document.getElementById("profileName");
const profileCode = document.getElementById("profileCode");
const profileCoins = document.getElementById("profileCoins");
const profileRank = document.getElementById("profileRank");
const profileLevel = document.getElementById("profileLevel");

initLobby();

/**
 * โหลดข้อมูลผู้เล่นในหน้า Lobby
 */
async function initLobby() {
  try {
    setLobbyStatus("กำลังโหลดข้อมูลผู้เล่น...");

    const cachedProfile = sessionStorage.getItem("playerProfile");
    if (cachedProfile) {
      renderProfile(JSON.parse(cachedProfile));
      setLobbyStatus("ยินดีต้อนรับสู่ Lobby");
      return;
    }

    // fallback: ถ้าไม่มี cache ให้ดึงจาก Firestore ด้วย uid ปัจจุบัน
    const user = await ensureAnonymousSession();
    const profile = await getPlayerProfileByUid(user.uid);

    if (!profile) {
      setLobbyStatus("ไม่พบข้อมูลผู้เล่น กรุณากลับไปหน้าเข้าเกม", true);
      return;
    }

    renderProfile(profile);
    setLobbyStatus("ยินดีต้อนรับสู่ Lobby");
  } catch (error) {
    console.error("Failed to load lobby data:", error);
    setLobbyStatus("โหลดข้อมูล Lobby ไม่สำเร็จ", true);
  }
}

function renderProfile(profile) {
  profileName.textContent = profile.playerName || "-";
  profileCode.textContent = profile.playerCode || "-";
  profileCoins.textContent = String(profile.coins ?? 0);
  profileRank.textContent = String(profile.rank ?? 1);
  profileLevel.textContent = String(profile.currentLevel ?? 1);
}

function setLobbyStatus(message, isError = false) {
  lobbyStatus.textContent = message;
  lobbyStatus.classList.toggle("status-error", isError);
}
