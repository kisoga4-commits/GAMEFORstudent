import {
  doc,
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
