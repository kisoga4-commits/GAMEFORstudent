# GAMEFORstudent (PWA + Firebase Cloud Sync)

โปรเจกต์นี้เป็นเว็บหน้าใช้งานจริง (`index.html`) สำหรับกรอกข้อมูลผู้เล่นและบันทึกขึ้น Firebase Cloud Firestore โดยใช้ Anonymous Auth และรองรับการติดตั้งแบบ PWA

## สิ่งที่ทำได้ตอนนี้

- หน้า `index.html` เป็นฟอร์มใช้งานจริง (mobile-first)
- ฟอร์มมี 2 ช่อง: `playerName`, `playerCode`
- เมื่อกดบันทึก:
  1. Sign in ด้วย Anonymous Auth
  2. บันทึกข้อมูลลง Firestore ที่ `players/{uid}`
- เมื่อกลับเข้าเว็บอีกครั้ง จะโหลดข้อมูลเดิมจาก Cloud กลับมาแสดงอัตโนมัติ
- มี PWA ครบ: `manifest.webmanifest`, `sw.js`, install prompt, icons

## โครงสร้างไฟล์สำคัญ

```txt
index.html
manifest.webmanifest
sw.js
icons/
  icon-192.svg
  icon-512.svg
src/
  css/styles.css
  js/main.js
  js/firebase.js
  js/services/auth.js
  js/services/player.js
```

## Firestore document (`players/{uid}`)

ระบบบันทึกฟิลด์:

- `uid`
- `playerName`
- `playerCode`
- `createdAt`
- `updatedAt`

และยัง merge ค่าความคืบหน้าอื่น ๆ เดิมไว้เพื่อไม่ให้ข้อมูลเก่าหาย

## วิธีตั้งค่าและรัน

1. สร้าง Firebase Project
2. เปิดใช้งาน:
   - Authentication > Anonymous
   - Cloud Firestore
3. ใส่ Firebase config ที่ `src/js/config/firebase-config.js`
4. รัน static server เช่น:

```bash
npx serve .
```

5. เปิด `http://localhost:3000/`

> แนะนำให้ทดสอบผ่าน HTTPS หรือ localhost เพื่อให้ Service Worker และ PWA ทำงานครบ
