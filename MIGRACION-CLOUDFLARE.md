# Migración de JUMA a Cloudflare

## Cuenta verificada

- Correo: `juma.accesorio@gmail.com`.
- Cuenta Cloudflare: `6f7477f1ef18b1f3b1f8785d2ec7fe57`.
- Worker destinado al frontend: `juma-web`.
- Primera publicación: https://juma-web.app-juma.workers.dev
- Versión publicada el 7 de septiembre de 2026: `99531068-cd06-4d3f-a9f4-83b088be2c6a`.

Verificación del 7 de septiembre: compilación y simulación correctas; Cloudflare
confirma esta versión activa al 100 %. HTTPS responde 200 y la portada carga
categorías, productos y precios desde Supabase. El error TLS inicial del alta
del subdominio ya no se reproduce. Los flujos de acceso y pedidos siguen pendientes
de validación antes de retirar Vercel o cambiar el dominio.

La cuenta está fijada en `app-juma/wrangler.jsonc`. El comando de despliegue
rechaza un `CLOUDFLARE_ACCOUNT_ID` diferente y no permite cambiar el nombre del
Worker por argumentos. No usar la cuenta de MSFarma.

## Etapa 1: frontend

El frontend React/Vite se publica como archivos estáticos en Cloudflare Workers.
La configuración devuelve `index.html` para las rutas de la aplicación, incluidas
`/auth/confirm` y `/reset-password`. La compilación usa las mismas variables y la
misma precedencia del build de producción anterior; el código de Supabase no cambia.

Desde `app-juma`, con Node.js 24 y npm instalados:

```powershell
npm run cf:check
npm run cf:deploy
```

`cf:check` compila y simula el despliegue sin publicar. `cf:deploy` vuelve a
compilar y publica solamente en la cuenta de JUMA. Wrangler está fijado a una
versión exacta mediante npm exec. Los archivos resultantes van a
`dist-cloudflare`, separados del build usado por Vercel.

La conexión a Supabase y las escrituras del negocio siguen activas: una compra
real desde la nueva URL todavía crea el pedido en Supabase. No usar compras o
altas reales como pruebas de despliegue.

## Requisitos antes de cambiar el dominio o retirar Vercel

- Verificar catálogo, imágenes, pedidos y accesos en el nuevo origen.
- Agregar en Supabase Authentication > URL Configuration las rutas exactas de
  confirmación y recuperación del nuevo dominio. Mantener las URLs anteriores
  mientras Vercel siga atendiendo tráfico.
- Resolver el acceso administrativo actual: se basa en el navegador y
  `localStorage`. Las políticas SQL del repositorio permiten operaciones anónimas
  amplias; hay que revisar las políticas realmente aplicadas en Supabase.
  La migración del hosting no corrige estos permisos. El build de Cloudflare
  bloquea `VITE_ADMIN_PASS` para no publicar una contraseña administrativa.
- El dominio y el hosting anteriores se conservan hasta validar el cambio.

## Etapas siguientes para retirar Supabase y Render

### Base de ensayo preparada

- D1: `juma-migration-db`, ID `c4229704-edcd-4731-913f-1cf028497c3e`.
- Configuración independiente: `app-juma/wrangler.d1.jsonc`, en la cuenta de JUMA.
- Migración `0001_application.sql` aplicada y comprobada remotamente: 13 tablas
  de aplicación, 9 índices y una vista pública de catálogo. Copia real importada
  el 8 de septiembre a las 00:47 UTC (7 de septiembre, hora argentina).
- Los importes se guardan como centavos enteros; la futura API debe convertirlos.
- El frontend publicado sigue usando Supabase; esta base no está conectada a la tienda.

### Obtener y validar la copia

En Supabase, abrir el proyecto `ezpbabxossevlheftgcu` y ejecutar en SQL Editor
`app-juma/cloudflare/export-supabase.sql`. Es una consulta de lectura; descargar
su resultado como CSV. El campo `sourceUrl` es una etiqueta fija del script,
no una comprobación de la identidad del servidor: verificar el proyecto en la URL
del dashboard antes de ejecutarlo.

