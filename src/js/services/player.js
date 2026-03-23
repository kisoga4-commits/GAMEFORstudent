import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { db } from "../firebase.js";

/**
 * อ่านโปรไฟล์ผู้เล่นจาก Firestore ด้วย uid
 */
export async function getPlayerProfileByUid(uid) {
  const playerRef = doc(db, "players", uid);
  const playerSnapshot = await getDoc(playerRef);

  if (!playerSnapshot.exists()) {
    return null;
  }

  return playerSnapshot.data();
}

/**
 * สร้างหรืออัปเดตโปรไฟล์ผู้เล่นให้พร้อมใช้งาน
 * - ถ้าไม่พบเอกสาร: สร้างใหม่พร้อมค่าเริ่มต้น
 * - ถ้าพบเอกสารแล้ว: อัปเดตชื่อ/รหัส/lastLoginAt แล้วอ่านข้อมูลกลับ
 */
export async function upsertAndGetPlayerProfile({ uid, playerName, playerCode }) {
  const playerRef = doc(db, "players", uid);
  const playerSnapshot = await getDoc(playerRef);

  if (!playerSnapshot.exists()) {
    await setDoc(playerRef, {
      uid,
      playerName,
      playerCode,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      coins: 0,
      rank: 1,
      currentLevel: 1
    });
  } else {
    await updateDoc(playerRef, {
      playerName,
      playerCode,
      lastLoginAt: serverTimestamp()
    });
  }

  // อ่านข้อมูลล่าสุดกลับเพื่อใช้ต่อในหน้า Lobby
  const latestSnapshot = await getDoc(playerRef);
  return latestSnapshot.data();
}
