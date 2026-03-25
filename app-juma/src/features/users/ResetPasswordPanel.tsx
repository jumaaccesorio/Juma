import { useState } from "react";

type ResetPasswordPanelProps = {
  onSubmit: (password: string) => Promise<void>;
  onContinue: () => void;
};

export default function ResetPasswordPanel({ onSubmit, onContinue }: ResetPasswordPanelProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password.trim().length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setStatus("loading");
      await onSubmit(password.trim());
      setStatus("success");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No pudimos actualizar tu contraseña.";
      setError(message);
      setStatus("idle");
    }
  };

  return (
    <section className="mx-auto flex min-h-[65vh] w-full max-w-xl items-center justify-center px-4 py-16">
      <div className="w-full rounded-3xl border border-line bg-white p-8 shadow-xl shadow-black/5 md:p-12">
        <h1 className="font-serif text-4xl text-slate-900">Nueva contraseña</h1>
        <p className="mt-3 text-base text-slate-600">
          Elegí una contraseña nueva para volver a ingresar a tu cuenta.
        </p>

        {status === "success" ? (
          <div className="mt-8 rounded-2xl bg-emerald-50 p-5 text-emerald-700">
            <p className="font-bold">Contraseña actualizada correctamente.</p>
            <button
              type="button"
              onClick={onContinue}
              className="mt-4 rounded-xl bg-primary px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-primary/90"
            >
              Ir a ingresar
            </button>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition-all focus:ring-2 focus:ring-primary/20"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 outline-none transition-all focus:ring-2 focus:ring-primary/20"
              placeholder="Repetí la nueva contraseña"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
            {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-xl bg-primary px-5 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {status === "loading" ? "Actualizando..." : "Guardar contraseña"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
