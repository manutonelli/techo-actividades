# Actividades de barrios

1. Crear una Google Sheet vacía y copiar su ID desde la URL.
2. Crear un proyecto de Apps Script y pegar `Code.gs`.
3. En **Configuración del proyecto → Propiedades del script**, agregar:
   - `SPREADSHEET_ID`: ID de la Sheet.
   - `ADMIN_PASSWORD`: contraseña elegida para el panel.
4. Implementar como **Aplicación web**:
   - Ejecutar como: la cuenta propietaria.
   - Acceso: cualquier usuario.
5. Copiar la URL terminada en `/exec` y colocarla en `barrios/config.js`.

La contraseña se valida dentro de Apps Script y nunca se guarda en el repositorio.