Guardar el CSV en `app-juma/migration-data/`, excluido de Git porque contiene datos
de clientes. Desde `app-juma`, ejecutar:

```powershell
npm run test:migration
npm run migration:prepare -- migration-data/snapshot.csv
```

La preparación valida una copia en SQLite local, conserva IDs, rechaza columnas
desconocidas y relaciones rotas, convierte importes sin redondearlos y extrae
imágenes base64 para su futura subida a R2. Genera SQL y un informe con conteos,
sumas y hashes. Siete pruebas automatizadas cubren la preparación y el Worker.
No importa automáticamente a D1 ni cambia la conexión de la tienda.

La consulta incluye inventario de Storage y cantidad de usuarios Auth, pero no
descarga archivos ni exporta cuentas o contraseñas. Las imágenes extraídas tendrán
rutas `/media/imports/...` que requieren copiarlas a R2.
Las URLs existentes se incluyen en el inventario para resolverlas durante la copia.
Un error por tabla o columna ausente requiere revisar el esquema real, no omitir datos.

La sesión de Supabase y el proyecto Juma se verificaron en el dashboard. Se ejecutó
la consulta de lectura y se guardó el JSON completo del resultado visible en
`app-juma/migration-data/snapshot-2026-09-08.json`. La descarga CSV del navegador
no devolvió un archivo accesible; se recuperó el contenido JSON de la fila visible
y se validó su estructura antes de prepararlo.

### Copia de ensayo importada y verificada

- Snapshot: `2026-09-08T00:43:18.568896+00:00`.
- Preparación e informes privados: `app-juma/migration-data/prepared-2026-09-08T00-45-31-960Z/`.
- Conteos: 28 categorías, 6 clientes, 196 productos, 41 pedidos, 75 artículos de
  pedidos, 1 artículo de reposición, 1 banner y 2 paneles. Las otras 5 tablas están vacías.
- Se comprobó que D1 estaba vacía antes de importar. La importación fue correcta.
- Comparación remota: las 24 métricas de conteos, importes y cantidades coinciden
  con la copia local; `foreign_key_check` no encuentra relaciones rotas.
- D1 ocupa 266.240 bytes tras la importación. La API pública solo expone el catálogo;
  las tablas privadas no tienen endpoints públicos.
- Auth: 5 cuentas existentes; no se exportaron credenciales ni se migró el acceso.
- Storage: inventario de 1.301 objetos del bucket `products`, con 329.549.331 bytes
  según sus metadatos (aproximadamente 330 MB decimales). Esto difiere de la captura
  anterior de uso; usar este inventario como referencia de la copia, pendiente de
  comprobar tamaños al descargar los archivos. No hay imágenes base64 en las tablas.
- R2 está activo y el bucket `juma-media` permanece privado. Se copiaron los 1.301
  archivos (329.549.331 bytes) y cada objeto fue descargado nuevamente desde R2 y
  comparado por SHA-256; no hubo errores. La copia local y el registro reanudable
  están en `app-juma/migration-data/media/`, excluidos de Git.
- Las 732 referencias de imagen de 183 productos se resolvieron contra el inventario
  sin ambigüedades y se cambiaron en D1 a rutas `/media/products/...`. No quedan URLs
  de Supabase en los campos de imagen de la copia D1.
- El Worker `juma-web`, versión `b2eb81ac-0138-42f5-84de-7b606d067002`, sirve las
  imágenes mediante `/media/*` y expone endpoints de ensayo de solo lectura:
  `/api/catalog/products`, `/api/catalog/categories` y `/api/catalog/home`.
  La comprobación pública devolvió 195 productos habilitados, 28 categorías y una
  imagen descargada por el Worker con el mismo SHA-256 que el original.
