import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { auth } from "./firebase.js";
import { logout } from "./services/auth.js";
import { getPlayerProfile } from "./services/player.js";
import {
  clearPlayerPresence,
  countOnlineByStatus,
  countOnlinePlayers,
  setPlayerOnline,
  subscribePresence,
  updatePlayerStatus
} from "./services/presence.js";

const els = {
  playerName: document.getElementById("playerName"),
  rank: document.getElementById("playerRank"),
  coins: document.getElementById("playerCoins"),
  currentLevel: document.getElementById("playerLevel"),
  onlineTotal: document.getElementById("onlineTotal"),
  onlineLobby: document.getElementById("onlineLobby"),
  onlineList: document.getElementById("onlineList"),
  logoutBtn: document.getElementById("logoutBtn"),
  statusMessage: document.getElementById("statusMessage"),
  startLevelBtn: document.getElementById("startLevelBtn"),
  queueDuelBtn: document.getElementById("queueDuelBtn")
};

let currentUser = null;
let currentPlayerName = "Unknown";
let unsubscribePresence = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("./index.html");
    return;
  }

  currentUser = user;
  await initLobby(user);
});

els.startLevelBtn?.addEventListener("click", async () => {
  if (!currentUser) return;

  await updatePlayerStatus(currentUser.uid, "lobby");
  setStatus("พร้อมเล่นด่านแล้ว! (Step ถัดไปจะพาเข้าฉากเกม)");
});

els.queueDuelBtn?.addEventListener("click", async () => {
  if (!currentUser) return;

  await updatePlayerStatus(currentUser.uid, "queue");
  setStatus("คุณเข้าสู่คิวรอดวลแล้ว!");
});

els.logoutBtn?.addEventListener("click", handleLogout);

window.addEventListener("beforeunload", () => {
  if (!currentUser) return;

  clearPlayerPresence(currentUser.uid).catch((error) => {
    console.warn("Presence cleanup before unload failed", error);
  });
});

async function initLobby(user) {
  try {
    const profile = await getPlayerProfile(user.uid);
    currentPlayerName =
      profile?.characterName ||
      user.displayName ||
      `Player-${String(user.uid).slice(0, 6)}`;

    renderProfile(profile, currentPlayerName);

    await setPlayerOnline({ uid: user.uid, playerName: currentPlayerName, status: "lobby" });

    if (unsubscribePresence) {
      unsubscribePresence();
    }

    unsubscribePresence = subscribePresence((presenceMap) => {
      renderPresence(presenceMap);
    });

    setStatus("เชื่อมต่อ Lobby แบบ realtime สำเร็จ");
  } catch (error) {
    console.error(error);
    setStatus("เกิดข้อผิดพลาดในการโหลด Lobby", true);
  }
}

function renderProfile(profile, fallbackName) {
  els.playerName.textContent = profile?.characterName || fallbackName;
  els.rank.textContent = profile?.rank || "Rookie";
  els.coins.textContent = String(profile?.coins ?? 0);
  els.currentLevel.textContent = String(profile?.progress?.currentLevel ?? 1);
}

function renderPresence(presenceMap) {
  const onlineTotal = countOnlinePlayers(presenceMap);
  const onlineLobby = countOnlineByStatus(presenceMap, "lobby");

  els.onlineTotal.textContent = String(onlineTotal);
  els.onlineLobby.textContent = String(onlineLobby);

  const listItems = Object.values(presenceMap)
    .filter((player) => player?.online)
    .sort((a, b) => (a.playerName || "").localeCompare(b.playerName || ""))
    .map((player) => {
      const item = document.createElement("li");
      item.className = "online-item";
      item.innerHTML = `
        <span class="online-name">${escapeHtml(player.playerName || "Unknown")}</span>
        <span class="online-status">${escapeHtml(player.status || "lobby")}</span>
      `;
      return item;
    });

  els.onlineList.replaceChildren(...listItems);

  if (!listItems.length) {
    const empty = document.createElement("li");
    empty.className = "online-empty";
    empty.textContent = "ยังไม่มีผู้เล่นออนไลน์";
    els.onlineList.replaceChildren(empty);
  }
}

async function handleLogout() {
  if (!currentUser) {
    window.location.replace("./index.html");
    return;
  }

  try {
    await clearPlayerPresence(currentUser.uid);
    await logout();
    window.location.replace("./index.html");
  } catch (error) {
    console.error(error);
    setStatus("ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง", true);
  }
}

function setStatus(message, isError = false) {
  els.statusMessage.textContent = message;
  els.statusMessage.style.color = isError ? "#fecaca" : "#bbf7d0";
}

function escapeHtml(rawText) {
  return String(rawText)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
