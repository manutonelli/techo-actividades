const SHEET_NAME = 'Actividades';
const SPREADSHEET_ID = '1vRXHAQHdWCSGfFlGDlPhpAC-zUc3nGhyMcVUTg6NR8M';
const HEADERS = ['id', 'barrio', 'nombre', 'descripcion', 'album_url', 'activo', 'created_at'];

function doGet(e) {
  if ((e.parameter.action || 'list') !== 'list') return json_({ ok: false, error: 'Acción inválida' });
  const sheet = sheet_();
  const rows = sheet.getDataRange().getValues().slice(1);
  const activities = rows
    .filter(row => row[5] === true || String(row[5]).toLowerCase() === 'true')
    .map(row => ({ id: row[0], barrio: row[1], nombre: row[2], descripcion: row[3], albumUrl: row[4] }));
  return json_({ ok: true, activities });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    validatePassword_(body.password);
    if (body.action === 'adminList') return json_({ ok: true, activities: allActivities_() });
    if (body.action === 'create') return createActivity_(body);
    if (body.action === 'update') return updateActivity_(body);
    if (body.action === 'delete') return deleteActivity_(body);
    throw new Error('Acción inválida');
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function createActivity_(body) {
  const activity = validatedActivity_(body);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheet_().appendRow([Utilities.getUuid(), activity.barrio, activity.nombre, activity.descripcion, activity.albumUrl, true, new Date()]);
  } finally { lock.releaseLock(); }
  return json_({ ok: true });
}

function updateActivity_(body) {
  const activity = validatedActivity_(body);
  const id = clean_(body.id, 80);
  const row = findRow_(id);
  if (!row) throw new Error('La actividad no existe');
  const sheet = sheet_();
  const createdAt = sheet.getRange(row, 7).getValue();
  sheet.getRange(row, 1, 1, 7).setValues([[id, activity.barrio, activity.nombre, activity.descripcion, activity.albumUrl, true, createdAt]]);
  return json_({ ok: true });
}

function deleteActivity_(body) {
  const row = findRow_(clean_(body.id, 80));
  if (!row) throw new Error('La actividad no existe');
  sheet_().deleteRow(row);
  return json_({ ok: true });
}

function allActivities_() {
  return sheet_().getDataRange().getValues().slice(1).map(row => ({
    id: row[0], barrio: row[1], nombre: row[2], descripcion: row[3], albumUrl: row[4]
  }));
}

function validatedActivity_(body) {
  const activity = {
    barrio: clean_(body.barrio, 80),
    nombre: clean_(body.nombre, 80),
    descripcion: clean_(body.descripcion, 280),
    albumUrl: validateAlbumUrl_(body.albumUrl)
  };
  if (!activity.barrio || !activity.nombre || !activity.descripcion) throw new Error('Completá todos los campos');
  return activity;
}

function findRow_(id) {
  if (!id) return 0;
  const sheet = sheet_();
  if (sheet.getLastRow() <= 1) return 0;
  const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  const index = ids.findIndex(row => String(row[0]) === id);
  return index < 0 ? 0 : index + 2;
}

function sheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function validatePassword_(password) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!expected) throw new Error('Falta configurar ADMIN_PASSWORD');
  if (!password || password !== expected) throw new Error('Contraseña incorrecta');
}

function validateAlbumUrl_(value) {
  const url = clean_(value, 500);
  if (!/^https:\/\/(photos\.app\.goo\.gl|photos\.google\.com)\//i.test(url)) throw new Error('Ingresá un enlace válido de Google Fotos');
  return url;
}

function clean_(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
