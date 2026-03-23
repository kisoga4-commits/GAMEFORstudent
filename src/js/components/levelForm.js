export function populateLevelForm(formElement, level) {
  if (!formElement || !level) {
    return;
  }

  setValue(formElement, "worldId", level.worldId);
  setValue(formElement, "levelId", level.levelId);
  setValue(formElement, "title", level.title);
  setValue(formElement, "description", level.description);
  setValue(formElement, "difficultyRank", level.difficultyRank);
  setValue(formElement, "questionType", level.questionType);
  setValue(formElement, "questionText", level.questionText);
  setValue(formElement, "choiceA", level.choiceA);
  setValue(formElement, "choiceB", level.choiceB);
  setValue(formElement, "choiceC", level.choiceC);
  setValue(formElement, "correctAnswer", level.correctAnswer);
  setValue(formElement, "rewardCoins", level.rewardCoins);
  setValue(formElement, "rewardItemChance", level.rewardItemChance);
  setValue(formElement, "mapType", level.mapType);
  setValue(formElement, "status", level.status);
}

export function clearLevelForm(formElement) {
  formElement?.reset();
  setValue(formElement, "questionType", "multiple-choice");
  setValue(formElement, "correctAnswer", "A");
  setValue(formElement, "status", "active");
}

export function getLevelInputFromForm(formElement) {
  const formData = new FormData(formElement);

  return {
    worldId: formData.get("worldId"),
    levelId: formData.get("levelId"),
    title: formData.get("title"),
    description: formData.get("description"),
    difficultyRank: formData.get("difficultyRank"),
    questionType: formData.get("questionType"),
    questionText: formData.get("questionText"),
    choiceA: formData.get("choiceA"),
    choiceB: formData.get("choiceB"),
    choiceC: formData.get("choiceC"),
    correctAnswer: formData.get("correctAnswer"),
    rewardCoins: formData.get("rewardCoins"),
    rewardItemChance: formData.get("rewardItemChance"),
    mapType: formData.get("mapType"),
    status: formData.get("status")
  };
}

function setValue(formElement, fieldName, value) {
  const target = formElement?.elements?.namedItem(fieldName);

  if (target) {
    target.value = value ?? "";
  }
}
