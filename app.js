import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const form = document.getElementById("profileForm");
const playerNameInput = document.getElementById("playerName");
const playerCodeInput = document.getElementById("playerCode");
const statusEl = document.getElementById("status");
const installBtn = document.getElementById("installBtn");

let deferredPrompt = null;
let currentUid = null;

const setStatus = (message, isError = false) => {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
};

const fillForm = (data) => {
  if (!data) return;
  playerNameInput.value = data.playerName || "";
  playerCodeInput.value = data.playerCode || "";
};

const getLocalKey = (uid) => `forkid-profile-${uid}`;

const saveLocal = (uid, payload) => {
  localStorage.setItem(getLocalKey(uid), JSON.stringify(payload));
};

const readLocal = (uid) => {
  const raw = localStorage.getItem(getLocalKey(uid));
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const loadProfile = async (uid) => {
  const localData = readLocal(uid);
  if (localData) {
    fillForm(localData);
    setStatus("โหลดข้อมูลล่าสุดจากเครื่องแล้ว");
  }

  const ref = doc(db, "players", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const cloudData = snap.data();
    fillForm(cloudData);
    saveLocal(uid, cloudData);
    setStatus("โหลดข้อมูลจาก Cloud Firestore สำเร็จ");
  } else if (!localData) {
    setStatus("ยังไม่มีข้อมูลเดิม เริ่มกรอกข้อมูลได้เลย");
  }
};

const saveProfile = async (uid) => {
  const payload = {
    playerName: playerNameInput.value.trim(),
    playerCode: playerCodeInput.value.trim(),
    updatedAt: serverTimestamp()
  };

  if (!payload.playerName || !payload.playerCode) {
    setStatus("กรุณากรอกข้อมูลให้ครบ", true);
    return;
  }

  await setDoc(doc(db, "players", uid), payload, { merge: true });
  saveLocal(uid, { playerName: payload.playerName, playerCode: payload.playerCode });
  setStatus("บันทึกข้อมูลและซิงก์ขึ้น Cloud แล้ว");
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUid) {
    setStatus("กำลังเชื่อมต่อบัญชีผู้ใช้ กรุณาลองอีกครั้ง", true);
    return;
  }

  try {
    await saveProfile(currentUid);
  } catch (error) {
    setStatus(`บันทึกไม่สำเร็จ: ${error.message}`, true);
  }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  currentUid = user.uid;

  try {
    await loadProfile(user.uid);
  } catch (error) {
    setStatus(`โหลดข้อมูลไม่สำเร็จ: ${error.message}`, true);
  }
});

const init = async () => {
  try {
    await signInAnonymously(auth);
  } catch (error) {
    setStatus(`Anonymous Auth ล้มเหลว: ${error.message}`, true);
  }

  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("./service-worker.js");
    } catch (error) {
      setStatus(`Service Worker ติดตั้งไม่สำเร็จ: ${error.message}`, true);
    }
  }
};

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

window.addEventListener("appinstalled", () => {
  setStatus("ติดตั้งแอปสำเร็จ");
  installBtn.hidden = true;
});

init();
