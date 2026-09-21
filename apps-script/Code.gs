const SHEET_NAME = 'Actividades';
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
    if (body.action !== 'create') throw new Error('Acción inválida');
    validatePassword_(body.password);
    const barrio = clean_(body.barrio, 80);
    const nombre = clean_(body.nombre, 80);
    const descripcion = clean_(body.descripcion, 280);
    const albumUrl = validateAlbumUrl_(body.albumUrl);
    if (!barrio || !nombre || !descripcion) throw new Error('Completá todos los campos');
    sheet_().appendRow([Utilities.getUuid(), barrio, nombre, descripcion, albumUrl, true, new Date()]);
    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function sheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!spreadsheetId) throw new Error('Falta configurar SPREADSHEET_ID');
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
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
