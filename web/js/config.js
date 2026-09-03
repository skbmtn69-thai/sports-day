// ====== การตั้งค่าหลัก ======

// วาง Web App URL ที่ได้จาก Google Apps Script Deployment
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwKWs7_Shr6DvuMJbB5DAokczmzs-nIpdLkgADYsw-T1TXBXYTzkAWnPPS9GTsQmkUYqA/exec';

// ชื่อทีม
const TEAMS = {
  orange: { name: 'สีส้ม', color: '#FF8C00', emoji: '🍊' },
  pink: { name: 'สีชมพู', color: '#FF69B4', emoji: '🌸' }
};

// ประเภทกีฬา
const CATEGORIES = {
  male: { name: 'ชาย', emoji: '👦', color: '#4A90D9' },
  female: { name: 'หญิง', emoji: '👧', color: '#E91E63' },
  mixed: { name: 'ผสม', emoji: '🤝', color: '#9B59B6' }
};

// รายการกิจกรรมเริ่มต้น (ใช้เมื่อไม่มีข้อมูลในชีต)
const DEFAULT_EVENTS = [
  { id: 'runner', name: 'วิ่ง 100 เมตร', category: 'male', order: 1 },
  { id: 'relay', name: 'วิ่งผลัด', category: 'mixed', order: 2 },
  { id: 'tug', name: 'ชักเย่อ', category: 'mixed', order: 3 },
  { id: 'futsal', name: 'ฟุตซอล', category: 'male', order: 4 },
  { id: 'food', name: 'ร้านอาหาร', category: 'mixed', order: 5 },
  { id: 'parade', name: 'ขบวนพาเหรด', category: 'mixed', order: 6 }
];
