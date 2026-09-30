# techo-actividades
## Verificación

Ejecutar `node tests/review.test.cjs` para comprobar el renderizado seguro, las fechas dobles, los errores al guardar o borrar y las validaciones de Apps Script. Estas pruebas usan servicios simulados y no modifican datos reales.

La administración de la página principal aún usa una contraseña validada en el navegador. Para asegurar las escrituras, configurar autenticación de Supabase y políticas RLS; esa contraseña no constituye autorización del lado del servidor.
