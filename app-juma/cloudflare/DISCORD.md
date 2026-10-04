# Avisos de pedidos en Discord

1. En un canal de texto de Discord, abrí Editar canal → Integraciones → Webhooks y creá uno llamado JUMA Pedidos. Copiá la URL.
2. En Cloudflare, abrí Workers & Pages → juma-web → Settings → Variables and Secrets. Agregá un secreto llamado `DISCORD_WEBHOOK_URL` con esa URL. No uses una variable del frontend ni guardes la URL en Git.
3. Desplegá la versión actual del Worker con `npm run cf:deploy` desde `app-juma`.
4. Creá un pedido de prueba en la tienda y comprobá que llegue al canal.

También se puede configurar el secreto desde `app-juma` con:

```powershell
npx --yes wrangler@4.129.0 secret put DISCORD_WEBHOOK_URL --config wrangler.jsonc
```

Cada pedido nuevo guardado desde la tienda o administración genera un aviso con número, comprador (nombre de invitado o ID de cliente), fecha, estado, nombres de los productos con cantidad y talle, y total en ARS. Las modificaciones no generan avisos.

El envío se ejecuta con `ctx.waitUntil`. Sin el secreto, queda desactivado. Los fallos se registran sin incluir la URL y no afectan la creación del pedido. Esta implementación realiza un intento de envío; no tiene cola persistente ni reintentos, por lo que no garantiza entrega durante una caída de Discord.
