export const WORLD_LEVELS = [
  {
    id: "level-1",
    shortName: "ด่าน 1",
    name: "ด่านแรก",
    description: "ด่านทดลองระบบ: ตอบคำถามให้ถูกเพื่อผ่านด่าน",
    unlockOrder: 1,
    emoji: "🧮",
    x: 16,
    y: 26,
    challenge: {
      question: "2 + 1 = ?",
      successMessage: "ผ่านด่าน",
      failMessage: "ลองอีกครั้ง",
      choices: [
        { id: "a", label: "A: 2", value: "2", x: 18, y: 30 },
        { id: "b", label: "B: 3", value: "3", x: 50, y: 16 },
        { id: "c", label: "C: 4", value: "4", x: 82, y: 30 }
      ],
      correctChoiceId: "b"
    }
  },
  {
    id: "river",
    shortName: "แม่น้ำศัพท์",
    name: "ด่านแม่น้ำคำศัพท์",
    description: "ล่องเรือสะกดคำทีละพยางค์",
    unlockOrder: 2,
    emoji: "📘",
    x: 84,
    y: 30
  },
  {
    id: "castle",
    shortName: "ปราสาทตรรกะ",
    name: "ด่านปราสาทตรรกะ",
    description: "แก้ปริศนาเพื่อเปิดประตูปราสาท",
    unlockOrder: 3,
    emoji: "🧩",
    x: 77,
    y: 74
  }
];
