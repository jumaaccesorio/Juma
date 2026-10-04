import { useEffect, useRef, useState } from "react";
import type { CheckoutDetails, Client } from "../../types";
import DeliveryDetails from "./DeliveryDetails";

type Props = {
  client: Client | null;
  initialDetails: CheckoutDetails | null;
  onDetailsChange: (details: CheckoutDetails) => void;
  rows: { name: string; quantity: number; size?: string; subtotal: number; backorder: boolean }[];
  total: number;
  onBack: () => void;
  onSubmit: (details: CheckoutDetails, requestId: string) => Promise<void>;
};

const fields: { key: keyof CheckoutDetails; label: string; autocomplete?: string; type?: string; optional?: boolean; max: number }[] = [
  { key: "name", label: "Nombre y apellido", autocomplete: "name", max: 160 },
  { key: "email", label: "Correo electrónico", type: "email", autocomplete: "email", max: 320 },
  { key: "phone", label: "Teléfono de contacto / WhatsApp", type: "tel", autocomplete: "tel", max: 80 },
  { key: "street", label: "Calle", autocomplete: "address-line1", max: 160 },
  { key: "streetNumber", label: "Número (o S/N)", max: 30 },
  { key: "apartment", label: "Piso / departamento", autocomplete: "address-line2", optional: true, max: 100 },
  { key: "city", label: "Localidad", autocomplete: "address-level2", max: 120 },
  { key: "province", label: "Provincia", autocomplete: "address-level1", max: 120 },
  { key: "postalCode", label: "Código postal", autocomplete: "postal-code", max: 20 },
];

export default function CheckoutPanel({ client, initialDetails, onDetailsChange, rows, total, onBack, onSubmit }: Props) {
  const [details, setDetails] = useState<CheckoutDetails>(initialDetails ?? { name: client?.name ?? "", email: client?.email ?? "", phone: client?.phone ?? "", street: "", streetNumber: "", apartment: "", city: "", province: "", postalCode: "", notes: "" });
  useEffect(() => { onDetailsChange(details); }, [details, onDetailsChange]);
  const [step, setStep] = useState<"details" | "review">("details");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  // Keep the same key for a retry of an identical request after a lost response.
  const attempt = useRef<{ signature: string; id: string } | null>(null);

  const send = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSending(true);
    setError("");
    const signature = JSON.stringify({ details, rows });
    if (attempt.current?.signature !== signature) attempt.current = { signature, id: crypto.randomUUID() };
    try {
      await onSubmit(details, attempt.current.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos enviar el pedido. Revisá la conexión e intentá nuevamente.");
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:px-6 md:py-12">
      <p className="text-sm text-muted">1. Carrito · {step === "review" && "2. Datos y entrega · "}<strong>{step === "details" ? "2. Datos y entrega" : "3. Revisar pedido"}</strong></p>
      <h1 tabIndex={-1} className="font-serif text-3xl text-ink">{step === "details" ? "Tus datos y dirección de entrega" : "Revisá tu pedido"}</h1>
      <p className="rounded-xl border border-primary/20 bg-secondary/40 p-4 text-sm leading-6 text-ink">Nos comunicaremos al teléfono o correo que indiques para confirmar la disponibilidad, el método de pago y el envío. En este paso no se realiza ningún cobro.</p>
      {step === "details" ? (
        <form className="space-y-5" onSubmit={event => {
          event.preventDefault();
          const clean = Object.fromEntries(Object.entries(details).map(([key, value]) => [key, value.trim()])) as CheckoutDetails;
          if (fields.some(field => !field.optional && !clean[field.key])) { setError("Completá todos los campos obligatorios."); return; }
          if (!/^[\d\s()+.\-]+$/.test(clean.phone) || clean.phone.replace(/\D/g, "").length < 8 || clean.phone.replace(/\D/g, "").length > 15) { setError("Ingresá un teléfono válido de entre 8 y 15 dígitos, incluyendo código de área."); return; }
          setDetails(clean); setError(""); setStep("review"); window.scrollTo({ top: 0, behavior: "smooth" });
        }}>
          <p className="text-sm text-muted">Entrega en Argentina. Los campos marcados con * son obligatorios.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(field => (
              <label key={field.key} className="block text-sm font-semibold text-ink">
                {field.label}{field.optional ? " (opcional)" : " *"}
                <input name={field.key} type={field.type ?? "text"} autoComplete={field.autocomplete} required={!field.optional} maxLength={field.max} value={details[field.key]} onChange={event => setDetails(prev => ({ ...prev, [field.key]: event.target.value }))} className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-3 font-normal text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </label>
            ))}
          </div>
          <label className="block text-sm font-semibold text-ink">Referencia para encontrar la dirección (opcional)
            <textarea name="notes" maxLength={500} value={details.notes} onChange={event => setDetails(prev => ({ ...prev, notes: event.target.value }))} className="mt-2 w-full rounded-lg border border-line p-3 font-normal" rows={3} />
          </label>
          <p className="text-sm text-muted">Usaremos estos datos para gestionar tu pedido. <a href="/privacidad" target="_blank" rel="noreferrer" className="underline">Política de privacidad</a>.</p>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onBack} className="rounded-lg border border-line px-5 py-3 text-sm font-bold">Volver al carrito</button>
            <button type="submit" className="rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white">Revisar pedido</button>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          <DeliveryDetails delivery={details} />
          <div className="rounded-xl border border-line bg-white p-4">
            <h2 className="mb-3 font-bold text-ink">Productos</h2>
            {rows.map((row, index) => <div key={index} className="flex justify-between gap-4 border-b border-line py-3 text-sm"><div>{row.quantity} × {row.name}{row.size && ` · Talle ${row.size}`}{row.backorder && <p className="text-amber-800">Por encargo: confirmaremos disponibilidad y plazo.</p>}</div><span className="shrink-0">${row.subtotal.toLocaleString("es-AR")}</span></div>)}
            <p className="mt-4 flex justify-between font-bold">Subtotal de productos <span>${total.toLocaleString("es-AR")}</span></p>
            <p className="mt-2 text-sm text-muted">{total >= 50000 ? "Envío gratis desde $50.000. Coordinaremos la modalidad y el plazo." : "Envío a cotizar. Te confirmaremos el costo y el importe final antes de pagar."}</p>
          </div>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button disabled={sending} onClick={() => { setStep("details"); setError(""); }} className="rounded-lg border border-line px-5 py-3 text-sm font-bold disabled:opacity-50">Editar datos</button>
            <button disabled={sending} onClick={send} className="rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{sending ? "Enviando pedido…" : "Enviar pedido"}</button>
          </div>
        </div>
      )}
    </section>
  );
}
