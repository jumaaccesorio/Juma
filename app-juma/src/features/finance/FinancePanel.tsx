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

type FinanceView = {
  months: FinanceMonthOption[];
  selectedMonthKey: string;
  monthlySummaries: {
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
  }[];
  totalInvestment: number;
  totalAccessoriesPrice: number;
};

type FinancePanelProps = {
  finance: FinanceView;
};

function FinancePanel({ finance }: FinancePanelProps) {
  const [selectedMonthKey, setSelectedMonthKey] = useState(finance.selectedMonthKey);

  const activeMonth = useMemo(
    () => finance.months.find((month) => month.key === selectedMonthKey) ?? finance.months[0],
    [finance.months, selectedMonthKey],
  );

  const visibleFinance = useMemo(
    () =>
      finance.monthlySummaries.find((summary) => summary.key === activeMonth?.key) ??
      finance.monthlySummaries[0],
    [activeMonth?.key, finance.monthlySummaries],
  );

  return (
    <div className="min-h-screen space-y-8 bg-secondary px-0 py-6 dark:bg-carbon md:space-y-10 md:py-10">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary/70">Panel Financiero</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
            Finanzas claras, sin salir del admin
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500 md:text-base">
            Revisa ingresos, egresos, volumen de ventas y el resumen del mes seleccionado desde una sola vista.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-slate-900 sm:w-auto sm:min-w-[280px]">
          <label className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Filtrar por mes</label>
          <select
            value={activeMonth?.key}
            onChange={(event) => setSelectedMonthKey(event.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 dark:border-stone-700 dark:bg-stone-950 dark:text-slate-100"
          >
            {finance.months.map((month) => (
              <option key={month.key} value={month.key}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-900/40 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-500">Ingreso del mes</p>
          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">${visibleFinance.incomeMonth.toLocaleString("es-AR")}</p>
          <p className="mt-2 text-sm text-slate-500">Ventas cerradas durante el mes filtrado.</p>
        </article>
        <article className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm dark:border-rose-900/40 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-500">Egreso del mes</p>
          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">${visibleFinance.expenseMonth.toLocaleString("es-AR")}</p>
          <p className="mt-2 text-sm text-slate-500">Costo de ventas y stock cargado ese mes.</p>
        </article>
        <article className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm dark:border-amber-900/40 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-600">Cantidad de ventas</p>
          <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white">{visibleFinance.salesCountMonth}</p>
          <p className="mt-2 text-sm text-slate-500">Pedidos marcados como realizados.</p>
        </article>
        <article className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm dark:border-sky-900/40 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-600">Balance del mes</p>
          <p className={`mt-3 text-3xl font-black ${visibleFinance.balanceMonth >= 0 ? "text-slate-900 dark:text-white" : "text-rose-600"}`}>
            ${visibleFinance.balanceMonth.toLocaleString("es-AR")}
          </p>
          <p className="mt-2 text-sm text-slate-500">Ingreso menos egreso para el periodo seleccionado.</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <article className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 border-b border-stone-100 px-5 py-5 dark:border-stone-800 md:flex-row md:items-end md:justify-between md:px-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Grafico diario del mes</h3>
              <p className="mt-1 text-sm text-slate-500">
                Barras verdes: ingresos. Barras rojas: egresos. Chips: cantidad de ventas.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">Ingresos</span>
              <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-600">Egresos</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">Ventas</span>
            </div>
          </div>

          <div className="overflow-x-auto px-4 pb-6 pt-5 md:px-6">
            <div className="flex min-w-[920px] items-end gap-3">
              {visibleFinance.dailyBreakdown.map((row) => {
                const incomeHeight = Math.max(6, (row.income / visibleFinance.chartMax) * 220 || 6);
                const expenseHeight = Math.max(6, (row.expense / visibleFinance.chartMax) * 220 || 6);

                return (
                  <div key={row.day} className="flex flex-1 min-w-[42px] flex-col items-center gap-3">
                    <div className="flex h-[260px] w-full items-end justify-center gap-1">
                      <div className="group relative flex w-1/2 items-end justify-center">
                        <div
                          className="w-full rounded-t-md bg-emerald-400 transition-all duration-300 group-hover:bg-emerald-500"
                          style={{ height: `${incomeHeight}px` }}
                        />
                        <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                          ${row.income.toLocaleString("es-AR")}
                        </div>
                      </div>
                      <div className="group relative flex w-1/2 items-end justify-center">
                        <div
                          className="w-full rounded-t-md bg-rose-300 transition-all duration-300 group-hover:bg-rose-400"
                          style={{ height: `${expenseHeight}px` }}
                        />
                        <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                          ${row.expense.toLocaleString("es-AR")}
                        </div>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                      {row.salesCount} venta{row.salesCount === 1 ? "" : "s"}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{row.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </article>

        <div className="grid grid-cols-1 gap-6">
          <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Resumen de ventas</h3>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 dark:bg-stone-950">
                <span className="text-sm text-slate-500">Ticket promedio</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">${visibleFinance.averageTicket.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 dark:bg-stone-950">
                <span className="text-sm text-slate-500">Mejor dia del mes</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">{visibleFinance.bestDayLabel}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 dark:bg-stone-950">
                <span className="text-sm text-slate-500">Ingreso mejor dia</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">${visibleFinance.bestDayIncome.toLocaleString("es-AR")}</span>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Estado actual del stock</h3>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-stone-100 p-4 dark:border-stone-800">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Inversion total vigente</p>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">${visibleFinance.totalInvestment.toLocaleString("es-AR")}</p>
              </div>
              <div className="rounded-2xl border border-stone-100 p-4 dark:border-stone-800">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Valor de venta del stock</p>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">${visibleFinance.totalAccessoriesPrice.toLocaleString("es-AR")}</p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

export default FinancePanel;
