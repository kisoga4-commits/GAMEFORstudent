# GAMEFORstudent (Step 1 MVP + Data-driven Levels)

โปรเจกต์เริ่มต้นสำหรับเกมการศึกษาแนว 2D top-down maze แบบ PWA โดยตอนนี้รองรับ:

- หน้าเข้าเกม + Lobby realtime
- Firebase Anonymous Auth + Firestore + Realtime Database
- ระบบด่านแบบ **data-driven** (ไม่ hardcode ใน game engine)
- หน้า **Admin ในเกม** สำหรับเพิ่ม/แก้ไขด่าน

## โครงสร้าง

```txt
public/
  index.html
  lobby.html
  game.html
  admin.html
  manifest.webmanifest
  sw.js
src/
  css/styles.css
  js/
    main.js
    lobby.js
    game.js
    admin.js
    firebase.js
    config/firebase-config.js
    config/firebase.example.js
    services/
      auth.js
      player.js
      duelQueue.js
      levels.js
```

## วิธีเริ่มใช้งาน

1. สร้าง Firebase Project
2. เปิดใช้งาน Anonymous Authentication
3. สร้าง Firestore Database
4. (ถ้าต้องการ template) ใช้ `src/js/config/firebase.example.js`
5. ใส่ค่า Firebase config จริงใน `src/js/config/firebase-config.js`
6. เสิร์ฟไฟล์ด้วย static server (เช่น `npx serve .`)
7. เปิด `http://localhost:3000/public/`

## Firestore Schema สำหรับด่าน

- Collection: `levels`
- 1 ด่าน = 1 document (`levelId`)
- ฟิลด์ที่ระบบใช้:
  - `order` (number) ลำดับด่าน
  - `title` (string) ชื่อด่าน
  - `description` (string) คำอธิบาย
  - `question` (string) โจทย์
  - `answer` (string) เฉลย
  - `isPublished` (boolean) ให้ scene เกมเห็นหรือไม่
  - `createdAt`, `updatedAt` (timestamp)

ตัวอย่าง document (`levels/level-01`):

```json
{
  "order": 1,
  "title": "บวกเลขหลักเดียว",
  "description": "ฝึกการบวกพื้นฐาน",
  "question": "3 + 4 = ?",
  "answer": "7",
  "isPublished": true
}
```

## การเพิ่มด่านใหม่ (2 ทาง)

1. **ผ่าน Firebase Console**
   - สร้าง document ใหม่ใน collection `levels`
   - ตั้ง document id เป็น `levelId` ที่ต้องการ
   - ใส่ฟิลด์ตาม schema ด้านบน

2. **ผ่านหน้า Admin ในเกม**
   - เข้า `public/admin.html`
   - กรอกข้อมูลด่านแล้วกด “บันทึกด่าน”
   - ระบบจะ upsert document ที่ `levels/{levelId}`

## วิธีโหลดด่านใน Scene

- หน้า `public/game.html` จะเรียก service `getLevelById(levelId)`
- Scene แสดงข้อมูลด่านจาก Firestore โดยตรงตาม `levelId`
- รายการด่านเลือกได้จาก `listLevels()` (เฉพาะ `isPublished = true`)
