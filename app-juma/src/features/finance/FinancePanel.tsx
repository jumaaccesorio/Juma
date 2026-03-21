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
  manualExpenseMonth: number;
};

type FinanceHistoryItem = {
  id: string;
  date: string;
  type: "INGRESO" | "EGRESO";
  description: string;
  detail: string;
  category: string;
  amount: number;
};

type FinanceView = {
  months: FinanceMonthOption[];
  selectedMonthKey: string;
  monthlySummaries: FinanceMonthSummary[];
  totalInvestment: number;
  totalAccessoriesPrice: number;
  dailyHistory: FinanceHistoryItem[];
};

type FinancePanelProps = {
  finance: FinanceView;
  onAddExpense: (expense: { description: string; detail: string; category: string; amount: number; date: string }) => Promise<void>;
  onDeleteExpense: (expenseId: number) => Promise<void>;
};

function FinancePanel({ finance, onAddExpense, onDeleteExpense }: FinancePanelProps) {
  const [selectedMonthKey, setSelectedMonthKey] = useState(finance.selectedMonthKey);
  const [viewMode, setViewMode] = useState<"resumen" | "historial">("resumen");
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    detail: "",
    category: "General",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  const visibleFinance = useMemo(
    () => finance.monthlySummaries.find((summary) => summary.key === selectedMonthKey) ?? finance.monthlySummaries[0],
    [finance.monthlySummaries, selectedMonthKey],
  );

  const historyItems = useMemo(
    () => finance.dailyHistory.filter((item) => item.date.startsWith(selectedMonthKey)),
    [finance.dailyHistory, selectedMonthKey],
  );

  const handleSubmitExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(expenseForm.amount);
    if (!expenseForm.description.trim() || !expenseForm.date || Number.isNaN(amount) || amount <= 0) return;

    setIsSavingExpense(true);
    try {
      await onAddExpense({
        description: expenseForm.description.trim(),
        detail: expenseForm.detail.trim(),
        category: expenseForm.category.trim() || "General",
        amount,
        date: expenseForm.date,
      });
      setExpenseForm((prev) => ({
        ...prev,
        description: "",
        detail: "",
        amount: "",
      }));
    } finally {
      setIsSavingExpense(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen space-y-6 bg-secondary p-4 dark:bg-carbon md:space-y-8 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">Admin Finanzas</h2>
          <p className="mt-1 text-slate-500">Monitorea ventas, egresos manuales y el historial diario.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="w-full">
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
          <div className="w-full">
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Modo de vista</label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-white p-1 shadow-sm dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setViewMode("resumen")}
                className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                  viewMode === "resumen" ? "bg-primary text-white" : "text-slate-500"
                }`}
              >
                Mensual
              </button>
              <button
                type="button"
                onClick={() => setViewMode("historial")}
                className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                  viewMode === "historial" ? "bg-primary text-white" : "text-slate-500"
                }`}
              >
                Historial
              </button>
            </div>
          </div>
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleSubmitExpense} className="rounded-xl border border-neutral-soft bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Agregar egreso</h3>
              <p className="mt-1 text-sm text-slate-500">Registrá gastos manuales con detalle para el historial.</p>
            </div>
            <span className="rounded-full bg-red-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-red-600">
              ${visibleFinance.manualExpenseMonth.toLocaleString("es-AR")} manual
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Descripción</label>
              <input
                value={expenseForm.description}
                onChange={(event) => setExpenseForm((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Ej. Packaging, envio, proveedor"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Categoría</label>
              <input
                value={expenseForm.category}
                onChange={(event) => setExpenseForm((prev) => ({ ...prev, category: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="General"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Monto</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={expenseForm.amount}
                onChange={(event) => setExpenseForm((prev) => ({ ...prev, amount: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Detalle</label>
              <textarea
                value={expenseForm.detail}
                onChange={(event) => setExpenseForm((prev) => ({ ...prev, detail: event.target.value }))}
                className="min-h-24 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Notas, proveedor, motivo del gasto..."
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Fecha</label>
              <input
                type="date"
                value={expenseForm.date}
                onChange={(event) => setExpenseForm((prev) => ({ ...prev, date: event.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSavingExpense}
                className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingExpense ? "Guardando..." : "Guardar egreso"}
              </button>
            </div>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-xl border border-neutral-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500">Resumen de ventas</p>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-500">Ticket promedio</span>
                <span className="text-base font-bold text-slate-900">${visibleFinance.averageTicket.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-500">Mejor día</span>
                <span className="text-base font-bold text-slate-900">{visibleFinance.bestDayLabel}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-500">Ingreso mejor día</span>
                <span className="text-base font-bold text-slate-900">${visibleFinance.bestDayIncome.toLocaleString("es-AR")}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500">Inversión vigente</p>
              <p className="mt-4 text-3xl font-black text-slate-900 dark:text-white">${finance.totalInvestment.toLocaleString("es-AR")}</p>
            </div>
            <div className="rounded-xl border border-neutral-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500">Valor stock</p>
              <p className="mt-4 text-3xl font-black text-slate-900 dark:text-white">${finance.totalAccessoriesPrice.toLocaleString("es-AR")}</p>
            </div>
          </div>
        </div>
      </div>

      {viewMode === "resumen" ? (
        <div className="rounded-xl border border-neutral-soft bg-white p-4 shadow-sm md:p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-8 flex flex-col gap-4 border-b border-neutral-soft pb-4 dark:border-slate-800 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gráfico mensual</h3>
              <p className="mt-1 text-sm text-slate-500">Ingreso y egreso por día dentro del mes seleccionado.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest">
              <span className="rounded-full bg-green-50 px-3 py-1 text-green-600">Ingresos</span>
              <span className="rounded-full bg-red-50 px-3 py-1 text-red-600">Egresos</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">Ventas</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 pb-2 md:hidden">
            {visibleFinance.dailyBreakdown.slice(-7).map((row) => {
              const incomeHeight = visibleFinance.chartMax > 0 ? Math.max(10, (row.income / visibleFinance.chartMax) * 100) : 10;
              const expenseHeight = visibleFinance.chartMax > 0 ? Math.max(10, (row.expense / visibleFinance.chartMax) * 100) : 10;
              return (
                <div key={`mobile-${row.day}`} className="flex min-w-0 flex-col items-center gap-2">
                  <div className="flex h-32 w-full items-end gap-1 rounded-lg bg-slate-50 px-1 py-2">
                    <div className="w-1/2 rounded-t-sm bg-green-400/85" style={{ height: `${incomeHeight}%` }} />
                    <div className="w-1/2 rounded-t-sm bg-red-300" style={{ height: `${expenseHeight}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{row.day}</span>
                  <span className="text-[9px] font-bold text-slate-500">{row.salesCount}</span>
                </div>
              );
            })}
          </div>

          <div className="hidden w-full overflow-x-auto pb-4 md:block">
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
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-3 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                      Ing. ${row.income.toLocaleString("es-AR")} · Egr. ${row.expense.toLocaleString("es-AR")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-soft bg-white p-4 shadow-sm md:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Historial diario</h3>
              <p className="mt-1 text-sm text-slate-500">Ingresos y egresos del mes seleccionado.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {historyItems.length} movimientos
            </span>
          </div>

          <div className="space-y-3">
            {historyItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                No hay movimientos registrados para este mes.
              </div>
            ) : (
              historyItems.map((item) => {
                const expenseId = item.type === "EGRESO" ? Number(item.id.replace("expense-", "")) : null;
                return (
                  <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${item.type === "INGRESO" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {item.type}
                        </span>
                        <span className="text-[11px] font-medium uppercase tracking-widest text-slate-400">{item.category}</span>
                      </div>
                      <p className="mt-2 truncate text-base font-bold text-slate-900">{item.description}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.detail || "Sin detalle adicional"}</p>
                    </div>
                    <div className="flex items-center justify-between gap-4 md:justify-end">
                      <div className="text-right">
                        <p className={`text-lg font-black ${item.type === "INGRESO" ? "text-green-700" : "text-red-700"}`}>
                          {item.type === "INGRESO" ? "+" : "-"}${item.amount.toLocaleString("es-AR")}
                        </p>
                        <p className="text-[11px] uppercase tracking-widest text-slate-400">{new Date(item.date).toLocaleDateString("es-AR")}</p>
                      </div>
                      {expenseId ? (
                        <button
                          type="button"
                          onClick={() => onDeleteExpense(expenseId)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FinancePanel;
