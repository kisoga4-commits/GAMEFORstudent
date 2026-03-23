import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { db } from "../firebase.js";

const LEVELS_COLLECTION = "levels";

export async function getLevelById(levelId) {
  const normalizedLevelId = normalizeLevelId(levelId);

  if (!normalizedLevelId) {
    throw new Error("levelId is required");
  }

  const levelRef = doc(db, LEVELS_COLLECTION, normalizedLevelId);
  const levelSnapshot = await getDoc(levelRef);

  if (!levelSnapshot.exists()) {
    return null;
  }

  return {
    id: levelSnapshot.id,
    ...levelSnapshot.data()
  };
}

export async function listLevels({ includeDraft = false } = {}) {
  const levelsRef = collection(db, LEVELS_COLLECTION);
  const constraints = [orderBy("order", "asc")];

  if (!includeDraft) {
    constraints.unshift(where("isPublished", "==", true));
  }

  const levelQuery = query(levelsRef, ...constraints);
  const snapshots = await getDocs(levelQuery);

  return snapshots.docs.map((snapshot) => ({
    id: snapshot.id,
    ...snapshot.data()
  }));
}

export async function upsertLevel({ levelId, title, description, question, answer, order, isPublished }) {
  const normalizedLevelId = normalizeLevelId(levelId);

  if (!normalizedLevelId) {
    throw new Error("levelId is required");
  }

  const levelRef = doc(db, LEVELS_COLLECTION, normalizedLevelId);
  const snapshot = await getDoc(levelRef);

  const payload = {
    title: String(title || "").trim(),
    description: String(description || "").trim(),
    question: String(question || "").trim(),
    answer: String(answer || "").trim(),
    order: Number(order) || 0,
    isPublished: Boolean(isPublished),
    updatedAt: serverTimestamp()
  };

  if (!snapshot.exists()) {
    payload.createdAt = serverTimestamp();
  }

  await setDoc(levelRef, payload, { merge: true });
}

function normalizeLevelId(levelId) {
  return String(levelId || "")
    .trim()
    .toLowerCase();
}
