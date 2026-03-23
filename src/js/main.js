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
  const characterName = String(formData.get("characterName") || "").trim();
  const accessCode = String(formData.get("accessCode") || "").trim();

  if (!isValidCharacterName(characterName)) {
    setStatus("ชื่อตัวละครต้องมี 2-24 ตัวอักษร (ไทย/อังกฤษ/ตัวเลข)", true);
    return;
  }

  if (!isValidAccessCode(accessCode)) {
    setStatus("รหัสต้องมี 4-16 ตัวอักษร", true);
    return;
  }

  try {
    setLoading(true);
    setStatus("กำลังเข้าสู่ระบบ...");

    const user = await loginAnonymously();
    await savePlayerProfile({
      uid: user.uid,
      characterName,
      accessCode
    });

    setStatus("เข้าสู่ระบบสำเร็จ กำลังไปหน้า Lobby...");
    window.location.href = "./lobby.html";
  } catch (error) {
    console.error(error);
    setStatus("เกิดข้อผิดพลาดในการเข้าเกม โปรดลองอีกครั้ง", true);
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? "กำลังดำเนินการ..." : "เข้าเกม";
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("status-error", isError);
  statusMessage.classList.toggle("status-success", !isError && Boolean(message));
}

function isValidCharacterName(name) {
  return /^[\p{L}\p{N}_\-\s]{2,24}$/u.test(name);
}

function isValidAccessCode(code) {
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
