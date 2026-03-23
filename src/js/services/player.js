import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { db } from "../firebase.js";

export async function savePlayerProfile({ uid, characterName, accessCode }) {
  const playerRef = doc(db, "players", uid);
  const playerSnapshot = await getDoc(playerRef);

  const payload = {
    uid,
    characterName,
    accessCodeHash: await sha256(accessCode),
    progress: {
      currentLevel: 1,
      unlockedLevels: [1]
    },
    inventory: [],
    updatedAt: serverTimestamp()
  };

  if (!playerSnapshot.exists()) {
    payload.createdAt = serverTimestamp();
  }

  await setDoc(playerRef, payload, { merge: true });
}

export async function getPlayerProfile(uid) {
  const playerRef = doc(db, "players", uid);
  const playerSnapshot = await getDoc(playerRef);

  if (!playerSnapshot.exists()) {
    return null;
  }

  return playerSnapshot.data();
}

async function sha256(value) {
  const content = new TextEncoder().encode(value);
  const buffer = await crypto.subtle.digest("SHA-256", content);
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
