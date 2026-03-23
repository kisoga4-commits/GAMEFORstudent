# GAMEFORstudent (Step 2: Login + Lobby พร้อมใช้จริง)

โปรเจกต์เกมการศึกษาแนว 2D top-down maze แบบ PWA
โดยใน Step 2 นี้เพิ่มระบบหน้าเข้าเกมที่ใช้งานจริงด้วย Firebase Anonymous Auth + Firestore

## สิ่งที่มีในเวอร์ชันนี้

- หน้าเข้าเกมแบบ mobile-first
- ฟอร์ม 2 ช่อง: `ชื่อตัวละคร` และ `รหัส`
- ปุ่ม `เข้าเล่น`
- เมื่อกดเข้าเล่น:
  - ล็อกอินด้วย **Firebase Anonymous Auth เท่านั้น**
  - สร้างข้อมูลผู้เล่นใหม่ใน Firestore เมื่อเข้าเล่นครั้งแรก
  - ถ้ามีข้อมูลแล้ว จะอ่าน/อัปเดตข้อมูลเดิม
- ไปหน้า Lobby อัตโนมัติเมื่อสำเร็จ
- validation เบื้องต้น

## โครงสร้างไฟล์หลัก

```txt
public/
  index.html                  # หน้าเข้าเกม
  lobby.html                  # หน้า Lobby
  manifest.webmanifest
  sw.js
src/
  css/
    styles.css                # UI สไตล์เกมเด็ก (mobile-first)
  js/
    main.js                   # logic หน้า login
    lobby.js                  # logic หน้า lobby
    firebase.js               # initialize Firebase app/auth/firestore
    config/
      firebase.config.js      # ใส่ config จริงของโปรเจกต์ Firebase
    services/
      auth.js                 # Anonymous auth logic
      player.js               # Firestore player profile logic
```

## วิธีตั้งค่า Firebase (สำคัญ)

1. สร้าง Firebase Project
2. เปิดใช้งาน **Authentication > Sign-in method > Anonymous**
3. สร้าง Firestore Database
4. เปิดไฟล์ `src/js/config/firebase.config.js` แล้วใส่ค่าจริง:

```js
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

> ถ้าไม่ใส่ค่าจริง ระบบล็อกอินและบันทึก Firestore จะใช้งานไม่ได้

## ตัวอย่างโครงสร้าง Document ใน Firestore

Collection: `players`

Document ID: `uid` (จาก anonymous auth)

ตัวอย่าง:

```json
{
  "uid": "3dhjK...",
  "playerName": "Nina",
  "playerCode": "AB12",
  "createdAt": "Firestore Timestamp",
  "lastLoginAt": "Firestore Timestamp",
  "coins": 0,
  "rank": 1,
  "currentLevel": 1
}
```

## การรันโปรเจกต์

```bash
npx serve .
```

เปิด:

- `http://localhost:3000/public/` (หน้าเข้าเกม)
- `http://localhost:3000/public/lobby.html` (หน้า Lobby)

## หมายเหตุ

- เวอร์ชันนี้ **ไม่ใช้ email/password**
- ใช้ anonymous auth อย่างเดียวตาม requirement
