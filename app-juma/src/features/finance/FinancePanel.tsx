import { useMemo, useState } from "react";

type FinanceMonthOption = {
  key: string;
  label: string;
};

type FinanceDayPoint = {
  day: number;
  label: string;
  income: number;
  expense: number;
  salesCount: number;
};

type FinanceMonthSummary = {
  key: string;
  label: string;
  incomeMonth: number;
  expenseMonth: number;
  salesCountMonth: number;
  balanceMonth: number;
  averageTicket: number;
  bestDayLabel: string;
  bestDayIncome: number;
  dailyBreakdown: FinanceDayPoint[];
  chartMax: number;
};

type FinanceView = {
  months: FinanceMonthOption[];
  selectedMonthKey: string;
  monthlySummaries: FinanceMonthSummary[];
  totalInvestment: number;
  totalAccessoriesPrice: number;
};

type FinancePanelProps = {
  finance: FinanceView;
};

function FinancePanel({ finance }: FinancePanelProps) {
  const [selectedMonthKey, setSelectedMonthKey] = useState(finance.selectedMonthKey);

  const visibleFinance = useMemo(
    () => finance.monthlySummaries.find((summary) => summary.key === selectedMonthKey) ?? finance.monthlySummaries[0],
    [finance.monthlySummaries, selectedMonthKey],
  );

  return (
    <div className="flex-1 min-h-screen space-y-8 bg-secondary p-4 dark:bg-carbon md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">Admin Finanzas</h2>
          <p className="mt-1 text-slate-500">Monitorea tus ventas, inversiones y ganancias.</p>
        </div>
        <div className="w-full max-w-xs">
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Filtrar por mes</label>
          <select
            value={selectedMonthKey}
            onChange={(event) => setSelectedMonthKey(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            {finance.months.map((month) => (
              <option key={month.key} value={month.key}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-neutral-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-lg bg-green-50 p-3 text-green-600 dark:bg-green-900/20">
            <span className="material-symbols-outlined text-3xl">payments</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Ingreso del mes</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">${visibleFinance.incomeMonth.toLocaleString("es-AR")}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-neutral-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-lg bg-red-50 p-3 text-red-600 dark:bg-red-900/20">
            <span className="material-symbols-outlined text-3xl">trending_down</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Egreso del mes</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">${visibleFinance.expenseMonth.toLocaleString("es-AR")}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-neutral-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/20">
            <span className="material-symbols-outlined text-3xl">receipt_long</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Cantidad de ventas</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{visibleFinance.salesCountMonth}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-neutral-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-lg bg-amber-50 p-3 text-amber-600 dark:bg-amber-900/20">
            <span className="material-symbols-outlined text-3xl">account_balance</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Balance del mes</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">${visibleFinance.balanceMonth.toLocaleString("es-AR")}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-soft bg-white p-4 shadow-sm md:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8 flex flex-col gap-4 border-b border-neutral-soft pb-4 dark:border-slate-800 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Grafico mensual</h3>
            <p className="mt-1 text-sm text-slate-500">Ingreso, egreso y cantidad de ventas por dia del mes.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest">
            <span className="rounded-full bg-green-50 px-3 py-1 text-green-600">Ingresos</span>
            <span className="rounded-full bg-red-50 px-3 py-1 text-red-600">Egresos</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">Ventas</span>
          </div>
        </div>

        <div className="w-full overflow-x-auto pb-4">
          <div className="flex min-w-[640px] items-end gap-3 md:min-w-[960px]">
            {visibleFinance.dailyBreakdown.map((row) => {
              const incomeHeight = visibleFinance.chartMax > 0 ? Math.max(4, (row.income / visibleFinance.chartMax) * 100) : 4;
              const expenseHeight = visibleFinance.chartMax > 0 ? Math.max(4, (row.expense / visibleFinance.chartMax) * 100) : 4;

              return (
                <div key={row.day} className="group relative flex min-w-[32px] flex-1 flex-col items-center justify-end">
                  <div className="mb-2 flex h-64 w-full items-end gap-1">
                    <div className="relative flex-1">
                      <div className="w-full rounded-t-sm bg-green-400/85 transition-all duration-500 group-hover:bg-green-500" style={{ height: `${incomeHeight}%` }} />
                    </div>
                    <div className="relative flex-1">
                      <div className="w-full rounded-t-sm bg-red-300 transition-all duration-500 group-hover:bg-red-400" style={{ height: `${expenseHeight}%` }} />
                    </div>
                  </div>
                  <div className="mb-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                    {row.salesCount} vtas
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{row.day}</span>
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-3 -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-xs font-bold whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
                    Ing. ${row.income.toLocaleString("es-AR")} · Egr. ${row.expense.toLocaleString("es-AR")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="rounded-xl border border-neutral-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500">Resumen de ventas</p>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-500">Ticket promedio</span>
              <span className="text-base font-bold text-slate-900">${visibleFinance.averageTicket.toLocaleString("es-AR")}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-500">Mejor dia</span>
              <span className="text-base font-bold text-slate-900">{visibleFinance.bestDayLabel}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-500">Ingreso mejor dia</span>
              <span className="text-base font-bold text-slate-900">${visibleFinance.bestDayIncome.toLocaleString("es-AR")}</span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-neutral-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500">Inversion total vigente</p>
          <p className="mt-4 text-3xl font-black text-slate-900 dark:text-white">${finance.totalInvestment.toLocaleString("es-AR")}</p>
          <p className="mt-2 text-sm text-slate-500">Costo estimado del stock disponible actualmente.</p>
        </div>
        <div className="rounded-xl border border-neutral-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500">Valor stock (venta)</p>
          <p className="mt-4 text-3xl font-black text-slate-900 dark:text-white">${finance.totalAccessoriesPrice.toLocaleString("es-AR")}</p>
          <p className="mt-2 text-sm text-slate-500">Valor potencial del inventario al precio de venta.</p>
        </div>
      </div>
    </div>
  );
}

export default FinancePanel;
