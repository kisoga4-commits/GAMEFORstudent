import { analyticsPromise } from "./firebase.js";
import { loginAnonymously } from "./services/auth.js";
import { getPlayerProfile, savePlayerProfile } from "./services/player.js";

const loginForm = document.getElementById("loginForm");
const playerNameInput = document.getElementById("playerName");
const playerCodeInput = document.getElementById("playerCode");
const submitBtn = document.getElementById("submitBtn");
const installBtn = document.getElementById("installBtn");
const statusMessage = document.getElementById("statusMessage");

let deferredInstallPrompt = null;

registerServiceWorker();
setupInstallPrompt();
void analyticsPromise;
void initializeForm();

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const playerName = String(formData.get("playerName") || "").trim();
  const playerCode = String(formData.get("playerCode") || "").trim();

  if (!isValidPlayerName(playerName)) {
    setStatus("playerName ต้องยาว 2-24 ตัวอักษร", true);
    return;
  }

  if (!isValidPlayerCode(playerCode)) {
    setStatus("playerCode ต้องยาว 4-24 ตัวอักษร", true);
    return;
  }

  try {
    setLoading(true);
    setStatus("กำลังบันทึกข้อมูลขึ้น Cloud...");

    const user = await ensureAnonymousSession();
    await savePlayerProfile({
      uid: user.uid,
      playerName,
      playerCode
    });

    setStatus(`บันทึกสำเร็จ (uid: ${user.uid.slice(0, 8)}...)`, false);
  } catch (error) {
    console.error(error);
    setStatus("เกิดข้อผิดพลาดในการบันทึก โปรดลองอีกครั้ง", true);
  } finally {
    setLoading(false);
  }
});

async function initializeForm() {
  try {
    setLoading(true);
    setStatus("กำลังเชื่อมต่อ Firebase...");

    const user = await ensureAnonymousSession();
    const profile = await getPlayerProfile(user.uid);

    if (profile) {
      playerNameInput.value = profile.playerName || "";
      playerCodeInput.value = profile.playerCode || "";
      setStatus("โหลดข้อมูลเดิมจาก Cloud แล้ว");
      return;
    }

    setStatus("ยังไม่มีข้อมูลผู้เล่นใน Cloud กรอกแล้วกดบันทึกได้เลย");
  } catch (error) {
    console.error(error);
    setStatus("เชื่อมต่อ Firebase ไม่สำเร็จ", true);
  } finally {
    setLoading(false);
  }
}

async function ensureAnonymousSession() {
  return loginAnonymously();
}

function setupInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installBtn.hidden = false;
  });

  installBtn?.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      setStatus("อุปกรณ์นี้ยังไม่พร้อมติดตั้ง PWA", true);
      return;
    }

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.hidden = true;
  });
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? "กำลังดำเนินการ..." : "บันทึกข้อมูล";
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("status-error", isError);
  statusMessage.classList.toggle("status-success", !isError && Boolean(message));
}

function isValidPlayerName(name) {
  return /^[\p{L}\p{N}_\-\s]{2,24}$/u.test(name);
}

function isValidPlayerCode(code) {
  return code.length >= 4 && code.length <= 24;
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./sw.js");
    } catch (error) {
      console.warn("Service worker registration failed", error);
    }
  });
}
