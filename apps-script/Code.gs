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
 *    - "scores" (คอลัมน์: timestamp, team, event, category, score)
 *    - "events" (คอลัมน์: id, name, category, order)
 * 4. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. เอา Web App URL ไปวางใน web/js/config.js
 */

var SPREADSHEET_ID = '1ySaM0ogKEOJQiAfiWXMOY_7F7ClmDEPkWWXGvCMjMf4';

// ====== ฟังก์ชันหลัก ======

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
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
      case 'addEvent':
        result = addEvent(e);
        break;
      case 'deleteEvent':
        result = deleteEvent(e);
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

  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === 'scores') {
      sheet.appendRow(['timestamp', 'team', 'event', 'category', 'score']);
    } else if (name === 'events') {
      sheet.appendRow(['id', 'name', 'category', 'order']);
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

  values.forEach(function (row) {
    var team = String(row[1]);
    var score = Number(row[4]) || 0;

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
        category: row[3] || 'mixed',
        score: row[4]
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
        category: String(row[2]) || 'mixed',
        order: Number(row[3]) || 0
      });
    }
  });

  if (events.length === 0) {
    return DEFAULT_EVENTS;
  }

  return events;
}

var DEFAULT_EVENTS = [
  { id: 'runner', name: 'วิ่ง 100 เมตร', category: 'male', order: 1 },
  { id: 'relay', name: 'วิ่งผลัด', category: 'mixed', order: 2 },
  { id: 'tug', name: 'ชักเย่อ', category: 'mixed', order: 3 },
  { id: 'futsal', name: 'ฟุตซอล', category: 'male', order: 4 },
  { id: 'food', name: 'ร้านอาหาร', category: 'mixed', order: 5 },
  { id: 'parade', name: 'ขบวนพาเหรด', category: 'mixed', order: 6 }
];

function addScore(e) {
  var sheet = getScoreSheet();

  var team = e.parameter.team;
  var event = e.parameter.event;
  var category = e.parameter.category || 'mixed';
  var score = Number(e.parameter.score);

  if (!team || !event || isNaN(score)) {
    return { success: false, error: 'ข้อมูลไม่ครบถ้วน (team, event, score)' };
  }

  if (!isValidTeam(team)) {
    return { success: false, error: 'ทีมไม่ถูกต้อง' };
  }

  sheet.appendRow([new Date(), team, event, category, score]);

  return { success: true, message: 'บันทึกคะแนนเรียบร้อย' };
}

function deleteScore(e) {
  var row = Number(e.parameter.row);
  if (!row || row < 2) {
    return { success: false, error: 'row ไม่ถูกต้อง' };
  }

  var sheet = getScoreSheet();
  sheet.deleteRow(row);

  return { success: true, message: 'ลบเรียบร้อย' };
}

function resetScores() {
  var sheet = getScoreSheet();
  var values = sheet.getDataRange().getValues();
  var header = values.shift();
  sheet.clear();
  sheet.appendRow(header);

  return { success: true, message: 'ล้างคะแนนทั้งหมดเรียบร้อย' };
}

function addEvent(e) {
  var sheet = getEventSheet();

  var name = e.parameter.name;
  var category = e.parameter.category || 'mixed';

  if (!name) {
    return { success: false, error: 'กรุณากรอกชื่อกีฬา' };
  }

  var id = 'event_' + new Date().getTime();
  var lastRow = sheet.getLastRow();
  var order = lastRow;

  sheet.appendRow([id, name, category, order]);

  return { success: true, message: 'เพิ่มกีฬาเรียบร้อย', id: id };
}

function deleteEvent(e) {
  var id = e.parameter.id;
  if (!id) {
    return { success: false, error: 'ไม่พบรหัสกีฬา' };
  }

  var sheet = getEventSheet();
  var values = sheet.getDataRange().getValues();

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === id) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'ลบกีฬาเรียบร้อย' };
    }
  }

  return { success: false, error: 'ไม่พบรหัสกีฬานี้' };
}

function isValidTeam(team) {
  return ['orange', 'pink'].indexOf(team) !== -1;
}
