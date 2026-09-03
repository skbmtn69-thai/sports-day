// ====== การตั้งค่าหลัก ======

// วาง Web App URL ที่ได้จาก Google Apps Script Deployment
const APP_SCRIPT_URL = 'YOUR_APP_SCRIPT_URL_HERE';

// ชื่อทีม
const TEAMS = {
  orange: { name: 'สีส้ม', color: '#FF8C00', emoji: '🍊' },
  pink: { name: 'สีชมพู', color: '#FF69B4', emoji: '🌸' }
};

// รายการกิจกรรม
const DEFAULT_EVENTS = [
  { id: 'runner', name: 'วิ่ง 100 เมตร', type: 'score', order: 1 },
  { id: 'relay', name: 'วิ่งผลัด', type: 'score', order: 2 },
  { id: 'tug', name: 'ชักเย่อ', type: 'score', order: 3 },
  { id: 'futsal', name: 'ฟุตซอล', type: 'score', order: 4 },
  { id: 'food', name: 'ร้านอาหาร', type: 'score', order: 5 },
  { id: 'parade', name: 'ขบวนพาเหรด', type: 'score', order: 6 }
];
