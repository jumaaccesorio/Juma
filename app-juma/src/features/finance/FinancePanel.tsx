type DailySale = { day: number; total: number };

type FinanceView = {
  investedThisMonth: number;
  totalInvestment: number;
  totalAccessoriesPrice: number;
  dailySales: DailySale[];
  maxSale: number;
};

type FinancePanelProps = {
  finance: FinanceView;
};

function FinancePanel({ finance }: FinancePanelProps) {
  return (
    <div className="flex-1 p-6 md:p-10 space-y-20 bg-secondary dark:bg-carbon min-h-screen">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">Admin Finanzas</h2>
          <p className="text-slate-500 mt-1">Monitorea tus ventas, inversiones y ganancias.</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-neutral-soft dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
            <span className="material-symbols-outlined text-3xl">account_balance</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Invertido este mes</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">${finance.investedThisMonth.toLocaleString("es-AR")}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-neutral-soft dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
            <span className="material-symbols-outlined text-3xl">savings</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Inversión total (costo)</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">${finance.totalInvestment.toLocaleString("es-AR")}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-neutral-soft dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg">
            <span className="material-symbols-outlined text-3xl">price_check</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Valor stock (venta)</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">${finance.totalAccessoriesPrice.toLocaleString("es-AR")}</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-neutral-soft dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8 border-b border-neutral-soft dark:border-slate-800 pb-4">
          Ventas del mes actual
        </h3>
        <div className="flex items-end gap-2 h-64 w-full overflow-x-auto pb-4">
          {finance.dailySales.map((row) => {
            const heightPercentage = finance.maxSale > 0 ? (row.total / finance.maxSale) * 100 : 0;
            // Minimum height of 4% to show days with zero sales as tiny indicators
            const resolvedHeight = Math.max(4, heightPercentage);
            
            return (
              <div 
                key={row.day} 
                className="flex-1 min-w-[30px] flex flex-col items-center justify-end group relative" 
                title={`Dia ${row.day}: $${row.total.toLocaleString("es-AR")}`}
              >
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold py-1 px-2 rounded pointer-events-none transition-opacity whitespace-nowrap z-10">
                  ${row.total.toLocaleString("es-AR")}
                </div>
                
                {/* Bar */}
                <div 
                  className={`w-full rounded-t-sm transition-all duration-500 ease-out ${row.total > 0 ? 'bg-primary/80 group-hover:bg-primary' : 'bg-slate-100 dark:bg-slate-800'}`} 
                  style={{ height: `${resolvedHeight}%` }} 
                />
                
                {/* Label */}
                <span className="text-[10px] font-bold text-slate-400 mt-2">{row.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default FinancePanel;

