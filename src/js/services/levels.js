import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { db } from "../firebase.js";
import { fromFirestoreLevel, normalizeLevelId, LEVEL_STATUS } from "../models/levelModel.js";

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

  return fromFirestoreLevel(levelSnapshot.id, levelSnapshot.data());
}

export async function listLevels({ includeInactive = false } = {}) {
  const levelsRef = collection(db, LEVELS_COLLECTION);
  const constraints = [orderBy("difficultyRank", "asc")];

  if (!includeInactive) {
    constraints.unshift(where("status", "==", LEVEL_STATUS.ACTIVE));
  }

  const levelQuery = query(levelsRef, ...constraints);
  const snapshots = await getDocs(levelQuery);

  return snapshots.docs.map((snapshot) => fromFirestoreLevel(snapshot.id, snapshot.data()));
}