- El frontend todavía consulta Supabase. No se cambia a D1 hasta implementar y probar
  escrituras, pedidos, stock y sesiones; así se evita que el catálogo de ensayo quede
  desactualizado cuando el administrador modifique el sistema actual.

Esta es una copia de ensayo en un instante concreto, no una sincronización continua.
Supabase sigue recibiendo las operaciones de la tienda; habrá que repetir la copia
final con escrituras pausadas antes del cambio definitivo.

### Sincronización incremental del 14 de septiembre de 2026

- Se agregó `npm run migration:snapshot`, que lee la configuración de producción,
  valida que el origen sea el proyecto JUMA y guarda una copia privada sin imprimir
  datos de clientes ni claves.
- La nueva preparación genera `upsert.sql`: actualiza o inserta por ID y no contiene
  sentencias `DELETE`. Antes de aplicarlo se exportó un respaldo completo de D1.
- Supabase pasó de 196 a 234 productos, de 28 a 29 categorías, de 6 a 7 clientes y
  de 0 a 2 talles. Los 41 pedidos y sus 75 artículos permanecieron sin cambios.
- Se detectaron y copiaron 54 archivos nuevos. R2 verificó 296 referencias actuales
  sin errores; el inventario acumulado contiene 1.355 objetos.
- D1 quedó con los mismos conteos y totales que la copia del origen: 234 productos,
  431 unidades de stock y 29 categorías. `foreign_key_check` no devolvió errores y
  no quedan URLs de Supabase en las imágenes de productos.
- El endpoint público devuelve 222 productos habilitados. Se comprobaron imágenes
  de los ingresos nuevos desde `jumaaccessory.com.ar/media/...`, todas con HTTP 200.
- `community_subscribers` no permite lectura mediante la clave pública. No se borró
  ni reemplazó su contenido en D1; se exportará con acceso privado durante el corte
  final.
- La revisión funcional detectó `product_reviews` y `app_settings`, ausentes del
  primer esquema. La migración `0002_reviews_settings.sql` creó ambas tablas en D1;
  no había reseñas y se copiaron 2 configuraciones actuales.
- El Worker versión `dbc20331-490f-492f-aeb2-af30a29e175b` incorporó una API
  administrativa para categorías, productos, talles e imágenes. Todas sus rutas
  requieren la cookie de sesión administrativa firmada; una comprobación anónima
  en producción devuelve HTTP 401. El catálogo público continúa devolviendo HTTP
  200 con 222 productos habilitados.

Para repetir una sincronización sin borrados:

```powershell
npm run migration:snapshot
npm run migration:prepare -- migration-data/snapshot-<fecha>.json
node scripts/migration/copy-media.mjs migration-data/snapshot-<fecha>.json <wrangler.js>
node scripts/migration/media-paths.mjs migration-data/snapshot-<fecha>.json migration-data/prepared-<fecha>/media-paths.sql
```

Luego se exporta un respaldo remoto de D1 y se aplican `upsert.sql` y
`media-paths.sql`. Los informes, respaldos y datos privados permanecen excluidos de
Git.

### Trabajo restante

1. Implementar y probar API, sesiones, roles administrativos, recuperación de
   contraseña y operaciones atómicas de pedidos/stock.
2. Migrar o reemplazar Supabase Auth. Cloudflare Access es adecuado para proteger
   el panel administrativo, pero el acceso de clientes necesita un proveedor de
   identidad o una implementación propia y un servicio de correo transaccional.
3. Comparar conteos, importes y archivos. Pausar escrituras durante la copia final,
   cambiar el origen de datos y conservar un respaldo y un plan de retorno.
4. Retirar Supabase y Render únicamente después de comprobar que ya no atienden
   datos, archivos, autenticación o consumidores externos.

Esta primera etapa no completa la unificación ni elimina por sí sola todos los
costos anteriores. El objetivo de USD 0 requiere medir también solicitudes, CPU,
consultas y correo, además del almacenamiento.
