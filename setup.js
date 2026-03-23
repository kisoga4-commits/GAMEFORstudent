import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  signInAnonymously,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const form = document.getElementById("profileForm");
const playerNameInput = document.getElementById("playerName");
const playerCodeInput = document.getElementById("playerCode");
const statusEl = document.getElementById("status");
const logoutBtn = document.getElementById("logoutBtn");

const setStatus = (message, isError = false) => {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
};

const ensureUser = async () => {
  await setPersistence(auth, browserLocalPersistence);
  if (auth.currentUser?.uid) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
};

const loadProfile = async (uid) => {
  const ref = doc(db, "players", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data();
};

const saveProfile = async (uid) => {
  const playerName = playerNameInput.value.trim();
  const playerCode = playerCodeInput.value.trim();

  if (!playerName || !playerCode) {
    setStatus("กรอกชื่อกับรหัสให้ครบก่อนนะ", true);
    return;
  }

  setStatus("กำลังบันทึก...");

  const ref = doc(db, "players", uid);
  const snap = await getDoc(ref);
  const payload = {
    uid,
    playerName,
    playerCode,
    unlockedLevels: snap.exists() ? snap.data().unlockedLevels ?? 1 : 1,
    createdAt: snap.exists() ? snap.data().createdAt ?? serverTimestamp() : serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(ref, payload, { merge: true });
  setStatus("พร้อมแล้ว! กำลังเข้าโลกหลัก...");
  window.location.href = "./index.html";
};

const init = async () => {
  try {
    const user = await ensureUser();
    const profile = await loadProfile(user.uid);

    if (profile?.playerName && profile?.playerCode) {
      window.location.href = "./index.html";
      return;
    }

    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.register("./service-worker.js");
    }

    setStatus("ตั้งชื่อแล้วเริ่มผจญภัยได้เลย");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await saveProfile(user.uid);
      } catch {
        setStatus("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง", true);
      }
    });

    logoutBtn.addEventListener("click", async () => {
      setStatus("กำลังออกจากระบบ...");
      logoutBtn.disabled = true;
      try {
        await signOut(auth);
        setStatus("ออกจากระบบแล้ว กำลังรีเซ็ตหน้าจอ...");
        window.location.reload();
      } catch {
        setStatus("ออกจากระบบไม่สำเร็จ ลองใหม่อีกครั้ง", true);
        logoutBtn.disabled = false;
      }
    });
  } catch {
    setStatus("เชื่อมต่อ Firebase ไม่สำเร็จ", true);
  }
};

init();
