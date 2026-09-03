# ระบบกีฬาสี - Backend (Google Apps Script)

เป็น Backend API สำหรับจัดเก็บข้อมูลคะแนนกีฬาสี เก็บข้อมูลใน Google Sheets

## การติดตั้ง

### 1. สร้าง Google Sheet
1. เข้าไปที่ [sheets.new](https://sheets.new) เพื่อสร้าง Spreadsheet ใหม่
2. จด ID ของ Spreadsheet (ใน URL: `https://docs.google.com/spreadsheets/d/<ID>/edit`)

### 2. สร้าง Google Apps Script
1. เข้าไปที่ [script.google.com](https://script.google.com)
2. คลิก **+ New project**
3. เปลี่ยนชื่อโปรเจคเป็น `Sports Day Scoring System`
4. คัดลอกโค้ดจาก `Code.gs` วางทับลงในไฟล์ `Code.gs`
5. แก้ไขตัวแปร `SPREADSHEET_ID` ที่บรรทัดบนสุด ให้เป็น ID ของ Spreadsheet ที่สร้างไว้

### 3. Deploy เป็น Web App
1. คลิกปุ่ม **Deploy** > **New deployment**
2. เลือกประเภทเป็น **Web app**
3. ตั้งค่า:
   - **Execute as**: Me
   - **Who has access**: Anyone
4. คลิก **Deploy**
5. ระบบจะถามให้ Allow permissions คลิกตามขั้นตอนให้เรียบร้อย
6. คัดลอก **Web App URL** ที่ได้

### 4. เชื่อมต่อกับหน้าเว็บ
1. เปิดไฟล์ `web/js/config.js`
2. วาง Web App URL ลงในตัวแปร `APP_SCRIPT_URL`

```javascript
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/XXXX/exec';
```

## โครงสร้างชีตที่ใช้

### ชีต `scores`
| timestamp | team | event | score |
|-----------|------|-------|-------|
| 2024-01-01 | orange | วิ่ง 100 เมตร | 10 |

- `team`: `orange` (สีส้ม) หรือ `pink` (สีชมพู)
- `event`: ชื่อรายการ
- `score`: คะแนน

### ชีต `events` (ไม่บังคับ)
| id | name | type | order |
|----|------|------|-------|
| runner | วิ่ง 100 เมตร | score | 1 |

ถ้าไม่มีชีต `events` ระบบจะใช้รายการเริ่มต้นในเบราว์เซอร์

## API Reference

| Action | Method | Parameters | คำอธิบาย |
|--------|--------|-----------|----------|
| `getScores` | GET | - | เก็บข้อมูลคะแนนทั้งหมด + สรุป |
| `getEvents` | GET | - | เก็บรายการกิจกรรม |
| `addScore` | POST | `team`, `event`, `score` | เพิ่มคะแนน |
| `deleteScore` | POST | `row` (เลขแถว) | ลบคะแนน |
| `resetScores` | POST | - | ล้างข้อมูลคะแนนทั้งหมด |

URL Format: `{APP_SCRIPT_URL}?action={action}&{params}`
