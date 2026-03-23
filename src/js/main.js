import { ensureAnonymousSession } from "./services/auth.js";
import { upsertAndGetPlayerProfile } from "./services/player.js";

const loginForm = document.getElementById("loginForm");
const submitBtn = document.getElementById("submitBtn");
const statusMessage = document.getElementById("statusMessage");

registerServiceWorker();

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const playerName = String(formData.get("playerName") || "").trim();
  const playerCode = String(formData.get("playerCode") || "").trim();

  const validationError = validateLoginInput({ playerName, playerCode });
  if (validationError) {
    setStatus(validationError, true);
    return;
  }

  try {
    setLoading(true);
    setStatus("กำลังเข้าเล่น...");

    // 1) เข้าใช้งานด้วย Anonymous Auth
    const user = await ensureAnonymousSession();

    // 2) สร้าง/อัปเดตโปรไฟล์ผู้เล่นใน Firestore แล้วอ่านข้อมูลล่าสุดกลับ
    const playerProfile = await upsertAndGetPlayerProfile({
      uid: user.uid,
      playerName,
      playerCode
    });

    // เก็บข้อมูลชั่วคราวไว้ให้หน้า Lobby ใช้แสดงผลได้ทันที
    sessionStorage.setItem("playerProfile", JSON.stringify(playerProfile));

    setStatus("เข้าเล่นสำเร็จ! กำลังไปหน้า Lobby...");
    window.location.href = "./lobby.html";
  } catch (error) {
    console.error("Login flow failed:", error);
    setStatus("เข้าเล่นไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", true);
  } finally {
    setLoading(false);
  }
});

/**
 * ตรวจสอบข้อมูลก่อนเรียก Firebase
 */
function validateLoginInput({ playerName, playerCode }) {
  if (!playerName) {
    return "กรุณากรอกชื่อตัวละคร";
  }

  if (!playerCode) {
    return "กรุณากรอกรหัส";
  }

  if (playerName.length > 20) {
    return "ชื่อตัวละครต้องไม่เกิน 20 ตัวอักษร";
  }

  return null;
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? "กำลังดำเนินการ..." : "เข้าเล่น";
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("status-error", isError);
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
