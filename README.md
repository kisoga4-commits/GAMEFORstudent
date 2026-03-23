# GAMEFORstudent (Step 2 MVP)

โปรเจกต์เกมการศึกษาแนว 2D top-down maze แบบ PWA โดยใน Step นี้เน้น:

- หน้าเข้าเกม + ล็อกอินแบบ Anonymous Auth
- บันทึกโปรไฟล์ผู้เล่นใน Firestore
- หน้า Lobby (mobile-first)
- ระบบ Presence และจำนวนผู้เล่นออนไลน์แบบ realtime ด้วย Firebase Realtime Database

## โครงสร้าง

```txt
public/
  index.html
  lobby.html
  manifest.webmanifest
  sw.js
src/
  css/styles.css
  js/
    main.js
    lobby.js
    firebase.js
    config/firebase.example.js
    services/
      auth.js
      player.js
      presence.js
```

## วิธีเริ่มใช้งาน

1. สร้าง Firebase Project
2. เปิดใช้งาน Anonymous Authentication
3. สร้าง Firestore Database
4. สร้าง Realtime Database
5. คัดลอก `src/js/config/firebase.example.js` เป็น `src/js/config/firebase.config.js`
6. เติมค่า Firebase config จริง
7. เสิร์ฟไฟล์ด้วย static server (เช่น `npx serve .`)
8. เปิด `http://localhost:3000/public/`

## โครงสร้างข้อมูล Realtime Database (Presence)

```txt
/presence/{uid}
  uid
  playerName
  online
  status
  lastSeen
```

## หมายเหตุ

- ปุ่ม "รอดวล" จะอัปเดตสถานะเป็น `queue` เพื่อใช้ต่อใน Step matchmaking
- ปุ่ม "เริ่มเล่นด่าน" ยังเป็น placeholder สำหรับเชื่อมฉากเกมใน Step ถัดไป
