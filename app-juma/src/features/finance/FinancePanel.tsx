import { useEffect, useMemo, useState } from "react";
import type { PackagingCost } from "../../types";

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
  onAddExpense: (expense: { type: "INGRESO" | "EGRESO"; description: string; detail: string; category: string; amount: number; date: string }) => Promise<void>;
  onDeleteExpense: (expenseId: number) => Promise<void>;
  packagingCosts: PackagingCost[];
  totalPackagingCost: number;
  packagingCostPerOrder: number;
  completedOrdersCount: number;
  onAddPackagingCost: (item: { name: string; unitCost: number; quantity: number }) => Promise<void>;
  onUpdatePackagingCost: (id: number, updates: { name?: string; unitCost?: number; quantity?: number }) => Promise<void>;
  onDeletePackagingCost: (id: number) => Promise<void>;
};

function FinancePanel({
  finance,
  onAddExpense,
  onDeleteExpense,
  packagingCosts,
  totalPackagingCost,
  packagingCostPerOrder,
  completedOrdersCount,
  onAddPackagingCost,
  onUpdatePackagingCost,
  onDeletePackagingCost,
}: FinancePanelProps) {
  const [selectedMonthKey, setSelectedMonthKey] = useState(finance.selectedMonthKey);
  const [viewMode, setViewMode] = useState<"mensual" | "semanal" | "historial" | "reporte" | "packaging">("mensual");
  const [expenseForm, setExpenseForm] = useState({
    type: "EGRESO" as "INGRESO" | "EGRESO",
    description: "",
    detail: "",
    category: "General",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [packagingForm, setPackagingForm] = useState({ name: "", unitCost: "", quantity: "1" });
  const [isSavingPackaging, setIsSavingPackaging] = useState(false);
  const [editingPackagingId, setEditingPackagingId] = useState<number | null>(null);

  const visibleFinance = useMemo(
    () => finance.monthlySummaries.find((summary) => summary.key === selectedMonthKey) ?? finance.monthlySummaries[0],
    [finance.monthlySummaries, selectedMonthKey],
  );

  const historyItems = useMemo(
    () => finance.dailyHistory.filter((item) => item.date.startsWith(selectedMonthKey)),
    [finance.dailyHistory, selectedMonthKey],
  );

  useEffect(() => {
    if (!finance.months.some((month) => month.key === selectedMonthKey)) {
      setSelectedMonthKey(finance.selectedMonthKey);
    }
  }, [finance.months, finance.selectedMonthKey, selectedMonthKey]);



  const weeklyBreakdown = useMemo(() => {
    if (!visibleFinance) {
      return {
        days: [] as FinanceDayPoint[],
        chartMax: 0,
        incomeTotal: 0,
        expenseTotal: 0,
        salesTotal: 0,
      };
    }

    const [selectedYear, selectedMonthValue] = selectedMonthKey.split("-").map(Number);
    const selectedMonthIndex = selectedMonthValue - 1;
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    const anchorDate =
      selectedMonthKey === currentMonthKey
        ? new Date(today.getFullYear(), today.getMonth(), today.getDate())
        : new Date(selectedYear, selectedMonthIndex + 1, 0);

    const weekStartsOnMondayOffset = (anchorDate.getDay() + 6) % 7;
    const weekStart = new Date(anchorDate);
    weekStart.setDate(anchorDate.getDate() - weekStartsOnMondayOffset);

    const recentDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      const isSelectedMonth = date.getFullYear() === selectedYear && date.getMonth() === selectedMonthIndex;
      const dayData = isSelectedMonth ? visibleFinance.dailyBreakdown[date.getDate() - 1] : undefined;
      return {
        day: date.getDate(),
        label: `${date.getDate()}/${date.getMonth() + 1}`,
        income: dayData?.income ?? 0,
        expense: dayData?.expense ?? 0,
        salesCount: dayData?.salesCount ?? 0,
      };
    });

    const chartMax = recentDays.reduce((max, day) => Math.max(max, day.income, day.expense), 0);
    return {
      days: recentDays,
      chartMax,
      incomeTotal: recentDays.reduce((total, day) => total + day.income, 0),
      expenseTotal: recentDays.reduce((total, day) => total + day.expense, 0),
      salesTotal: recentDays.reduce((total, day) => total + day.salesCount, 0),
    };
  }, [selectedMonthKey, visibleFinance]);

  const handleSubmitExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(expenseForm.amount);
    if (!expenseForm.description.trim() || !expenseForm.date || Number.isNaN(amount) || amount <= 0) return;

    setIsSavingExpense(true);
    try {
      await onAddExpense({
        type: expenseForm.type,
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

  const handleSubmitPackaging = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const unitCost = Number(packagingForm.unitCost);
    const quantity = Number(packagingForm.quantity);
    if (!packagingForm.name.trim() || Number.isNaN(unitCost) || unitCost <= 0 || Number.isNaN(quantity) || quantity <= 0) return;

    setIsSavingPackaging(true);
    try {
      if (editingPackagingId) {
        await onUpdatePackagingCost(editingPackagingId, {
          name: packagingForm.name.trim(),
          unitCost,
          quantity,
        });
        setEditingPackagingId(null);
      } else {
        await onAddPackagingCost({
          name: packagingForm.name.trim(),
          unitCost,
          quantity,
        });
      }
      setPackagingForm({ name: "", unitCost: "", quantity: "1" });
    } finally {
      setIsSavingPackaging(false);
    }
  };

  const startEditPackaging = (item: PackagingCost) => {
    setEditingPackagingId(item.id);
    setPackagingForm({ name: item.name, unitCost: String(item.unitCost), quantity: String(item.quantity) });
  };

  const cancelEditPackaging = () => {
    setEditingPackagingId(null);
    setPackagingForm({ name: "", unitCost: "", quantity: "1" });
  };

  // Monthly report calculations
  const reportData = useMemo(() => {
    if (!visibleFinance) return null;
    const restockCost = visibleFinance.expenseMonth - visibleFinance.manualExpenseMonth;
    const netProfit = visibleFinance.incomeMonth - restockCost - totalPackagingCost - visibleFinance.manualExpenseMonth;
    return {
      income: visibleFinance.incomeMonth,
      restockCost,
      packagingCost: totalPackagingCost,
      manualExpenses: visibleFinance.manualExpenseMonth,
      netProfit,
      salesCount: visibleFinance.salesCountMonth,
    };
  }, [visibleFinance, totalPackagingCost]);

  const viewTabs = [
    { key: "mensual", label: "Mensual" },
    { key: "semanal", label: "Semanal" },
    { key: "historial", label: "Historial" },
    { key: "reporte", label: "Reporte" },
    { key: "packaging", label: "Packaging" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 space-y-6 px-0 pb-12 pt-20 sm:px-0 lg:px-0 lg:pt-24">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-headline text-xl sm:text-2xl font-extrabold text-slate-900 lg:text-3xl">Admin Finanzas</h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">Monitoreá ventas, egresos manuales y el historial diario.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <div className="relative">
            <select
              value={selectedMonthKey}
              onChange={(event) => setSelectedMonthKey(event.target.value)}
              className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {finance.months.map((month) => (
                <option key={month.key} value={month.key}>
                  🗓️ {month.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/60 overflow-x-auto">
            {viewTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setViewMode(tab.key)}
                className={`rounded-lg px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold capitalize transition-all whitespace-nowrap ${
                  viewMode === tab.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── METRICS CARDS GRID (4 CARDS) ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Income Month */}
        <div className="flex flex-col justify-between rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Ingreso del mes</span>
            <div className="flex size-8 sm:size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <span className="material-symbols-outlined text-base sm:text-xl">payments</span>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="font-headline text-xl sm:text-3xl font-extrabold text-slate-900 leading-none">
              ${visibleFinance.incomeMonth.toLocaleString("es-AR")}
            </p>
            <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-medium text-emerald-600 font-semibold">Total cobrado</p>
          </div>
        </div>

        {/* Expense Month */}
        <div className="flex flex-col justify-between rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Egreso del mes</span>
            <div className="flex size-8 sm:size-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <span className="material-symbols-outlined text-base sm:text-xl">trending_down</span>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="font-headline text-xl sm:text-3xl font-extrabold text-slate-900 leading-none">
              ${visibleFinance.expenseMonth.toLocaleString("es-AR")}
            </p>
            <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-medium text-red-500 font-semibold">Gastos y compras</p>
          </div>
        </div>

        {/* Sales count */}
        <div className="flex flex-col justify-between rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Ventas</span>
            <div className="flex size-8 sm:size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <span className="material-symbols-outlined text-base sm:text-xl">receipt_long</span>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="font-headline text-xl sm:text-3xl font-extrabold text-slate-900 leading-none">
              {visibleFinance.salesCountMonth}
            </p>
            <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-medium text-slate-500">transacciones</p>
          </div>
        </div>

        {/* Balance Month */}
        <div className="flex flex-col justify-between rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-start justify-between">
            <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Balance neto</span>
            <div className="flex size-8 sm:size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <span className="material-symbols-outlined text-base sm:text-xl">account_balance</span>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="font-headline text-xl sm:text-3xl font-extrabold text-slate-900 leading-none">
              ${visibleFinance.balanceMonth.toLocaleString("es-AR")}
            </p>
            <p className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs font-bold text-amber-600">Resultado neto</p>
          </div>
        </div>
      </div>

      {/* ── FORM & STATS ROW ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form: Add Manual Movement */}
        <form onSubmit={handleSubmitExpense} className="rounded-2xl bg-white p-4 sm:p-6 border border-slate-200/80 shadow-sm lg:col-span-7 space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-headline text-base sm:text-lg font-bold text-slate-900">Agregar movimiento manual</h2>
              <p className="text-xs text-slate-400">Registrá ingresos o egresos con detalle.</p>
            </div>
            <span className="rounded-xl bg-red-50 border border-red-100 px-3 py-1.5 text-xs font-bold text-red-600">
              ${visibleFinance.manualExpenseMonth.toLocaleString("es-AR")} manual
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Tipo</label>
              <select
                value={expenseForm.type}
                onChange={(event) => setExpenseForm((prev) => ({ ...prev, type: event.target.value as "INGRESO" | "EGRESO" }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
              >
                <option value="EGRESO">🔴 Egreso (Gasto / Compra)</option>
                <option value="INGRESO">🟢 Ingreso Adicional</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Categoría</label>
              <input
                value={expenseForm.category}
                onChange={(event) => setExpenseForm((prev) => ({ ...prev, category: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                placeholder="Ej. Packaging, Envío, Proveedor"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Descripción</label>
              <input
                value={expenseForm.description}
                onChange={(event) => setExpenseForm((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                placeholder="Ej. Compra de cajas y bolsa de organza"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Monto ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={expenseForm.amount}
                onChange={(event) => setExpenseForm((prev) => ({ ...prev, amount: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Fecha</label>
              <input
                type="date"
                value={expenseForm.date}
                onChange={(event) => setExpenseForm((prev) => ({ ...prev, date: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Detalle (Opcional)</label>
              <textarea
                value={expenseForm.detail}
                onChange={(event) => setExpenseForm((prev) => ({ ...prev, detail: event.target.value }))}
                rows={2}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
                placeholder="Notas, proveedor, número de factura..."
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSavingExpense}
              className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
            >
              {isSavingExpense ? "Guardando..." : `Registrar ${expenseForm.type === "INGRESO" ? "Ingreso" : "Egreso"}`}
            </button>
          </div>
        </form>

        {/* Right Stats & Inventory value */}
        <div className="flex flex-col justify-between space-y-4 lg:col-span-5">
          <div className="rounded-2xl bg-white p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="font-headline text-base sm:text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">Resumen comercial</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 sm:p-3.5 border border-slate-100">
                <span className="text-xs font-medium text-slate-500">Ticket promedio</span>
                <span className="font-mono text-sm font-bold text-slate-900">${visibleFinance.averageTicket.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 sm:p-3.5 border border-slate-100">
                <span className="text-xs font-medium text-slate-500">Mejor día del mes</span>
                <span className="text-xs font-bold text-slate-900">{visibleFinance.bestDayLabel}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 sm:p-3.5 border border-slate-100">
                <span className="text-xs font-medium text-slate-500">Facturado en mejor día</span>
                <span className="font-mono text-sm font-bold text-emerald-600">${visibleFinance.bestDayIncome.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-purple-50 p-3 sm:p-3.5 border border-purple-100">
                <span className="text-xs font-medium text-purple-700">Packaging / pedido</span>
                <span className="font-mono text-sm font-bold text-purple-700">${Math.round(packagingCostPerOrder).toLocaleString("es-AR")}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-sm">
              <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block">Inversión vigente</span>
              <p className="font-headline text-lg sm:text-2xl font-extrabold text-slate-900 mt-2">
                ${finance.totalInvestment.toLocaleString("es-AR")}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 shadow-sm">
              <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block">Valor stock</span>
              <p className="font-headline text-lg sm:text-2xl font-extrabold text-slate-900 mt-2">
                ${finance.totalAccessoriesPrice.toLocaleString("es-AR")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── VIEWS: MENSUAL / SEMANAL / HISTORIAL / REPORTE / PACKAGING ── */}
      {viewMode === "mensual" ? (
        <div className="rounded-2xl bg-white p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-4 md:flex-row md:items-center">
            <div>
              <h2 className="font-headline text-base sm:text-lg font-bold text-slate-900">Gráfico mensual</h2>
              <p className="text-xs text-slate-400">Ingresos vs Egresos por día del mes seleccionado.</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="size-3 rounded-full bg-emerald-500" /> Ingresos
              </span>
              <span className="flex items-center gap-1.5 text-red-500">
                <span className="size-3 rounded-full bg-red-400" /> Egresos
              </span>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="w-full overflow-x-auto pb-2">
            <div className="flex min-w-[700px] items-end gap-2.5 h-64 pt-6">
              {visibleFinance.dailyBreakdown.map((row) => {
                const incomeHeight = visibleFinance.chartMax > 0 ? Math.max(6, (row.income / visibleFinance.chartMax) * 100) : 6;
                const expenseHeight = visibleFinance.chartMax > 0 ? Math.max(6, (row.expense / visibleFinance.chartMax) * 100) : 6;
                return (
                  <div key={row.day} className="group relative flex flex-1 flex-col items-center h-full justify-end">
                    <div className="flex h-full w-full items-end gap-1 px-0.5">
                      <div className="flex-1 h-full flex items-end">
                        <div className="w-full rounded-t-md bg-emerald-500 transition-all group-hover:bg-emerald-600" style={{ height: `${incomeHeight}%` }} />
                      </div>
                      <div className="flex-1 h-full flex items-end">
                        <div className="w-full rounded-t-md bg-red-400 transition-all group-hover:bg-red-500" style={{ height: `${expenseHeight}%` }} />
                      </div>
                    </div>
                    <span className="mt-2 text-[10px] font-bold text-slate-400">{row.day}</span>

                    {/* Tooltip */}
                    <div className="pointer-events-none absolute bottom-full mb-2 hidden rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-bold text-white shadow-lg group-hover:block whitespace-nowrap z-20">
                      Día {row.day}: Ing. ${row.income.toLocaleString("es-AR")} | Egr. ${row.expense.toLocaleString("es-AR")} ({row.salesCount} vtas)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : viewMode === "semanal" ? (
        <div className="rounded-2xl bg-white p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-headline text-base sm:text-lg font-bold text-slate-900">Gráfico semanal</h2>
              <p className="text-xs text-slate-400">Resumen de los últimos 7 días del mes.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7 sm:gap-4">
            {weeklyBreakdown.days.map((row) => (
              <div key={`weekly-${row.day}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{row.label}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500 shadow-2xs">
                    {row.salesCount} vtas
                  </span>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-slate-200/60 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Ingresos:</span>
                    <span className="font-bold text-emerald-600">${row.income.toLocaleString("es-AR")}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-400">Egresos:</span>
                    <span className="font-bold text-red-500">${row.expense.toLocaleString("es-AR")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : viewMode === "reporte" ? (
        /* ── MONTHLY REPORT VIEW ── */
        <div className="rounded-2xl bg-white p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-headline text-base sm:text-lg font-bold text-slate-900">Reporte Mensual</h2>
              <p className="text-xs text-slate-400">Ganancia neta descontando reposición, packaging y gastos manuales.</p>
            </div>
            <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {visibleFinance.label}
            </span>
          </div>

          {reportData && (
            <div className="space-y-4">
              {/* Income */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <span className="material-symbols-outlined text-xl">payments</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Ingresos por ventas</span>
                      <p className="text-[10px] text-emerald-600">{reportData.salesCount} pedidos realizados</p>
                    </div>
                  </div>
                  <span className="font-headline text-xl sm:text-2xl font-extrabold text-emerald-700">
                    +${reportData.income.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>

              {/* Costs breakdown */}
              <div className="space-y-2">
                <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-red-100 text-red-600">
                      <span className="material-symbols-outlined text-lg">inventory</span>
                    </div>
                    <span className="text-xs font-bold text-red-700">Costo de reposición</span>
                  </div>
                  <span className="font-mono text-base sm:text-lg font-bold text-red-600">-${reportData.restockCost.toLocaleString("es-AR")}</span>
                </div>

                <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                      <span className="material-symbols-outlined text-lg">deployed_code</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-purple-700">Costo de packaging</span>
                      <p className="text-[10px] text-purple-500">${Math.round(packagingCostPerOrder).toLocaleString("es-AR")} / pedido</p>
                    </div>
                  </div>
                  <span className="font-mono text-base sm:text-lg font-bold text-purple-600">-${reportData.packagingCost.toLocaleString("es-AR")}</span>
                </div>

                <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                      <span className="material-symbols-outlined text-lg">receipt</span>
                    </div>
                    <span className="text-xs font-bold text-orange-700">Egresos manuales</span>
                  </div>
                  <span className="font-mono text-base sm:text-lg font-bold text-orange-600">-${reportData.manualExpenses.toLocaleString("es-AR")}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t-2 border-dashed border-slate-200" />

              {/* Net Profit */}
              <div className={`rounded-2xl p-5 sm:p-6 border-2 ${reportData.netProfit >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex size-12 items-center justify-center rounded-xl ${reportData.netProfit >= 0 ? 'bg-emerald-200 text-emerald-700' : 'bg-red-200 text-red-700'}`}>
                      <span className="material-symbols-outlined text-2xl">{reportData.netProfit >= 0 ? 'trending_up' : 'trending_down'}</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Ganancia Neta del Mes</span>
                      <p className="text-[10px] text-slate-500">Ingresos − Reposición − Packaging − Egresos</p>
                    </div>
                  </div>
                  <span className={`font-headline text-2xl sm:text-3xl font-extrabold ${reportData.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    ${Math.round(reportData.netProfit).toLocaleString("es-AR")}
                  </span>
                </div>
              </div>

              {/* Visual breakdown bar */}
              {reportData.income > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Distribución del ingreso</span>
                  <div className="h-6 w-full rounded-full overflow-hidden flex bg-slate-100">
                    {reportData.restockCost > 0 && (
                      <div
                        className="bg-red-400 h-full transition-all"
                        style={{ width: `${Math.min(100, (reportData.restockCost / reportData.income) * 100)}%` }}
                        title={`Reposición: ${Math.round((reportData.restockCost / reportData.income) * 100)}%`}
                      />
                    )}
                    {reportData.packagingCost > 0 && (
                      <div
                        className="bg-purple-400 h-full transition-all"
                        style={{ width: `${Math.min(100, (reportData.packagingCost / reportData.income) * 100)}%` }}
                        title={`Packaging: ${Math.round((reportData.packagingCost / reportData.income) * 100)}%`}
                      />
                    )}
                    {reportData.manualExpenses > 0 && (
                      <div
                        className="bg-orange-400 h-full transition-all"
                        style={{ width: `${Math.min(100, (reportData.manualExpenses / reportData.income) * 100)}%` }}
                        title={`Manuales: ${Math.round((reportData.manualExpenses / reportData.income) * 100)}%`}
                      />
                    )}
                    {reportData.netProfit > 0 && (
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{ width: `${Math.min(100, (reportData.netProfit / reportData.income) * 100)}%` }}
                        title={`Ganancia: ${Math.round((reportData.netProfit / reportData.income) * 100)}%`}
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-[10px] font-bold">
                    <span className="flex items-center gap-1.5 text-red-500"><span className="size-2.5 rounded-full bg-red-400" />Repos. {Math.round((reportData.restockCost / reportData.income) * 100)}%</span>
                    <span className="flex items-center gap-1.5 text-purple-500"><span className="size-2.5 rounded-full bg-purple-400" />Pkg. {Math.round((reportData.packagingCost / reportData.income) * 100)}%</span>
                    <span className="flex items-center gap-1.5 text-orange-500"><span className="size-2.5 rounded-full bg-orange-400" />Manual {Math.round((reportData.manualExpenses / reportData.income) * 100)}%</span>
                    <span className="flex items-center gap-1.5 text-emerald-600"><span className="size-2.5 rounded-full bg-emerald-500" />Ganancia {Math.round(Math.max(0, reportData.netProfit) / reportData.income * 100)}%</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : viewMode === "packaging" ? (
        /* ── PACKAGING COSTS VIEW ── */
        <div className="rounded-2xl bg-white p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-headline text-base sm:text-lg font-bold text-slate-900">Costos de Packaging</h2>
              <p className="text-xs text-slate-400">Gestioná los ítems de empaquetado (bolsas, stickers, papel, etc.)</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl bg-purple-50 border border-purple-100 px-3 py-1.5 text-xs font-bold text-purple-700">
                Total: ${totalPackagingCost.toLocaleString("es-AR")}
              </span>
              <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                ${Math.round(packagingCostPerOrder).toLocaleString("es-AR")} / pedido
              </span>
              <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                {completedOrdersCount} pedidos
              </span>
            </div>
          </div>

          {/* Packaging Form */}
          <form onSubmit={handleSubmitPackaging} className="rounded-xl bg-slate-50 border border-slate-200/60 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {editingPackagingId ? "Editar Ítem" : "Agregar Ítem de Packaging"}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <input
                  value={packagingForm.name}
                  onChange={(e) => setPackagingForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-primary shadow-sm"
                  placeholder="Nombre (Ej. Bolsas de organza)"
                />
              </div>
              <div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={packagingForm.unitCost}
                  onChange={(e) => setPackagingForm((prev) => ({ ...prev, unitCost: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-primary shadow-sm"
                  placeholder="Costo ($)"
                />
              </div>
              <div>
                <input
                  type="number"
                  min="1"
                  value={packagingForm.quantity}
                  onChange={(e) => setPackagingForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-primary shadow-sm"
                  placeholder="Cantidad"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSavingPackaging}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50"
              >
                {isSavingPackaging ? "Guardando..." : editingPackagingId ? "Actualizar" : "Agregar"}
              </button>
              {editingPackagingId && (
                <button
                  type="button"
                  onClick={cancelEditPackaging}
                  className="rounded-xl px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {/* Packaging Items List */}
          <div className="space-y-2">
            {packagingCosts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs font-semibold text-slate-400">
                No hay ítems de packaging configurados. Agregá bolsas, stickers, papel, etc.
              </div>
            ) : (
              packagingCosts.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5 transition-all hover:bg-slate-100/60">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 shrink-0">
                    <span className="material-symbols-outlined text-lg">deployed_code</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900">{item.name}</p>
                    <p className="text-[11px] text-slate-500">
                      ${item.unitCost.toLocaleString("es-AR")} × {item.quantity} = <span className="font-bold text-purple-600">${(item.unitCost * item.quantity).toLocaleString("es-AR")}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => startEditPackaging(item)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePackagingCost(item.id)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* ── HISTORY VIEW ── */
        <div className="rounded-2xl bg-white p-4 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-headline text-base sm:text-lg font-bold text-slate-900">Historial diario</h2>
              <p className="text-xs text-slate-400">Movimientos registrados en el mes seleccionado.</p>
            </div>
            <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {historyItems.length} registros
            </span>
          </div>

          <div className="space-y-3">
            {historyItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs font-semibold text-slate-400">
                No hay movimientos registrados para este mes.
              </div>
            ) : (
              historyItems.map((item) => {
                const expenseId = item.id.startsWith("expense-") ? Number(item.id.replace("expense-", "")) : null;
                return (
                  <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5 transition-all hover:bg-slate-100/60 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          item.type === "INGRESO" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        }`}>
                          {item.type}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{item.category}</span>
                      </div>
                      <p className="mt-1.5 font-bold text-slate-900 text-sm truncate">{item.description}</p>
                      {item.detail && <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>}
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <div className="text-right">
                        <p className={`font-mono text-base font-extrabold ${item.type === "INGRESO" ? "text-emerald-600" : "text-red-500"}`}>
                          {item.type === "INGRESO" ? "+" : "-"}${item.amount.toLocaleString("es-AR")}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">{item.date}</p>
                      </div>
                      {expenseId ? (
                        <button
                          type="button"
                          onClick={() => onDeleteExpense(expenseId)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
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
