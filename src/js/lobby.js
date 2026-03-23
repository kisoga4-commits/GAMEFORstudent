import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { auth } from "./firebase.js";
import { logout } from "./services/auth.js";
import { getPlayerProfile } from "./services/player.js";
import { joinQueue } from "./services/duelQueue.js";

const playerNameDisplay = document.getElementById("playerNameDisplay");
const coinsDisplay = document.getElementById("coinsDisplay");
const rankDisplay = document.getElementById("rankDisplay");
const waitDuelBtn = document.getElementById("waitDuelBtn");
const logoutBtn = document.getElementById("logoutBtn");
const statusMessage = document.getElementById("statusMessage");

let currentUser = null;
let playerName = "";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "./index.html";
    return;
  }

  currentUser = user;

  try {
    setStatus("กำลังโหลดข้อมูลผู้เล่น...");
    const profile = await getPlayerProfile(user.uid);

    if (!profile?.playerName) {
      setStatus("ไม่พบข้อมูลผู้เล่น กลับไปหน้าเข้าเกม", true);
      setTimeout(() => {
        window.location.href = "./index.html";
      }, 900);
      return;
    }

    playerName = profile.playerName;
    playerNameDisplay.textContent = profile.playerName;
    coinsDisplay.textContent = String(profile.coins ?? 0);
    rankDisplay.textContent = String(profile.rank || "Rookie");

    setStatus("พร้อมเล่นแล้ว เลือกโหมดที่ต้องการได้เลย");
  } catch (error) {
    console.error(error);
    setStatus("โหลดข้อมูล Lobby ไม่สำเร็จ โปรดลองอีกครั้ง", true);
  }
});

waitDuelBtn?.addEventListener("click", async () => {
  if (!currentUser) {
    return;
  }

  try {
    setButtonsLoading(true);
    setStatus("กำลังเข้าคิวรอดวล...");
    await joinQueue({ uid: currentUser.uid, playerName, mode: "solo" });
    setStatus("เข้าคิวรอดวลแล้ว รอสักครู่...");
  } catch (error) {
    console.error(error);
    setStatus("เข้าคิวไม่สำเร็จ โปรดลองอีกครั้ง", true);
  } finally {
    setButtonsLoading(false);
  }
});

logoutBtn?.addEventListener("click", async () => {
  try {
    setButtonsLoading(true);
    await logout();
    window.location.href = "./index.html";
  } catch (error) {
    console.error(error);
    setStatus("ออกจากระบบไม่สำเร็จ", true);
    setButtonsLoading(false);
  }
});

function setButtonsLoading(isLoading) {
  if (waitDuelBtn) {
    waitDuelBtn.disabled = isLoading;
  }

  if (logoutBtn) {
    logoutBtn.disabled = isLoading;
  }
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("status-error", isError);
  statusMessage.classList.toggle("status-success", !isError && Boolean(message));
}
