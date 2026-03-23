import { signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { auth } from "../firebase.js";

export async function loginAnonymously() {
  const result = await signInAnonymously(auth);
  return result.user;
}
