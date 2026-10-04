export async function notifyDiscordOrder(env, orderId, order) {
  if (!env.DISCORD_WEBHOOK_URL) return;
  let stage = "webhook-url";
  try {
    const url = new URL(env.DISCORD_WEBHOOK_URL.trim());
    if (url.protocol !== "https:" || url.hostname !== "discord.com" || !/^\/api(?:\/v\d+)?\/webhooks\/\d+\/[^/]+$/.test(url.pathname)) {
      throw new Error("Invalid webhook");
    }
    url.searchParams.set("wait", "true");
    const total = order.items.reduce((sum, item) => sum + item.quantity * item.unitSalePriceCents, 0);
    const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
    stage = "product-names";
    const productIds = [...new Set(order.items.map(item => item.productId))];
    const products = await env.DB.prepare(`SELECT id,name FROM products WHERE id IN (${productIds.map(() => "?").join(",")})`).bind(...productIds).all();
    const productNames = new Map(products.results.map(product => [product.id, product.name]));
    const items = order.items.map(item => `${item.quantity} × ${productNames.get(item.productId) || "Producto no disponible"}${item.size ? ` (${item.size})` : ""}`).join("\n");
    stage = "fetch";
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        username: "JUMA Pedidos",
        allowed_mentions: { parse: [] },
        embeds: [{
          title: `Nuevo pedido #${orderId}`,
          color: 0xb88d53,
          fields: [
            { name: "Comprador", value: order.clientId ? `Cliente #${order.clientId}` : order.guestName || "Sin nombre" },
            { name: "Fecha", value: order.date },
            { name: "Estado", value: order.status },
            { name: "Total", value: money.format(total / 100) },
            { name: "Artículos", value: items.length > 1024 ? `${items.slice(0, 1021)}…` : items },
          ],
        }],
      }),
    });
    if (!response.ok) {
      console.error("Discord order notification failed", { orderId, status: response.status });
      await response.body?.cancel();
    } else {
      stage = "confirmation";
      const message = await response.json();
      console.info("Discord order notification sent", { orderId, messageId: message.id });
    }
  } catch (error) {
    // Never log the webhook token or fail an already saved order.
    const token = env.DISCORD_WEBHOOK_URL.trim().split("/").at(-1);
    const reason = String(error?.message || "Unknown error").replaceAll(env.DISCORD_WEBHOOK_URL.trim(), "[webhook]").replaceAll(token, "[token]").slice(0, 200);
    console.error("Discord order notification failed", { orderId, stage, errorType: error?.name, reason });
  }
}

export async function scheduleDiscordOrder(env, ctx, orderId, order) {
  if (!env.DISCORD_WEBHOOK_URL) return;
  const notification = notifyDiscordOrder(env, orderId, order);
  if (ctx?.waitUntil) ctx.waitUntil(notification);
  else await notification;
}
