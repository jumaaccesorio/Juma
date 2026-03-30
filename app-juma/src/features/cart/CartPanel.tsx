import type { Product } from "../../types";
import { getProductDisplayName } from "../../lib/productLabel";
import { getProductImage } from "../../lib/productImages";

type CartRow = { product: Product; quantity: number; subtotal: number };
type OrderConfirmation = { orderId: number; customerName?: string };

type CartPanelProps = {
  cartRows: CartRow[];
  cartItemsCount: number;
  cartTotal: number;
  orderConfirmation: OrderConfirmation | null;
  onUpdateCartQuantity: (productId: number, quantity: number) => void;
  onRemoveFromCart: (productId: number) => void;
  onClearCart: () => void;
  onCheckoutClick: () => void;
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
  onCheckoutClick,
  onBackToCatalog,
}: CartPanelProps) {
  if (orderConfirmation) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-12 md:px-20">
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-subtle">
          <div className="border-b border-line bg-secondary/65 px-8 py-8 text-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/25 text-[#647554]">
              <span className="material-symbols-outlined text-3xl">check</span>
            </span>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.28em] text-muted">Pedido confirmado</p>
            <h1 className="mt-3 font-serif text-4xl text-ink">Gracias por tu compra</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
              {orderConfirmation.customerName ? `${orderConfirmation.customerName}, ` : ""}
              recibimos tu pedido y en breve nos comunicaremos para darte mas informacion sobre el estado, medios de pago y coordinacion de entrega.
            </p>
          </div>

          <div className="grid gap-6 px-8 py-8 md:grid-cols-2">
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
                Seguir viendo productos
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10 md:px-20">
      <div className="mb-10">
        <h1 className="font-serif text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100">Tu Carrito</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Revisa tus selecciones cuidadosamente antes de finalizar tu pedido boutique.</p>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {cartRows.length === 0 ? (
            <div className="rounded-xl border border-primary/5 bg-white p-12 text-center shadow-sm dark:bg-slate-900/50">
              <span className="material-symbols-outlined mb-4 text-6xl text-slate-300">production_quantity_limits</span>
              <p className="font-medium text-slate-500">No hay productos en el carrito.</p>
            </div>
          ) : (
            <>
              {cartRows.map((row) => {
                const isBackorder = row.product.stock < row.quantity;
                const cartImage = getProductImage(row.product, "thumb");

                return (
                  <div key={row.product.id} className="flex flex-col items-center gap-6 rounded-xl border border-primary/5 bg-white p-6 shadow-sm dark:bg-slate-900/50 sm:flex-row">
                    <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                      {cartImage ? (
                        <img
                          className="h-full w-full object-cover"
                          alt={getProductDisplayName(row.product)}
                          src={cartImage}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-4xl text-slate-300">image</span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between self-stretch">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{getProductDisplayName(row.product)}</h3>
                          <p className="text-sm text-slate-500">
                            {row.product.categoryName || "Sin categoria"} • {row.product.stock > 0 ? `${row.product.stock} disp.` : "Sin stock inmediato"}
                          </p>
                          {isBackorder ? (
                            <p className="mt-2 inline-flex items-center rounded-full bg-warning/25 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a6d48]">
                              Pedido por encargo
                            </p>
                          ) : null}
                        </div>
                        <p className="text-lg font-bold text-primary">${row.subtotal.toLocaleString("es-AR")}</p>
                      </div>
                      <div className="mt-4 flex items-center justify-between sm:mt-0">
                        <div className="flex items-center gap-3 rounded-lg border border-primary/10 bg-background p-1 dark:bg-slate-800">
                          <button
                            onClick={() => onUpdateCartQuantity(row.product.id, row.quantity - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-primary/10"
                          >
                            <span className="material-symbols-outlined text-lg">remove</span>
                          </button>
                          <span className="w-8 text-center font-bold text-slate-900 dark:text-slate-100">{row.quantity}</span>
                          <button
                            onClick={() => onUpdateCartQuantity(row.product.id, row.quantity + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-primary/10"
                          >
                            <span className="material-symbols-outlined text-lg">add</span>
                          </button>
                        </div>
                        <button
                          onClick={() => onRemoveFromCart(row.product.id)}
                          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:text-red-500"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end pt-4">
                <button onClick={onClearCart} className="flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-primary">
                  <span className="material-symbols-outlined text-lg">delete_sweep</span> Vaciar Carrito
                </button>
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-28 rounded-xl border-2 border-primary/10 bg-white p-8 shadow-xl shadow-primary/5 dark:bg-slate-900/50">
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
                    <span className="material-symbols-outlined text-sm">local_shipping</span> Gratis
                  </span>
                ) : (
                  <span className="cursor-help font-medium text-slate-900 dark:text-slate-100" title="Envio gratis desde $50.000">A calcular</span>
                )}
              </div>

              <div className="flex items-end justify-between border-t border-primary/5 pt-4">
                <span className="text-lg font-bold uppercase tracking-tighter text-slate-900 dark:text-slate-100">Total</span>
                <span className="text-3xl font-black text-primary">${cartTotal.toLocaleString("es-AR")}</span>
              </div>
            </div>

            <div className="mb-5 rounded-xl border border-warning/40 bg-warning/15 px-4 py-3 text-sm text-[#8a6140]">
              Si algun producto esta sin stock inmediato, igual podes pedirlo y te confirmaremos la reposicion por WhatsApp o email.
            </div>

            <div className="space-y-3">
              <button
                disabled={cartRows.length === 0}
                onClick={onCheckoutClick}
                className={`group flex w-full items-center justify-center gap-2 rounded-md px-6 py-4 font-bold transition-all ${cartRows.length === 0 ? "cursor-not-allowed bg-slate-200 text-slate-400" : "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90"}`}
              >
                Finalizar Compra
                <span className={`material-symbols-outlined transition-transform ${cartRows.length > 0 ? "group-hover:translate-x-1" : ""}`}>arrow_forward</span>
              </button>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4 grayscale opacity-50">
              <span className="material-symbols-outlined">payments</span>
              <span className="material-symbols-outlined">credit_card</span>
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPanel;
