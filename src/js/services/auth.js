import { signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { auth } from "../firebase.js";

/**
 * สร้าง anonymous session สำหรับผู้เล่น
 * - ถ้ามีผู้ใช้อยู่แล้ว จะใช้ session เดิมทันที
 * - ถ้ายังไม่มี จะล็อกอิน anonymous ใหม่
 */
export async function ensureAnonymousSession() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  const result = await signInAnonymously(auth);
  return result.user;
}
