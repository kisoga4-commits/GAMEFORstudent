import {
  get,
  onDisconnect,
  onValue,
  ref,
  serverTimestamp,
  set,
  update
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { rtdb } from "../firebase.js";

const PRESENCE_PATH = "presence";
const DUEL_QUEUE_PATH = "duelQueue";

export async function initPresence({ uid, playerName }) {
  const presenceRef = ref(rtdb, `${PRESENCE_PATH}/${uid}`);

  await set(presenceRef, {
    uid,
    playerName,
    online: true,
    status: "lobby",
    lastSeen: serverTimestamp()
  });

  await onDisconnect(presenceRef).update({
    online: false,
    status: "offline",
    lastSeen: serverTimestamp()
  });
}

export function subscribePresence(callback) {
  const presenceRef = ref(rtdb, PRESENCE_PATH);
  return onValue(presenceRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
}

export function subscribeQueue(callback) {
  const queueRef = ref(rtdb, DUEL_QUEUE_PATH);
  return onValue(queueRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
}

export async function setPlayerStatus(uid, status) {
  const presenceRef = ref(rtdb, `${PRESENCE_PATH}/${uid}`);
  await update(presenceRef, {
    status,
    lastSeen: serverTimestamp()
  });
}

export async function joinQueue({ uid, playerName, mode = "solo" }) {
  const queueRef = ref(rtdb, `${DUEL_QUEUE_PATH}/${uid}`);
  const presenceRef = ref(rtdb, `${PRESENCE_PATH}/${uid}`);

  await Promise.all([
    set(queueRef, {
      uid,
      playerName,
      joinedAt: serverTimestamp(),
      mode
    }),
    update(presenceRef, {
      status: "queue",
      lastSeen: serverTimestamp()
    })
  ]);
}

export async function leaveQueue(uid) {
  const queueRef = ref(rtdb, `${DUEL_QUEUE_PATH}/${uid}`);
  const presenceRef = ref(rtdb, `${PRESENCE_PATH}/${uid}`);

  await Promise.all([
    set(queueRef, null),
    update(presenceRef, {
      status: "lobby",
      lastSeen: serverTimestamp()
    })
  ]);
}

export async function isPlayerInQueue(uid) {
  const queuePlayerRef = ref(rtdb, `${DUEL_QUEUE_PATH}/${uid}`);
  const snapshot = await get(queuePlayerRef);
  return snapshot.exists();
}

export async function getQueueCount() {
  const queueRef = ref(rtdb, DUEL_QUEUE_PATH);
  const snapshot = await get(queueRef);

  if (!snapshot.exists()) {
    return 0;
  }

  return Object.keys(snapshot.val()).length;
}

export async function ensureLobbyPresence(uid) {
  const queuePlayerRef = ref(rtdb, `${DUEL_QUEUE_PATH}/${uid}`);
  const snapshot = await get(queuePlayerRef);

  if (!snapshot.exists()) {
    await setPlayerStatus(uid, "lobby");
  }
}
