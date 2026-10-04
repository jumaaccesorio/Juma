import { useState } from "react";
import type { CheckoutDetails, Client, Product } from "../../types";
import CheckoutPanel from "./CheckoutPanel";
import DeliveryDetails from "./DeliveryDetails";
import { getProductDisplayName } from "../../lib/productLabel";
import ProductImage from "../../components/ProductImage";

type CartRow = { product: Product; quantity: number; size?: string; subtotal: number };
const availableStock = (row: CartRow) => row.size ? row.product.sizes?.find(size => size.size === row.size)?.stock ?? 0 : row.product.stock;
export type OrderConfirmation = { orderId: number; customerName?: string; delivery?: CheckoutDetails; rows: { name: string; quantity: number; size?: string; subtotal: number }[]; total: number };

type CartPanelProps = {
  cartRows: CartRow[];
  cartItemsCount: number;
  cartTotal: number;
  orderConfirmation: OrderConfirmation | null;
  onUpdateCartQuantity: (productId: number, quantity: number, size?: string) => void;
  onRemoveFromCart: (productId: number, size?: string) => void;
  onClearCart: () => void;
  client: Client | null;
  isLoading: boolean;
  onCheckout: (details: CheckoutDetails, requestId: string) => Promise<void>;
  onBackToCatalog: () => void;
};

