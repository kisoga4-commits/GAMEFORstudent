import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { db } from "../firebase.js";

export async function savePlayerProfile({ uid, characterName, accessCode }) {
  const playerRef = doc(db, "players", uid);

  await setDoc(
    playerRef,
    {
      uid,
      characterName,
      accessCode,
      rank: "Rookie",
      coins: 0,
      progress: {
        currentLevel: 1,
        unlockedLevels: [1]
      },
      inventory: [],
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function getPlayerProfile(uid) {
  const playerRef = doc(db, "players", uid);
  const snapshot = await getDoc(playerRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data();
}
