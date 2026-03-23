# GAMEFORstudent (Step 6: Admin จัดการด่านจาก Firestore)

โปรเจกต์เกมการศึกษาแนว 2D top-down maze แบบ PWA ที่รองรับ:

- หน้าเข้าเกม + Lobby realtime
- Firebase Anonymous Auth + Firestore + Realtime Database
- ระบบด่านแบบ **data-driven** (Scene โหลดด่านจาก Firestore, ไม่ hardcode)
- หน้า **Admin** สำหรับเพิ่ม/แก้ไข/ลบ/เปิด-ปิดด่าน

## โครงสร้างสำคัญ

```txt
public/
  game.html
  admin.html
src/js/
  admin.js
  game.js
  components/levelForm.js
  models/levelModel.js
  services/levels.js
  services/levelsAdmin.js
  services/player.js
```

## การตั้งค่า Firebase

1. สร้าง Firebase Project
2. เปิดใช้งาน Anonymous Authentication
3. สร้าง Firestore Database
4. ใส่ค่า Firebase config จริงใน `src/js/config/firebase-config.js`
5. เสิร์ฟไฟล์ด้วย static server (เช่น `npx serve .`)
6. เปิด `http://localhost:3000/public/`

## Firestore collection: `levels`

- ใช้ document id เป็น `levelId`
- ฟิลด์ที่รองรับ:
  - `worldId` (string)
  - `levelId` (string)
  - `title` (string)
  - `description` (string)
  - `difficultyRank` (number)
  - `questionType` (string) เช่น `multiple-choice`
  - `questionText` (string)
  - `choiceA`, `choiceB`, `choiceC` (string)
  - `correctAnswer` (string: A/B/C)
  - `rewardCoins` (number)
  - `rewardItemChance` (number 0-1)
  - `mapType` (string)
  - `status` (`active` | `inactive`)
  - `createdAt`, `updatedAt` (timestamp)

### ตัวอย่าง Firestore document

`levels/w1-l1`

```json
{
  "worldId": "world-1",
  "levelId": "w1-l1",
  "title": "บวกเลขพื้นฐาน",
  "description": "ฝึกบวกเลข 1 หลัก",
  "difficultyRank": 1,
  "questionType": "multiple-choice",
  "questionText": "2 + 3 = ?",
  "choiceA": "4",
  "choiceB": "5",
  "choiceC": "6",
  "correctAnswer": "B",
  "rewardCoins": 10,
  "rewardItemChance": 0.1,
  "mapType": "forest",
  "status": "active"
}
```

## Sample data (5 ด่าน)

1. `w1-l1` บวกเลขพื้นฐาน (active)
2. `w1-l2` ลบเลขง่าย (active)
3. `w1-l3` คูณเลข 2 (active)
4. `w2-l1` หารเบื้องต้น (active)
5. `w2-l2` ด่านทดสอบลำดับ (inactive)

> ในหน้า Admin มีปุ่ม `เพิ่มข้อมูลตัวอย่าง 5 ด่าน` เพื่อ seed ได้ทันที

## สิทธิ์แอดมิน

เพิ่มโครงสร้าง `isAdmin` ใน player profile (`players/{uid}`):

```json
{
  "uid": "<firebase-auth-uid>",
  "characterName": "Player One",
  "isAdmin": true
}
```

ถ้า `isAdmin !== true` จะดูหน้าได้ แต่จะจัดการด่านไม่ได้

## Validation ที่รองรับ

- ฟิลด์สำคัญต้องไม่ว่าง
- `correctAnswer` ต้องเป็น A/B/C และต้องตรงกับ choice ที่มี
- `levelId` ต้องไม่ซ้ำตอนสร้างด่านใหม่
- `rewardItemChance` ต้องอยู่ในช่วง 0 ถึง 1

## สถานะโหมดดวล

- **ยังไม่ได้ทำโหมดดวลจริง**
- โฟกัสปัจจุบันคือระบบ Admin สำหรับเพิ่ม/แก้ไขด่าน
