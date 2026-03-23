import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously
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
const installBtn = document.getElementById("installBtn");

const STATUS_SAVING = "⏳ กำลังบันทึก...";
const STATUS_SAVE_SUCCESS = "✅ บันทึกแล้ว";
const STATUS_LOAD_SUCCESS = "✅ โหลดแล้ว";
const STATUS_ERROR = "⚠️ ผิดพลาด";

let deferredPrompt = null;
let currentUid = null;

const setStatus = (message, isError = false) => {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
};

const fillForm = (data) => {
  playerNameInput.value = data?.playerName ?? "";
  playerCodeInput.value = data?.playerCode ?? "";
};

const loadProfile = async (uid) => {
  const ref = doc(db, "players", uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    fillForm(snap.data());
  } else {
    fillForm({ playerName: "", playerCode: "" });
  }

  setStatus(STATUS_LOAD_SUCCESS);
};

const saveProfile = async (uid) => {
  const playerName = playerNameInput.value.trim();
  const playerCode = playerCodeInput.value.trim();

  if (!playerName || !playerCode) {
    setStatus(STATUS_ERROR, true);
    return;
  }

  setStatus(STATUS_SAVING);

  const ref = doc(db, "players", uid);
  const snap = await getDoc(ref);
  const payload = {
    uid,
    playerName,
    playerCode,
    createdAt: snap.exists() ? snap.data().createdAt ?? serverTimestamp() : serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(ref, payload, { merge: true });
  setStatus(STATUS_SAVE_SUCCESS);
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUid) {
    setStatus(STATUS_ERROR, true);
    return;
  }

  try {
    await saveProfile(currentUid);
  } catch {
    setStatus(STATUS_ERROR, true);
  }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  currentUid = user.uid;

  try {
    await loadProfile(user.uid);
  } catch {
    setStatus(STATUS_ERROR, true);
  }
});

const init = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch {
    setStatus(STATUS_ERROR, true);
  }

  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("./service-worker.js");
    } catch {
      setStatus(STATUS_ERROR, true);
    }
  }

  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  if (isStandalone) {
    installBtn.hidden = true;
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
  installBtn.hidden = true;
});

init();
