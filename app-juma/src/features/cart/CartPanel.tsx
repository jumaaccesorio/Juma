import type { Product } from "../../types";

type CartRow = { product: Product; quantity: number; subtotal: number };

type CartPanelProps = {
  cartRows: CartRow[];
  cartItemsCount: number;
  cartTotal: number;
  onUpdateCartQuantity: (productId: number, quantity: number) => void;
  onRemoveFromCart: (productId: number) => void;
  onClearCart: () => void;
  onCheckoutClick: () => void;
};

function CartPanel({
  cartRows,
  cartItemsCount,
  cartTotal,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onClearCart,
  onCheckoutClick,
}: CartPanelProps) {
  return (
    <div className="max-w-7xl mx-auto w-full px-6 md:px-20 py-10">
      <div className="mb-10">
        <h1 className="font-serif text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Tu Carrito</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Revisa tus selecciones cuidadosamente antes de finalizar tu pedido boutique.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-6">
          {cartRows.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-900/50 rounded-xl border border-primary/5 shadow-sm text-center">
              <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">production_quantity_limits</span>
              <p className="text-slate-500 font-medium">No hay productos en el carrito.</p>
            </div>
          ) : (
            <>
              {cartRows.map((row) => (
                <div key={row.product.id} className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white dark:bg-slate-900/50 rounded-xl border border-primary/5 shadow-sm">
                  <div className="h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center">
                    {row.product.image ? (
                      <img className="h-full w-full object-cover" alt={row.product.name} src={row.product.image} />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-slate-300">image</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between self-stretch">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{row.product.name}</h3>
                        <p className="text-sm text-slate-500">{row.product.category} • {row.product.stock} disp.</p>
                      </div>
                      <p className="text-lg font-bold text-primary">${row.subtotal.toLocaleString("es-AR")}</p>
                    </div>
                    <div className="flex items-center justify-between mt-4 sm:mt-0">
                      <div className="flex items-center gap-3 bg-background dark:bg-slate-800 p-1 rounded-lg border border-primary/10">
                        <button 
                          onClick={() => onUpdateCartQuantity(row.product.id, row.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-primary/10 text-slate-600 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">remove</span>
                        </button>
                        <span className="w-8 text-center font-bold text-slate-900 dark:text-slate-100">{row.quantity}</span>
                        <button 
                          onClick={() => onUpdateCartQuantity(row.product.id, row.quantity + 1)}
                          disabled={row.quantity >= row.product.stock}
                          className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${row.quantity >= row.product.stock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/10 text-slate-600'}`}
                        >
                          <span className="material-symbols-outlined text-lg">add</span>
                        </button>
                      </div>
                      <button 
                        onClick={() => onRemoveFromCart(row.product.id)}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wider"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-end pt-4">
                <button 
                  onClick={onClearCart}
                  className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">delete_sweep</span> Vaciar Carrito
                </button>
              </div>
            </>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900/50 p-8 rounded-xl border-2 border-primary/10 sticky top-28 shadow-xl shadow-primary/5">
            <h2 className="font-serif text-2xl font-black text-slate-900 dark:text-slate-100 mb-6 border-b border-primary/5 pb-4">Resumen</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-slate-500">
                <span className="text-sm">Subtotal ({cartItemsCount} items)</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">${cartTotal.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span className="text-sm">Envío Estándar</span>
                {cartTotal >= 50000 ? (
                  <span className="text-green-600 font-bold uppercase text-xs tracking-widest flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">local_shipping</span> Gratis
                  </span>
                ) : (
                  <span className="font-medium text-slate-900 dark:text-slate-100 cursor-help" title="Envío gratis desde $50.000">A calcular</span>
                )}
              </div>
              
              <div className="pt-4 border-t border-primary/5 flex justify-between items-end">
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tighter">Total</span>
                <span className="text-3xl font-black text-primary">${cartTotal.toLocaleString("es-AR")}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <button 
                disabled={cartRows.length === 0}
                onClick={onCheckoutClick}
                className={`w-full font-bold py-4 px-6 rounded-md transition-all flex items-center justify-center gap-2 group ${cartRows.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20'}`}
              >
                Finalizar Compra
                <span className={`material-symbols-outlined transition-transform ${cartRows.length > 0 ? 'group-hover:translate-x-1' : ''}`}>arrow_forward</span>
              </button>
            </div>
            
            <div className="mt-8 flex flex-wrap gap-4 justify-center grayscale opacity-50">
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

