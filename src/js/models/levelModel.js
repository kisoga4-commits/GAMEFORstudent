export const LEVEL_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive"
};

export const QUESTION_TYPES = ["multiple-choice"];
export const MAP_TYPES = ["forest", "desert", "ice", "castle", "space"];

export const REQUIRED_LEVEL_FIELDS = [
  "worldId",
  "levelId",
  "title",
  "difficultyRank",
  "questionType",
  "questionText",
  "choiceA",
  "choiceB",
  "choiceC",
  "correctAnswer",
  "rewardCoins",
  "rewardItemChance",
  "mapType",
  "status"
];

export function normalizeLevelId(levelId) {
  return String(levelId || "")
    .trim()
    .toLowerCase();
}

export function toLevelPayload(rawInput) {
  return {
    worldId: String(rawInput.worldId || "").trim(),
    levelId: normalizeLevelId(rawInput.levelId),
    title: String(rawInput.title || "").trim(),
    description: String(rawInput.description || "").trim(),
    difficultyRank: Number(rawInput.difficultyRank) || 1,
    questionType: String(rawInput.questionType || "multiple-choice").trim(),
    questionText: String(rawInput.questionText || "").trim(),
    choiceA: String(rawInput.choiceA || "").trim(),
    choiceB: String(rawInput.choiceB || "").trim(),
    choiceC: String(rawInput.choiceC || "").trim(),
    correctAnswer: String(rawInput.correctAnswer || "")
      .trim()
      .toUpperCase(),
    rewardCoins: Number(rawInput.rewardCoins) || 0,
    rewardItemChance: Number(rawInput.rewardItemChance) || 0,
    mapType: String(rawInput.mapType || "forest").trim(),
    status: String(rawInput.status || LEVEL_STATUS.ACTIVE).trim().toLowerCase()
  };
}

export function fromFirestoreLevel(levelId, data) {
  const fallbackStatus = data.isPublished === false ? LEVEL_STATUS.INACTIVE : LEVEL_STATUS.ACTIVE;

  return {
    id: levelId,
    worldId: data.worldId || "",
    levelId,
    title: data.title || "",
    description: data.description || "",
    difficultyRank: Number(data.difficultyRank) || Number(data.order) || 1,
    questionType: data.questionType || "multiple-choice",
    questionText: data.questionText || data.question || "",
    choiceA: data.choiceA || "",
    choiceB: data.choiceB || "",
    choiceC: data.choiceC || "",
    correctAnswer: String(data.correctAnswer || data.answer || "")
      .trim()
      .toUpperCase(),
    rewardCoins: Number(data.rewardCoins) || 0,
    rewardItemChance: Number(data.rewardItemChance) || 0,
    mapType: data.mapType || "forest",
    status: data.status || fallbackStatus,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null
  };
}

export function validateLevel(levelPayload) {
  const missingFields = REQUIRED_LEVEL_FIELDS.filter((fieldName) => {
    const value = levelPayload[fieldName];

    if (fieldName === "rewardCoins" || fieldName === "rewardItemChance" || fieldName === "difficultyRank") {
      return Number.isNaN(Number(value));
    }

    return value === "" || value === null || value === undefined;
  });

  if (missingFields.length > 0) {
    return {
      isValid: false,
      message: `กรอกข้อมูลให้ครบ: ${missingFields.join(", ")}`
    };
  }

  if (!["A", "B", "C"].includes(levelPayload.correctAnswer)) {
    return {
      isValid: false,
      message: "correctAnswer ต้องเป็น A, B หรือ C"
    };
  }

  const selectedChoice = levelPayload[`choice${levelPayload.correctAnswer}`];

  if (!selectedChoice) {
    return {
      isValid: false,
      message: "correctAnswer ต้องตรงกับตัวเลือกที่กรอกไว้"
    };
  }

  if (levelPayload.rewardItemChance < 0 || levelPayload.rewardItemChance > 1) {
    return {
      isValid: false,
      message: "rewardItemChance ต้องอยู่ระหว่าง 0 ถึง 1"
    };
  }

  if (!Number.isInteger(levelPayload.difficultyRank) || levelPayload.difficultyRank < 1) {
    return {
      isValid: false,
      message: "difficultyRank ต้องเป็นจำนวนเต็มที่มากกว่า 0"
    };
  }

  if (!QUESTION_TYPES.includes(levelPayload.questionType)) {
    return {
      isValid: false,
      message: `questionType ต้องเป็นค่าในระบบ: ${QUESTION_TYPES.join(", ")}`
    };
  }

  if (!MAP_TYPES.includes(levelPayload.mapType)) {
    return {
      isValid: false,
      message: `mapType ต้องเป็นค่าในระบบ: ${MAP_TYPES.join(", ")}`
    };
  }

  if (![LEVEL_STATUS.ACTIVE, LEVEL_STATUS.INACTIVE].includes(levelPayload.status)) {
    return {
      isValid: false,
      message: "status ต้องเป็น active หรือ inactive"
    };
  }

  return {
    isValid: true,
    message: "ok"
  };
}
