# GAMEFORstudent (Step 1 MVP)

โปรเจกต์เริ่มต้นสำหรับเกมการศึกษาแนว 2D top-down maze แบบ PWA โดยใน Step 1 นี้เน้น:

- โครงสร้างโปรเจกต์ที่ขยายต่อได้
- หน้าเข้าเกม (Landing + แบบฟอร์ม)
- เชื่อม Firebase (Anonymous Auth + Firestore + Analytics)
- โครงสร้าง PWA เบื้องต้น (manifest + service worker)

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
    firebase.js
    config/firebase-config.js
    config/firebase.example.js
    services/
      auth.js
      player.js
```

## วิธีเริ่มใช้งาน

1. สร้าง Firebase Project
2. เปิดใช้งาน Anonymous Authentication
3. สร้าง Firestore Database
4. (ถ้าต้องการ template) ใช้ `src/js/config/firebase.example.js`
5. ใส่ค่า Firebase config จริงใน `src/js/config/firebase-config.js`
6. เสิร์ฟไฟล์ด้วย static server (เช่น `npx serve .`)
7. เปิด `http://localhost:3000/public/`

## หมายเหตุ

- ใน Step ถัดไปจะเพิ่ม Realtime Database สำหรับจำนวนคนออนไลน์และระบบ lobby/queue แบบ realtime
- มีการ hash รหัสผู้เล่นก่อนบันทึกลง Firestore เพื่อลดการเก็บรหัสแบบ plain text
- ไฟล์นี้เป็น MVP เพื่อให้เริ่มพัฒนาแบบ incremental ได้ง่าย
