/**
 * ระบบกีฬาสี - Google Apps Script Backend
 * 
 * พื้นที่จัดเก็บข้อมูล: Google Sheets
 * เชื่อมต่อผ่าน: Web App URL (REST API)
 * 
 * การติดตั้ง:
 * 1. สร้าง Spreadsheet ใหม่ใน Google Drive
 * 2. เอา ID ของ Spreadsheet มาใส่ในตัวแปร SPREADSHEET_ID ด้านล่าง
 * 3. สร้างชีตชื่อผลลัพธ์ดังนี้:
 *    - "scores" (คอลัมน์: timestamp, team, event, score)
 *    - "events" (คอลัมน์: id, name, order, type)
 * 4. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. เอา Web App URL ไปวางใน web/js/config.js
 */

var SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// ====== ตั้งค่า CORS ======
var CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// ====== ฟังก์ชันหลัก ======

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

function handleRequest(e, method) {
  var content = ContentService.createTextOutput();
  content.setMimeType(ContentService.MimeType.JSON);

  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';
    var result;

    switch (action) {
      case 'getScores':
        result = getScores();
        break;
      case 'getEvents':
        result = getEvents();
        break;
      case 'addScore':
        result = addScore(e);
        break;
      case 'resetScores':
        result = resetScores();
        break;
      case 'deleteScore':
        result = deleteScore(e);
        break;
      default:
        result = { success: false, error: 'Unknown action: ' + action };
        break;
    }

    var output = JSON.stringify(result);
    content.setContent(output);
  } catch (err) {
    var errorOutput = JSON.stringify({ success: false, error: String(err) });
    content.setContent(errorOutput);
  }

  return content;
}

// ====== ฟังก์ชันจัดการข้อมูล ======

function getSheet(name) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(name);

  // สร้างชีตถ้ายังไม่มี
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === 'scores') {
      sheet.appendRow(['timestamp', 'team', 'event', 'score']);
    } else if (name === 'events') {
      sheet.appendRow(['id', 'name', 'type', 'order']);
    }
  }

  return sheet;
}

function getScoreSheet() {
  return getSheet('scores');
}

function getEventSheet() {
  return getSheet('events');
}

function getScores() {
  var sheet = getScoreSheet();
  var values = sheet.getDataRange().getValues();
  var header = values.shift();

  var events = getEventsFromSheet(getEventSheet());

  var totalScores = {};
  var eventScores = {};

  // ตารางคะแนนรวม
  values.forEach(function (row) {
    var team = String(row[1]);
    var score = Number(row[3]) || 0;

    if (!totalScores[team]) totalScores[team] = 0;
    totalScores[team] += score;

    if (!eventScores[team]) eventScores[team] = {};
    var eventName = String(row[2]);
    if (!eventScores[team][eventName]) eventScores[team][eventName] = 0;
    eventScores[team][eventName] += score;
  });

  return {
    success: true,
    scores: values.map(function (row) {
      return {
        timestamp: row[0],
        team: row[1],
        event: row[2],
        score: row[3]
      };
    }),
    totalScores: totalScores,
    eventScores: eventScores,
    events: events
  };
}

function getEvents() {
  var events = getEventsFromSheet(getEventSheet());
  return { success: true, events: events };
}

function getEventsFromSheet(sheet) {
  var values = sheet.getDataRange().getValues();
  var header = values.shift();
  var events = [];

  values.forEach(function (row) {
    if (row[0]) {
      events.push({
        id: String(row[0]),
        name: String(row[1]),
        type: String(row[2]),
        order: Number(row[3]) || 0
      });
    }
  });

  // ถ้ายังไม่มี event ใช้ค่าเริ่มต้น
  if (events.length === 0) {
    return DEFAULT_EVENTS;
  }

  return events;
}

var DEFAULT_EVENTS = [
  { id: 'runner', name: 'วิ่ง 100 เมตร', type: 'score', order: 1 },
  { id: 'relay', name: 'วิ่งผลัด', type: 'score', order: 2 },
  { id: 'tug', name: 'ชักเย่อ', type: 'score', order: 3 },
  { id: 'futsal', name: 'ฟุตซอล', type: 'score', order: 4 },
  { id: 'food', name: 'ร้านอาหาร', type: 'score', order: 5 },
  { id: 'parade', name: 'ขบวนพาเหรด', type: 'score', order: 6 }
];

function addScore(e) {
  var sheet = getScoreSheet();

  var team = e.parameter.team;
  var event = e.parameter.event;
  var score = Number(e.parameter.score);

  if (!team || !event || isNaN(score)) {
    return { success: false, error: 'ข้อมูลไม่ครบถ้วน (team, event, score)' };
  }

  // ตรวจว่าทีมถูกต้อง
  if (!isValidTeam(team)) {
    return { success: false, error: 'ทีมไม่ถูกต้อง' };
  }

  sheet.appendRow([new Date(), team, event, score]);

  return { success: true, message: 'บันทึกคะแนนเรียบร้อย' };
}

function deleteScore(e) {
  var row = Number(e.parameter.row);
  if (!row || row < 2) {
    return { success: false, error: 'row ไม่ถูกต้อง' };
  }

  var sheet = getScoreSheet();
  sheet.deleteRow(row); // row 1 คือ header ดังนั้น row ที่ระบุต้องเป็น index จริง

  return { success: true, message: 'ลบเรียบร้อย' };
}

function resetScores() {
  var sheet = getScoreSheet();
  var values = sheet.getDataRange().getValues();
  var header = values.shift(); // เก็บ header
  sheet.clear();
  sheet.appendRow(header);

  return { success: true, message: 'ล้างคะแนนทั้งหมดเรียบร้อย' };
}

function isValidTeam(team) {
  return ['orange', 'pink'].indexOf(team) !== -1;
}
