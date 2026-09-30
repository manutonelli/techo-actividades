# Administración con Google Sheets + Apps Script

La misma aplicación web administra los barrios y las actividades de la portada. Valida la contraseña en el servidor en cada operación. La web la mantiene solo en memoria hasta cerrar sesión o recargar la página.

## Actualizar la implementación existente

1. Abrir el proyecto de Apps Script que corresponde a la URL de `barrios/config.js`.
2. Reemplazar su código por `Code.gs`. La hoja **Actividades** de barrios se conserva; la portada usa una hoja separada llamada **Portada**.
3. Si el proyecto no está vinculado a la planilla, guardar su identificador en la propiedad privada `SPREADSHEET_ID`. Se obtiene de la dirección de la planilla, entre `/d/` y `/edit`. Un proyecto vinculado puede usar la planilla actual sin esta propiedad. En **Configuración del proyecto → Propiedades del script**, configurar `ADMIN_PASSWORD` con una contraseña nueva, distinta de la que antes estaba publicada en la portada. No pegarla en GitHub ni en el HTML.
4. Ejecutar **importarPortadaInicial** desde el editor y autorizar los permisos solicitados. Importa las cuatro actividades actuales y sus enlaces a fotos desde el respaldo publicado. Si Portada ya tiene datos, se detiene sin sobrescribirlos.
5. Ir a **Implementar → Gestionar implementaciones → Editar → Nueva versión**. Ejecutar como la cuenta propietaria, con acceso para cualquier usuario. Actualizar la implementación existente conserva la URL y evita modificar la web.
6. Verificar el ingreso en la portada y en `/barrios/admin.html`. Crear, editar y eliminar una actividad de prueba, y confirmar que el cambio se vea al abrir la web sin iniciar sesión.

La publicación en GitHub Pages no actualiza Apps Script. Hasta completar estos pasos, la portada muestra el respaldo de las actividades y el nuevo panel no puede guardar cambios.

## Fotos

Las fotos actuales siguen publicadas como archivos del sitio. Las nuevas imágenes cargadas desde el panel se guardan en una carpeta de Drive llamada **TECHO - Fotos de actividades**, creada automáticamente. Sus enlaces se habilitan para visualización pública porque aparecen en la web. La propiedad `HOME_MEDIA_FOLDER_ID` guarda el identificador de esa carpeta. Si la cuenta de Google restringe compartir archivos, usar enlaces públicos de imágenes en vez de subir archivos.

Se admiten hasta 10 fotos por actividad. Al borrar una actividad, los archivos de Drive permanecen para evitar borrar imágenes que puedan estar compartidas o reutilizadas.

Los álbumes de los barrios siguen admitiendo carpetas de Google Drive o álbumes de Google Fotos. Deben permitir que el voluntariado acceda mediante el enlace.

## Comprobaciones de permisos

- Una solicitud POST sin contraseña o con una incorrecta debe devolver `ok: false`, sin modificar datos.
- El listado público de la portada debe mostrar solo actividades activas.
- El listado administrativo y todas las escrituras requieren `ADMIN_PASSWORD`.
- Mantener la hoja y la carpeta de Drive bajo la cuenta propietaria; no compartir la hoja públicamente para edición.
