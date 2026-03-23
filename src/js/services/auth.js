import {
  signInAnonymously,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { auth } from "../firebase.js";

export async function loginAnonymously() {
  const result = await signInAnonymously(auth);
  return result.user;
}

export async function logout() {
  await signOut(auth);
}
