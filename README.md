# ระบบกีฬาสี 🏆
**สีส้ม 🍊 VS สีชมพู 🌸**

ระบบกีฬาสีออนไลน์แบบทันสมัย ใช้สำหรับกรอกคะแนนการแข่งขันแบบ Real-time บนทุกอุปกรณ์

## 🚀 โครงสร้างโปรเจค

```
sports-day/
├── apps-script/              # Backend (Google Apps Script)
│   ├── Code.gs               # โค้ดหลักของ API
│   └── README.md             # วิธีติดตั้ง Backend
│
└── web/                      # Frontend (GitHub Pages)
    ├── index.html            # หน้าเว็บหลัก
    ├── css/
    │   └── style.css         # สไตล์ Responsive
    └── js/
        ├── config.js         # การตั้งค่า (ใส่ Web App URL)
        └── main.js           # ตรรกะ frontend
```

## ✨ ฟีเจอร์

- 🏆 **กระดานแต้มสด** - แสดงคะแนนรวมแบบ Real-time
- ✏️ **ระบบกรอกคะแนน** - เลือกทีม + รายการ + กรอกคะแนน
- ⚡ **ลงคะแนนด่วน** - กดปุ่มเดียวเพิ่ม 10 คะแนน
- 📋 **ประวัติคะแนน** - ดูและลบรายการย้อนหลัง
- 📱 **Responsive** - ใช้ได้ทั้งมือถือ แท็บเล็ต และคอมพิวเตอร์

## 🛠️ วิธีติดตั้ง

### ขั้นตอนที่ 1: ติดตั้ง Backend (Google Apps Script)

อ่านวิธีติดตั้งแบบละเอียดได้ที่ [apps-script/README.md](apps-script/README.md)

สรุปสั้นๆ:
1. สร้าง Google Sheet ใหม่
2. เปิด [script.google.com](script.google.com) > สร้างโปรเจคใหม่
3. วางโค้ดจาก `apps-script/Code.gs`
4. ตั้งค่า `SPREADSHEET_ID`
5. Deploy เป็น Web App (Execute as: Me, Access: Anyone)
6. เก็บ **Web App URL**

### ขั้นตอนที่ 2: ติดตั้ง Frontend (GitHub Pages)

1. สร้าง Repository ใหม่บน GitHub
2. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์ `web/` ไปที่ root ของ repo
3. เปิดไฟล์ `js/config.js` แล้วแทนที่ `YOUR_APP_SCRIPT_URL_HERE` ด้วย Web App URL ที่ได้
4. เปิด **Settings** > **Pages** > เลือก Branch (main) และโฟลเดอร์ (/root)
5. เว็บจะถูก deploy ที่ `https://{username}.github.io/{repo}/`

### ขั้นตอนที่ 3: ทดสอบใช้งาน

เปิดเว็บที่ deploy แล้วลองกรอกคะแนนและดูผลลัพธ์

## 🎨 รูปแบบสี

| ทีม | สี | Emoji |
|-----|-----|-------|
| ส้ม | `#FF8C00` | 🍊 |
| ชมพู | `#FF69B4` | 🌸 |

## 🔒 ความปลอดภัย

- การ reset คะแนนต้องยืนยันก่อนทำ
- ข้อมูลทั้งหมดเก็บใน Google Sheets แบบเรียลไทม์
- CORS ถูกเปิดเพื่อให้ทุกหน้าเว็บเข้าถึงได้

## 📝 หมายเหตุ

- ต้องตั้งค่า Web App ให้เป็น **Anyone** ถึงจะเปิดใช้งานได้จากเว็บ
- ระบบเป็นแบบเรียลไทม์เมื่อ refresh
