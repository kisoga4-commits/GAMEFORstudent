import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { auth } from "./firebase.js";
import { getPlayerProfile } from "./services/player.js";
import {
  ensureLobbyPresence,
  getQueueCount,
  initPresence,
  isPlayerInQueue,
  joinQueue,
  leaveQueue,
  subscribePresence,
  subscribeQueue
} from "./services/duelQueue.js";

const waitDuelBtn = document.getElementById("waitDuelBtn");
const cancelQueueBtn = document.getElementById("cancelQueueBtn");
const queueList = document.getElementById("queueList");
const onlineCount = document.getElementById("onlineCount");
const lobbyCount = document.getElementById("lobbyCount");
const queueCount = document.getElementById("queueCount");
const queueStateText = document.getElementById("queueStateText");
const statusMessage = document.getElementById("statusMessage");

let currentUser = null;
let playerName = "";
let queueMap = {};

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
      setStatus("ไม่พบข้อมูลผู้เล่น กลับไปหน้าเข้าเกม", true);
      setTimeout(() => {
        window.location.href = "./index.html";
      }, 900);
      return;
    }

    playerName = profile.characterName;
    await initPresence({ uid: user.uid, playerName });
    await ensureLobbyPresence(user.uid);
    await syncQueueState();

    bindListeners();
    bindEvents();

    const initialQueueCount = await getQueueCount();
    queueCount.textContent = String(initialQueueCount);
    setStatus("เชื่อมต่อคิวรอดวลสำเร็จ");
  } catch (error) {
    console.error(error);
    setStatus("โหลด Lobby ไม่สำเร็จ โปรดลองรีเฟรช", true);
  }
});

function bindEvents() {
  waitDuelBtn?.addEventListener("click", async () => {
    if (!currentUser) {
      return;
    }

    try {
      setButtonsLoading(true);
      setStatus("กำลังเข้าคิวรอดวล...");
      await joinQueue({ uid: currentUser.uid, playerName, mode: "solo" });
      setStatus("เข้าคิวสำเร็จ กำลังรอคู่แข่ง");
    } catch (error) {
      console.error(error);
      setStatus("เข้าคิวไม่สำเร็จ โปรดลองอีกครั้ง", true);
    } finally {
      setButtonsLoading(false);
    }
  });

  cancelQueueBtn?.addEventListener("click", async () => {
    if (!currentUser) {
      return;
    }

    try {
      setButtonsLoading(true);
      setStatus("กำลังยกเลิกรอดวล...");
      await leaveQueue(currentUser.uid);
      setStatus("ยกเลิกคิวแล้ว กลับสู่ Lobby");
    } catch (error) {
      console.error(error);
      setStatus("ยกเลิกคิวไม่สำเร็จ", true);
    } finally {
      setButtonsLoading(false);
    }
  });
}

function bindListeners() {
  subscribePresence((presenceMap) => {
    const players = Object.values(presenceMap);
    const onlinePlayers = players.filter((player) => player?.online);
    const lobbyPlayers = onlinePlayers.filter((player) => player?.status === "lobby");
    const queuePlayers = onlinePlayers.filter((player) => player?.status === "queue");

    onlineCount.textContent = String(onlinePlayers.length);
    lobbyCount.textContent = String(lobbyPlayers.length);
    queueCount.textContent = String(queuePlayers.length);
  });

  subscribeQueue((nextQueueMap) => {
    queueMap = nextQueueMap;
    renderQueueList();
    renderMyQueueState();
  });
}

async function syncQueueState() {
  if (!currentUser) {
    return;
  }

  const inQueue = await isPlayerInQueue(currentUser.uid);

  if (!inQueue) {
    queueStateText.textContent = "ยังไม่เข้าคิว";
    waitDuelBtn.hidden = false;
    cancelQueueBtn.hidden = true;
    return;
  }

  queueStateText.textContent = "กำลังรอคู่แข่ง";
  waitDuelBtn.hidden = true;
  cancelQueueBtn.hidden = false;
}

function renderQueueList() {
  const queuePlayers = Object.values(queueMap);

  queueList.innerHTML = "";

  if (queuePlayers.length === 0) {
    queueList.innerHTML = '<li class="queue-item queue-item-empty">ยังไม่มีผู้เล่นในคิว</li>';
    return;
  }

  const fragment = document.createDocumentFragment();

  queuePlayers
    .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0))
    .forEach((player) => {
      const item = document.createElement("li");
      item.className = "queue-item";
      item.textContent = player.playerName;
      fragment.appendChild(item);
    });

  queueList.appendChild(fragment);
}

function renderMyQueueState() {
  if (!currentUser) {
    return;
  }

  const inQueue = Boolean(queueMap[currentUser.uid]);

  queueStateText.textContent = inQueue ? "กำลังรอคู่แข่ง" : "ยังไม่เข้าคิว";
  waitDuelBtn.hidden = inQueue;
  cancelQueueBtn.hidden = !inQueue;
}

function setButtonsLoading(isLoading) {
  if (waitDuelBtn) {
    waitDuelBtn.disabled = isLoading;
  }

  if (cancelQueueBtn) {
    cancelQueueBtn.disabled = isLoading;
  }
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("status-error", isError);
  statusMessage.classList.toggle("status-success", !isError && Boolean(message));
}
