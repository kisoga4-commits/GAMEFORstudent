import { analyticsPromise } from "./firebase.js";
import { loginAnonymously } from "./services/auth.js";
import { savePlayerProfile } from "./services/player.js";

const loginForm = document.getElementById("loginForm");
const submitBtn = document.getElementById("submitBtn");
const statusMessage = document.getElementById("statusMessage");

registerServiceWorker();
void analyticsPromise;

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const playerName = String(formData.get("playerName") || "").trim();
  const playerCode = String(formData.get("playerCode") || "").trim();

  if (!isValidPlayerName(playerName)) {
    setStatus("ชื่อตัวละครต้องมี 2-24 ตัวอักษร (ไทย/อังกฤษ/ตัวเลข)", true);
    return;
  }

  if (!isValidPlayerCode(playerCode)) {
    setStatus("รหัสต้องมี 4-16 ตัวอักษร", true);
    return;
  }

  try {
    setLoading(true);
    setStatus("กำลังเข้าเล่น...");

    const user = await loginAnonymously();
    await savePlayerProfile({
      uid: user.uid,
      playerName,
      playerCode
    });

    setStatus("เข้าเล่นสำเร็จ กำลังไปหน้า Lobby...");
    window.location.href = "./lobby.html";
  } catch (error) {
    console.error(error);
    setStatus("เกิดข้อผิดพลาดในการเข้าเล่น โปรดลองอีกครั้ง", true);
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? "กำลังดำเนินการ..." : "เข้าเล่น";
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
  return code.length >= 4 && code.length <= 16;
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        await navigator.serviceWorker.register("./sw.js");
      } catch (error) {
        console.warn("Service worker registration failed", error);
      }
    });
  }
}
