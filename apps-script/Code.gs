const SHEET_NAME = 'Actividades';
const HEADERS = ['id', 'barrio', 'nombre', 'descripcion', 'album_url', 'activo', 'created_at'];

function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action || 'list';
    if (action === 'homeList') return json_({ ok: true, activities: homeActivities_().filter(activity => activity.active) });
    if (action !== 'list') throw new Error('Acción inválida');
    const activities = allActivities_().filter(activity => activity.activo);
    return json_({ ok: true, activities });
  } catch (error) { return json_({ ok: false, error: error.message }); }
}

function doPost(e) {
  try {
    const body = JSON.parse(e && e.postData && e.postData.contents || '{}');
    validatePassword_(body.password);
    if (body.action === 'homeAdminList') return json_({ ok: true, activities: homeActivities_() });
    if (body.action === 'adminList') return json_({ ok: true, activities: allActivities_() });
    const operations = { create: createActivity_, update: updateActivity_, delete: deleteActivity_, homeSave: saveHomeActivity_, homeDelete: deleteHomeActivity_ };
    if (Object.prototype.hasOwnProperty.call(operations, body.action)) {
      const lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try { return operations[body.action](body); } finally { lock.releaseLock(); }
    }
    throw new Error('Acción inválida');
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function createActivity_(body) {
  const activity = validatedActivity_(body);
  sheet_().appendRow([Utilities.getUuid(), sheetText_(activity.barrio), sheetText_(activity.nombre), sheetText_(activity.descripcion), activity.albumUrl, true, new Date()]);
  return json_({ ok: true });
}

function updateActivity_(body) {
  const activity = validatedActivity_(body);
  const id = clean_(body.id, 80);
  const row = findRow_(id);
  if (!row) throw new Error('La actividad no existe');
  const sheet = sheet_();
  const createdAt = sheet.getRange(row, 7).getValue();
  sheet.getRange(row, 1, 1, 7).setValues([[id, sheetText_(activity.barrio), sheetText_(activity.nombre), sheetText_(activity.descripcion), activity.albumUrl, true, createdAt]]);
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
    id: row[0], barrio: row[1], nombre: row[2], descripcion: row[3], albumUrl: row[4], activo: row[5] === true || String(row[5]).toLowerCase() === 'true'
  }));
}