function CartPanel({
  cartRows,
  cartItemsCount,
  cartTotal,
  orderConfirmation,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onClearCart,
  client,
  isLoading,
  onCheckout,
  onBackToCatalog,
}: CartPanelProps) {
  const [checkout, setCheckout] = useState(false);
  const [draft, setDraft] = useState<CheckoutDetails | null>(null);
  if (orderConfirmation) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 md:px-20 md:py-12">
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-subtle">
          <div className="border-b border-line bg-secondary/65 px-4 py-7 text-center sm:px-8 sm:py-8">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/25 text-[#647554]">
              <span translate="no" className="material-symbols-outlined text-3xl">check</span>
            </span>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.28em] text-muted">Pedido recibido · Pendiente de confirmación</p>
            <h1 className="mt-3 font-serif text-3xl text-ink sm:text-4xl">Gracias por tu pedido</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
              {orderConfirmation.customerName ? `${orderConfirmation.customerName}, ` : ""}
              recibimos tu pedido. Nos comunicaremos al teléfono o correo indicado para confirmar la disponibilidad, el método de pago y el envío. Todavía no se realizó ningún cobro.
            </p>
          </div>

          <div className="grid gap-6 px-4 py-6 sm:px-8 sm:py-8 md:grid-cols-2">
            <div className="rounded-xl border border-line bg-background p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted">Numero de pedido</p>
              <p className="mt-3 font-serif text-4xl text-primary">#{String(orderConfirmation.orderId).padStart(5, "0")}</p>
              <p className="mt-3 text-sm text-muted">
                Guardalo para futuras consultas. Tambien podremos identificar tu compra con este numero si nos escribis.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-white p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted">Proximo paso</p>
              <p className="mt-3 text-sm leading-6 text-ink">
                Nuestro equipo va a revisar tu pedido y te contactaremos para confirmar disponibilidad, formas de pago y envio.
              </p>
              <button
                type="button"
                onClick={onBackToCatalog}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
              >
                Volver al catálogo
                <span translate="no" className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </div>
          <div className="space-y-4 px-4 pb-6 sm:px-8">
            <DeliveryDetails delivery={orderConfirmation.delivery} />
            <div className="rounded-xl border border-line p-4 text-sm">
              <h2 className="mb-2 font-bold">Resumen del pedido</h2>
              {orderConfirmation.rows.map((row, index) => <p key={index} className="flex justify-between gap-3 py-1"><span>{row.quantity} × {row.name}{row.size ? ` · Talle ${row.size}` : ""}</span><span>${row.subtotal.toLocaleString("es-AR")}</span></p>)}
              <p className="mt-3 font-bold">Subtotal de productos: ${orderConfirmation.total.toLocaleString("es-AR")}</p>
              <p className="mt-1 text-muted">{orderConfirmation.total >= 50000 ? "Envío gratis. Coordinaremos la modalidad y el plazo." : "Envío pendiente de cotización. Te confirmaremos el importe final antes de pagar."}</p>
              <a className="mt-4 inline-block font-bold text-primary underline" href={`mailto:Juma.accesorio@gmail.com?subject=${encodeURIComponent(`Consulta por pedido #${String(orderConfirmation.orderId).padStart(5, "0")}`)}`}>Consultar por este pedido</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) return <div role="status" className="px-6 py-12 text-center text-muted">Cargando tu carrito…</div>;
  if (checkout && cartRows.length > 0) return <CheckoutPanel client={client} initialDetails={draft} onDetailsChange={setDraft} rows={cartRows.map(row => ({ name: getProductDisplayName(row.product), quantity: row.quantity, size: row.size, subtotal: row.subtotal, backorder: availableStock(row) < row.quantity }))} total={cartTotal} onBack={() => setCheckout(false)} onSubmit={onCheckout} />;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:px-20 md:py-10">
      <div className="mb-10">
        <h1 className="font-serif text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">Tu Carrito</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Revisá tus productos. En el siguiente paso completás tus datos y dirección de entrega.</p>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {cartRows.length === 0 ? (
            <div className="rounded-xl border border-primary/5 bg-white p-12 text-center shadow-sm dark:bg-slate-900/50">
              <span translate="no" className="material-symbols-outlined mb-4 text-6xl text-slate-300">production_quantity_limits</span>
              <p className="font-medium text-slate-500">No hay productos en el carrito.</p>
            </div>
          ) : (
            <>
              {cartRows.map((row) => {
                const isBackorder = availableStock(row) < row.quantity;

                return (
                  <div key={`${row.product.id}-${row.size ?? 'default'}`} className="flex flex-col items-center gap-5 rounded-xl border border-primary/5 bg-white p-4 shadow-sm dark:bg-slate-900/50 sm:flex-row sm:p-6">
                    <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                      {row.product.image ? (
                        <ProductImage
                          product={row.product}
                          className="h-full w-full object-cover"
                          alt={getProductDisplayName(row.product)}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span translate="no" className="material-symbols-outlined text-4xl text-slate-300">image</span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between self-stretch">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{getProductDisplayName(row.product)}</h3>
                          <p className="text-sm text-slate-500">
                            {row.product.categoryName || "Sin categoria"} • {row.product.stock > 0 ? "Disponible" : "Sin stock inmediato"}
                          </p>
                          {row.size ? (
                            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                              <span translate="no" className="material-symbols-outlined text-[10px]">straighten</span>
                              Talle {row.size}
                            </p>
                          ) : null}
                          {isBackorder ? (
                            <p className="mt-2 inline-flex items-center rounded-full bg-warning/25 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a6d48]">
                              Pedido por encargo
                            </p>
                          ) : null}
                        </div>
                        <p className="shrink-0 text-lg font-bold text-primary">${row.subtotal.toLocaleString("es-AR")}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 sm:mt-0">
                        <div className="flex items-center gap-3 rounded-lg border border-primary/10 bg-background p-1 dark:bg-slate-800">
                          <button
                            aria-label={`Disminuir cantidad de ${getProductDisplayName(row.product)}`}
                            onClick={() => onUpdateCartQuantity(row.product.id, row.quantity - 1, row.size)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-primary/10"
                          >
                            <span translate="no" className="material-symbols-outlined text-lg">remove</span>
                          </button>
                          <span className="w-8 text-center font-bold text-slate-900 dark:text-slate-100">{row.quantity}</span>
                          <button
                            aria-label={`Aumentar cantidad de ${getProductDisplayName(row.product)}`}
                            disabled={row.quantity >= 99}
                            onClick={() => onUpdateCartQuantity(row.product.id, row.quantity + 1, row.size)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-primary/10"
                          >
                            <span translate="no" className="material-symbols-outlined text-lg">add</span>
                          </button>
                        </div>
                        <button
                          onClick={() => onRemoveFromCart(row.product.id, row.size)}
                          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:text-red-500"
                        >
                          <span translate="no" className="material-symbols-outlined text-sm">delete</span> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end pt-4">
                <button onClick={onClearCart} className="flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-primary">
                  <span translate="no" className="material-symbols-outlined text-lg">delete_sweep</span> Vaciar Carrito
                </button>
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-28 rounded-xl border-2 border-primary/10 bg-white p-5 shadow-xl shadow-primary/5 dark:bg-slate-900/50 sm:p-8">
            <h2 className="mb-6 border-b border-primary/5 pb-4 font-serif text-2xl font-black text-slate-900 dark:text-slate-100">Resumen</h2>

            <div className="mb-8 space-y-4">
              <div className="flex justify-between text-slate-500">
                <span className="text-sm">Subtotal ({cartItemsCount} items)</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">${cartTotal.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span className="text-sm">Envio Estandar</span>
                {cartTotal >= 50000 ? (
                  <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-green-600">
                    <span translate="no" className="material-symbols-outlined text-sm">local_shipping</span> Gratis
                  </span>
                ) : (
                  <span className="cursor-help font-medium text-slate-900 dark:text-slate-100" title="Envio gratis desde $50.000">A calcular</span>
                )}
              </div>

              <div className="flex items-end justify-between border-t border-primary/5 pt-4">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Subtotal de productos</span>
                <span className="text-3xl font-black text-primary">${cartTotal.toLocaleString("es-AR")}</span>
              </div>
            </div>

            <div className="mb-5 rounded-xl border border-warning/40 bg-warning/15 px-4 py-3 text-sm text-[#8a6140]">
              Nos comunicaremos para confirmar disponibilidad, método de pago y envío. {cartTotal < 50000 ? "El envío no está incluido: te confirmaremos su costo antes de pagar." : "Envío gratis desde $50.000."}
            </div>

            <div className="space-y-3">
              <button
                disabled={cartRows.length === 0}
                onClick={() => { setCheckout(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className={`group flex w-full items-center justify-center gap-2 rounded-md px-6 py-4 font-bold transition-all ${cartRows.length === 0 ? "cursor-not-allowed bg-slate-200 text-slate-400" : "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90"}`}
              >
                Continuar con mis datos
                <span translate="no" className={`material-symbols-outlined transition-transform ${cartRows.length > 0 ? "group-hover:translate-x-1" : ""}`}>arrow_forward</span>
              </button>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4 grayscale opacity-50">
              <span translate="no" className="material-symbols-outlined">payments</span>
              <span translate="no" className="material-symbols-outlined">credit_card</span>
              <span translate="no" className="material-symbols-outlined">account_balance_wallet</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPanel;
