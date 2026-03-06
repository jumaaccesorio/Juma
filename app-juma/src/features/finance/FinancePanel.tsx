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
    <section className="panel">
      <h2>Control financiero</h2>
      <div className="stats-grid">
        <div className="stat"><strong>${finance.investedThisMonth.toLocaleString("es-AR")}</strong><span>Invertido este mes (mayorista)</span></div>
        <div className="stat"><strong>${finance.totalInvestment.toLocaleString("es-AR")}</strong><span>Inversion total actual (mayorista)</span></div>
        <div className="stat"><strong>${finance.totalAccessoriesPrice.toLocaleString("es-AR")}</strong><span>Valor total accesorios (venta)</span></div>
      </div>

      <h3>Ventas por dia del mes</h3>
      <div className="chart">
        {finance.dailySales.map((row) => {
          const height = Math.max(4, Math.round((row.total / finance.maxSale) * 140));
          return (
            <div key={row.day} className="bar-col" title={`Dia ${row.day}: $${row.total.toLocaleString("es-AR")}`}>
              <div className="bar" style={{ height: `${height}px` }} />
              <span>{row.day}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default FinancePanel;

