type AuthConfirmPanelProps = {
  status: "loading" | "success" | "error";
  message: string;
  onContinue: () => void;
};

export default function AuthConfirmPanel({ status, message, onContinue }: AuthConfirmPanelProps) {
  return (
    <section className="mx-auto flex min-h-[65vh] w-full max-w-2xl items-center justify-center px-4 py-16">
      <div className="w-full rounded-3xl border border-line bg-white p-8 text-center shadow-xl shadow-black/5 md:p-12">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
          status === "success"
            ? "bg-emerald-50 text-emerald-600"
            : status === "error"
              ? "bg-red-50 text-red-600"
              : "bg-secondary text-primary"
        }`}>
          <span className="material-symbols-outlined text-3xl">
            {status === "success" ? "verified" : status === "error" ? "error" : "mail"}
          </span>
        </div>
        <h1 className="mt-6 font-serif text-4xl text-slate-900">
          {status === "success" ? "Cuenta activada" : status === "error" ? "No pudimos activar la cuenta" : "Confirmando cuenta"}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">{message}</p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-8 rounded-xl bg-primary px-6 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-primary/90"
        >
          Volver a la tienda
        </button>
      </div>
    </section>
  );
}
