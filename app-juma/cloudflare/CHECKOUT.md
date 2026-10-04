# Checkout con contacto y dirección

El carrito continúa a datos personales y entrega, luego a revisión y finalmente envía un pedido PENDIENTE. Funciona con invitados y clientes autenticados. No cobra: indica que JUMA contactará al comprador para confirmar disponibilidad, método de pago y envío.

Se guardan nombre, email, teléfono, calle, número, piso/departamento, localidad, provincia, código postal y referencia opcional en `orders.delivery_json`. Se muestran en la confirmación, en los detalles de administración (móvil y escritorio) y en el historial autenticado. La dirección no se guarda en localStorage.

Los precios se obtienen del catálogo en el servidor. Los pedidos pendientes pueden contener artículos por encargo; el stock se modifica cuando administración completa el pedido, con las protecciones existentes contra stock negativo. El envío es gratis desde $50.000; debajo de ese importe queda pendiente de cotización y el subtotal no se presenta como total definitivo.

`checkout_key` y `checkout_hash` protegen los reintentos y envíos concurrentes del mismo pedido. La clave única y los artículos se escriben en un lote atómico. La interfaz bloquea el envío mientras espera una respuesta. `/api/customer/orders` usa exclusivamente la sesión del servidor y no incluye costos de compra ni pedidos de otros clientes.

## Verificación

```powershell
npm.cmd run build
npm.cmd run build:cloudflare
npm.cmd run test:migration
node scripts/preview-checkout-local.mjs
```

La vista local está en http://127.0.0.1:3010/__test. Usa SQLite en memoria con las migraciones reales y datos ficticios. No envía notificaciones externas ni usa la base de producción. Para probar cliente autenticado, elegir la sesión de prueba y abrir `/auth/confirm`, que reconoce la cookie ficticia por el flujo existente. Los tests ejercitan el Worker con un adaptador local de D1; no sustituyen una prueba de despliegue sobre D1.

## Publicación

Aplicar `0006_checkout_delivery.sql` a D1 antes de desplegar el Worker y frontend. La migración es aditiva; no borra pedidos existentes. Los pedidos anteriores siguen mostrándose sin dirección. El nuevo endpoint público requiere dirección y `requestId`, así que una pestaña con la versión anterior debe recargarse.

```powershell
npm.cmd exec --yes --package=wrangler@4.129.0 -- wrangler d1 migrations apply juma-migration-db --remote --config wrangler.jsonc
npm.cmd run cf:deploy
```

Estos comandos son pasos de publicación, no se ejecutan durante la prueba local.
