export const WORLD_LEVELS = [
  {
    id: "forest",
    shortName: "ป่าคณิต",
    name: "ด่านป่าคณิต",
    description: "ชวนเพื่อนสัตว์มาช่วยบวกเลขง่าย ๆ",
    unlockOrder: 1,
    emoji: "🧮",
    x: 16,
    y: 26,
    challenge: {
      question: "2 + 3 ได้เท่าไหร่?",
      successMessage: "เก่งมาก! ผ่านด่านแรกแล้ว 🎉",
      failMessage: "ยังไม่ถูก ลองเดินไปเลือกใหม่อีกครั้งนะ",
      choices: [
        { id: "a", label: "4", x: 18, y: 30 },
        { id: "b", label: "5", x: 50, y: 16 },
        { id: "c", label: "6", x: 82, y: 30 }
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
