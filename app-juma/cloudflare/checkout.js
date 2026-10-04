const limits = { name: 160, email: 320, phone: 80, street: 160, streetNumber: 30, apartment: 100, city: 120, province: 120, postalCode: 20, notes: 500 };
const optional = new Set(["apartment", "notes"]);

export function deliveryPayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Completá los datos de contacto y entrega.");
  const delivery = {};
  for (const [key, max] of Object.entries(limits)) {
    if (value[key] != null && typeof value[key] !== "string") throw new Error("Datos de entrega inválidos.");
    const text = (value[key] ?? "").trim();
    if ((!optional.has(key) && !text) || text.length > max) throw new Error("Revisá los datos obligatorios de contacto y dirección.");
    delivery[key] = text;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(delivery.email)) throw new Error("Ingresá un correo electrónico válido.");
  const digits = delivery.phone.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15 || !/^[\d\s()+.\-]+$/.test(delivery.phone)) throw new Error("Ingresá un teléfono válido con código de área.");
  return delivery;
}

export function checkoutKey(value) {
  if (typeof value !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value)) throw new Error("Solicitud de pedido inválida. Volvé a revisar el pedido.");
  return value;
}
