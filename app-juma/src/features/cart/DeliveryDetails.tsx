import type { CheckoutDetails } from "../../types";

export default function DeliveryDetails({ delivery }: { delivery?: CheckoutDetails }) {
  if (!delivery) return null;
  return (
    <div className="rounded-xl border border-line bg-white p-4 text-sm text-ink">
      <h3 className="mb-2 font-bold">Contacto y dirección de entrega</h3>
      <p>{delivery.name}</p>
      <p className="break-words">{delivery.email} · {delivery.phone}</p>
      <p>{delivery.street} {delivery.streetNumber}{delivery.apartment ? `, ${delivery.apartment}` : ""}</p>
      <p>{delivery.city}, {delivery.province}, CP {delivery.postalCode} · Argentina</p>
      {delivery.notes && <p className="mt-2 whitespace-pre-wrap">Referencia: {delivery.notes}</p>}
    </div>
  );
}