function validatedActivity_(body) {
  const activity = {
    barrio: clean_(body.barrio, 80),
    nombre: clean_(body.nombre, 80),
    descripcion: clean_(body.descripcion, 280),
    albumUrl: validateMediaUrl_(body.albumUrl)
  };
  if (!activity.barrio || !activity.nombre) throw new Error('Completá el barrio y el nombre de la actividad');
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
  const spreadsheet = spreadsheet_();
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

function validateMediaUrl_(value) {
  const url = clean_(value, 500);
  if (!/^https:\/\/(photos\.app\.goo\.gl|photos\.google\.com|drive\.google\.com)\//i.test(url)) {
    throw new Error('Ingresá un enlace válido de Google Drive o Google Fotos');
  }
  return url;
}

function sheetText_(value) {
  return String(value).startsWith('=') ? "'" + value : value;
}

function clean_(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// Portada: una hoja independiente, sin cambiar los datos de barrios.
const HOME_HEADERS = ['id', 'title', 'day', 'date', 'punto', 'descripcion', 'link', 'color', 'photos', 'active', 'created_at'];

function homeSheet_() {
  const spreadsheet = spreadsheet_();
  let sheet = spreadsheet.getSheetByName('Portada');
  if (!sheet) {
    sheet = spreadsheet.insertSheet('Portada');
    sheet.appendRow(HOME_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function homeActivities_() {
  return homeSheet_().getDataRange().getValues().slice(1).filter(row => row[0]).map(row => {
    let photos = [];
    try { photos = JSON.parse(row[8] || '[]'); } catch (error) {}
    return { id: String(row[0]), title: row[1], day: row[2], date: row[3], punto: row[4], desc: row[5], link: row[6], color: row[7], photos: Array.isArray(photos) ? photos : [], active: row[9] === true || String(row[9]).toLowerCase() === 'true' };
  });
}

function validatedHome_(input) {
  if (!input || typeof input !== 'object') throw new Error('Actividad inválida');
  const activity = { id: clean_(input.id, 80), title: clean_(input.title, 200), day: clean_(input.day, 40), date: clean_(input.date, 100), punto: clean_(input.punto, 300), desc: clean_(input.desc || input.descripcion, 5000), link: clean_(input.link, 2000), color: clean_(input.color, 7), active: input.active !== false };
  if (!activity.id || !activity.title || !activity.date) throw new Error('Completá el título y la fecha');
  if (!/^[a-z0-9_-]{1,80}$/i.test(activity.id)) throw new Error('Identificador inválido');
  if (activity.link && !/^https?:\/\/[^\s]+$/i.test(activity.link)) throw new Error('Enlace de inscripción inválido');
  if (!/^#[0-9a-f]{6}$/i.test(activity.color)) activity.color = '#0092DD';
  let photos = input.photos || [];
  if (typeof photos === 'string') { try { photos = JSON.parse(photos); } catch (error) { throw new Error('Fotos inválidas'); } }
  if (!Array.isArray(photos) || photos.length > 10) throw new Error('Se admiten hasta 10 fotos por actividad');
  // Validar todas antes de crear archivos en Drive.
  photos.forEach(photo => {
    if (typeof photo !== 'string' || !(/^https?:\/\/[^\s]+$/i.test(photo) && photo.length <= 2000 || /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(photo) && photo.length <= 2000000)) throw new Error('Foto inválida o demasiado grande');
  });
  activity.photos = photos.map(homePhoto_);
  return activity;
}

function homePhoto_(photo) {
  if (!photo.startsWith('data:')) return photo;
  const match = photo.match(/^data:(image\/(jpeg|png|webp));base64,(.+)$/i);
  const props = PropertiesService.getScriptProperties();
  let folderId = props.getProperty('HOME_MEDIA_FOLDER_ID');
  if (!folderId) {
    folderId = DriveApp.createFolder('TECHO - Fotos de actividades').getId();
    props.setProperty('HOME_MEDIA_FOLDER_ID', folderId);
  }
  const ext = match[2].toLowerCase() === 'jpeg' ? 'jpg' : match[2].toLowerCase();
  const blob = Utilities.newBlob(Utilities.base64Decode(match[3]), match[1].toLowerCase(), Utilities.getUuid() + '.' + ext);
  const file = DriveApp.getFolderById(folderId).createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1200';
}

function findHomeRow_(id) {
  const sheet = homeSheet_();
  if (sheet.getLastRow() <= 1) return 0;
  const index = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().findIndex(row => String(row[0]) === String(id));
  return index < 0 ? 0 : index + 2;
}

function saveHomeActivity_(body) {
  const activity = validatedHome_(body.activity);
  const sheet = homeSheet_(), row = findHomeRow_(activity.id);
  const createdAt = row ? sheet.getRange(row, 11).getValue() : new Date();
  const values = [activity.id, sheetText_(activity.title), sheetText_(activity.day), sheetText_(activity.date), sheetText_(activity.punto), sheetText_(activity.desc), activity.link, activity.color, JSON.stringify(activity.photos), activity.active, createdAt];
  if (row) sheet.getRange(row, 1, 1, 11).setValues([values]);
  else sheet.appendRow(values);
  return json_({ ok: true, activity });
}

function deleteHomeActivity_(body) {
  const row = findHomeRow_(clean_(body.id, 80));
  if (!row) throw new Error('La actividad no existe');
  homeSheet_().deleteRow(row);
  return json_({ ok: true });
}

// Ejecutar una sola vez desde el editor, antes de publicar la nueva versión.
// Importa solamente cuando la hoja Portada está vacía: no duplica ni pisa cambios.
function importarPortadaInicial() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = homeSheet_();
    if (sheet.getLastRow() > 1) throw new Error('Portada ya contiene actividades; no se modificó');
    const response = UrlFetchApp.fetch('https://techolaplata.site/data/actividades.json');
    const activities = JSON.parse(response.getContentText());
    if (!Array.isArray(activities)) throw new Error('El respaldo no contiene una lista');
    const validated = activities.map(validatedHome_);
    const rows = validated.map(a => [a.id, sheetText_(a.title), sheetText_(a.day), sheetText_(a.date), sheetText_(a.punto), sheetText_(a.desc), a.link, a.color, JSON.stringify(a.photos), a.active, new Date()]);
    if (rows.length) sheet.getRange(2, 1, rows.length, 11).setValues(rows);
  } finally { lock.releaseLock(); }
}

function spreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  const spreadsheet = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Configurá SPREADSHEET_ID en las propiedades del script');
  return spreadsheet;
}
