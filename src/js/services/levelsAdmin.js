import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { db } from "../firebase.js";
import {
  fromFirestoreLevel,
  LEVEL_STATUS,
  normalizeLevelId,
  toLevelPayload,
  validateLevel
} from "../models/levelModel.js";

const LEVELS_COLLECTION = "levels";

export async function listLevelsForAdmin() {
  const levelQuery = query(collection(db, LEVELS_COLLECTION), orderBy("difficultyRank", "asc"));
  const snapshots = await getDocs(levelQuery);

  return snapshots.docs.map((snapshot) => fromFirestoreLevel(snapshot.id, snapshot.data()));
}

export async function createLevel(levelInput) {
  const payload = toLevelPayload(levelInput);
  const validation = validateLevel(payload);

  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  const levelRef = doc(db, LEVELS_COLLECTION, payload.levelId);
  const snapshot = await getDoc(levelRef);

  if (snapshot.exists()) {
    throw new Error("levelId นี้มีอยู่แล้ว กรุณาใช้ค่าใหม่");
  }

  await setDoc(levelRef, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return payload.levelId;
}

export async function updateLevel({ originalLevelId, levelInput }) {
  const payload = toLevelPayload(levelInput);
  const validation = validateLevel(payload);

  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  const normalizedOriginalId = normalizeLevelId(originalLevelId) || payload.levelId;
  const oldRef = doc(db, LEVELS_COLLECTION, normalizedOriginalId);
  const oldSnapshot = await getDoc(oldRef);

  if (!oldSnapshot.exists()) {
    throw new Error("ไม่พบด่านที่ต้องการแก้ไข");
  }

  if (payload.levelId !== normalizedOriginalId) {
    const newRef = doc(db, LEVELS_COLLECTION, payload.levelId);
    const newSnapshot = await getDoc(newRef);

    if (newSnapshot.exists()) {
      throw new Error("levelId ใหม่ซ้ำกับข้อมูลเดิม");
    }

    await setDoc(newRef, {
      ...payload,
      createdAt: oldSnapshot.data().createdAt || serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await deleteDoc(oldRef);
    return payload.levelId;
  }

  await setDoc(oldRef, { ...payload, updatedAt: serverTimestamp() }, { merge: true });
  return payload.levelId;
}

export async function deleteLevel(levelId) {
  const normalizedLevelId = normalizeLevelId(levelId);

  if (!normalizedLevelId) {
    throw new Error("levelId is required");
  }

  await deleteDoc(doc(db, LEVELS_COLLECTION, normalizedLevelId));
}

export async function toggleLevelStatus(levelId, nextStatus) {
  const normalizedLevelId = normalizeLevelId(levelId);

  if (!normalizedLevelId) {
    throw new Error("levelId is required");
  }

  if (![LEVEL_STATUS.ACTIVE, LEVEL_STATUS.INACTIVE].includes(nextStatus)) {
    throw new Error("status ไม่ถูกต้อง");
  }

  await setDoc(
    doc(db, LEVELS_COLLECTION, normalizedLevelId),
    { status: nextStatus, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function seedSampleLevels() {
  const samples = [
    {
      worldId: "world-1",
      levelId: "w1-l1",
      title: "บวกเลขพื้นฐาน",
      description: "ฝึกบวกเลข 1 หลัก",
      difficultyRank: 1,
      questionType: "multiple-choice",
      questionText: "2 + 3 = ?",
      choiceA: "4",
      choiceB: "5",
      choiceC: "6",
      correctAnswer: "B",
      rewardCoins: 10,
      rewardItemChance: 0.1,
      mapType: "forest",
      status: LEVEL_STATUS.ACTIVE
    },
    {
      worldId: "world-1",
      levelId: "w1-l2",
      title: "ลบเลขง่าย",
      description: "ฝึกลบเลข 1 หลัก",
      difficultyRank: 2,
      questionType: "multiple-choice",
      questionText: "9 - 4 = ?",
      choiceA: "5",
      choiceB: "6",
      choiceC: "4",
      correctAnswer: "A",
      rewardCoins: 12,
      rewardItemChance: 0.12,
      mapType: "desert",
      status: LEVEL_STATUS.ACTIVE
    },
    {
      worldId: "world-1",
      levelId: "w1-l3",
      title: "คูณเลข 2",
      description: "เริ่มต้นการคูณ",
      difficultyRank: 3,
      questionType: "multiple-choice",
      questionText: "2 x 6 = ?",
      choiceA: "10",
      choiceB: "11",
      choiceC: "12",
      correctAnswer: "C",
      rewardCoins: 15,
      rewardItemChance: 0.15,
      mapType: "ice",
      status: LEVEL_STATUS.ACTIVE
    },
    {
      worldId: "world-2",
      levelId: "w2-l1",
      title: "หารเบื้องต้น",
      description: "หารลงตัว",
      difficultyRank: 4,
      questionType: "multiple-choice",
      questionText: "12 / 3 = ?",
      choiceA: "3",
      choiceB: "4",
      choiceC: "5",
      correctAnswer: "B",
      rewardCoins: 18,
      rewardItemChance: 0.18,
      mapType: "castle",
      status: LEVEL_STATUS.ACTIVE
    },
    {
      worldId: "world-2",
      levelId: "w2-l2",
      title: "ด่านทดสอบลำดับ",
      description: "โจทย์ผสมบวก-ลบ",
      difficultyRank: 5,
      questionType: "multiple-choice",
      questionText: "5 + 7 - 3 = ?",
      choiceA: "8",
      choiceB: "9",
      choiceC: "10",
      correctAnswer: "B",
      rewardCoins: 22,
      rewardItemChance: 0.22,
      mapType: "space",
      status: LEVEL_STATUS.INACTIVE
    }
  ];

  await Promise.all(
    samples.map(async (sample) => {
      const payload = toLevelPayload(sample);
      await setDoc(
        doc(db, LEVELS_COLLECTION, payload.levelId),
        {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    })
  );

  return samples.length;
}
