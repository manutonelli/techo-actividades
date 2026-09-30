# TECHO La Plata

Sitio público de actividades, barrios y guía de roles.

La portada y los barrios usan Google Sheets + Apps Script. La contraseña se valida en el servidor y se guarda como propiedad del script; no hay contraseñas ni claves de Supabase en el sitio. Ver [configuración e implementación](apps-script/README.md).

## Verificación

Ejecutar `node tests/review.test.cjs`. Las pruebas usan servicios simulados y no modifican datos reales.

La portada conserva una copia pública de las actividades en `data/actividades.json`, con sus imágenes en `data/photos/`. Se usa para la transición cuando la API todavía no está actualizada o no responde. Los cambios posteriores se guardan en la hoja Portada; el respaldo no se actualiza automáticamente.
