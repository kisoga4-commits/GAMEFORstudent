import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { db } from "../firebase.js";

export async function savePlayerProfile({ uid, playerName, playerCode }) {
  const playerRef = doc(db, "players", uid);
  const playerSnapshot = await getDoc(playerRef);

  const previousData = playerSnapshot.exists() ? playerSnapshot.data() : {};

  const payload = {
    uid,
    playerName,
    playerCode,
    coins: typeof previousData.coins === "number" ? previousData.coins : 0,
    rank: previousData.rank || "Rookie",
    progress: previousData.progress || {
      currentLevel: 1,
      unlockedLevels: [1]
    },
    inventory: Array.isArray(previousData.inventory) ? previousData.inventory : [],
    isAdmin: previousData.isAdmin ?? false,
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
