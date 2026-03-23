import {
  onDisconnect,
  onValue,
  ref,
  remove,
  serverTimestamp,
  set,
  update
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { realtimeDb } from "../firebase.js";

const PRESENCE_ROOT = "presence";

export function buildPresencePayload({ uid, playerName, status = "lobby", online = true }) {
  return {
    uid,
    playerName,
    online,
    status,
    lastSeen: serverTimestamp()
  };
}

export function countOnlinePlayers(presenceMap = {}) {
  return Object.values(presenceMap).filter((player) => player?.online).length;
}

export function countOnlineByStatus(presenceMap = {}, status = "lobby") {
  return Object.values(presenceMap).filter(
    (player) => player?.online && player?.status === status
  ).length;
}

export async function setPlayerOnline({ uid, playerName, status = "lobby" }) {
  const connectedRef = ref(realtimeDb, ".info/connected");
  const userPresenceRef = ref(realtimeDb, `${PRESENCE_ROOT}/${uid}`);

  return new Promise((resolve) => {
    const unsubscribe = onValue(connectedRef, async (snapshot) => {
      if (snapshot.val() !== true) {
        return;
      }

      const offlinePayload = buildPresencePayload({
        uid,
        playerName,
        status,
        online: false
      });

      await onDisconnect(userPresenceRef).set(offlinePayload);
      await set(userPresenceRef, buildPresencePayload({ uid, playerName, status }));

      unsubscribe();
      resolve();
    });
  });
}

export async function updatePlayerStatus(uid, status) {
  const userPresenceRef = ref(realtimeDb, `${PRESENCE_ROOT}/${uid}`);
  await update(userPresenceRef, { status, online: true, lastSeen: serverTimestamp() });
}

export async function clearPlayerPresence(uid) {
  const userPresenceRef = ref(realtimeDb, `${PRESENCE_ROOT}/${uid}`);
  const offlinePayload = { online: false, lastSeen: serverTimestamp(), status: "offline" };

  await update(userPresenceRef, offlinePayload);

  try {
    await onDisconnect(userPresenceRef).cancel();
  } catch (error) {
    console.warn("Cannot cancel onDisconnect", error);
  }

  await remove(userPresenceRef);
}

export function subscribePresence(callback) {
  const presenceRef = ref(realtimeDb, PRESENCE_ROOT);

  return onValue(presenceRef, (snapshot) => {
    callback(snapshot.val() || {});
  });
}
