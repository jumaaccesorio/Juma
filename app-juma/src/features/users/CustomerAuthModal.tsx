import React, { useState } from "react";
import { api } from "../../lib/api";
import type { Client } from "../../types";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

type CustomerAuthModalProps = {
  onClose: () => void;
  onSuccess: (client: Client) => void;
  initialTab?: "login" | "register";
  allowGuest?: boolean;
  onGuestContinue?: (guestData: { name: string; email: string; phone: string }) => void;
};

function GoogleLogo(): React.ReactElement {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.43l-3.24-2.53c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.13H3.06v2.61A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.87A6.02 6.02 0 0 1 6.08 12c0-.65.11-1.28.32-1.87V7.52H3.06A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.48l3.34-2.61Z" />
      <path fill="#EA4335" d="M12 6c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.94 5.52l3.34 2.61C7.19 7.76 9.4 6 12 6Z" />
    </svg>
  );
}

export default function CustomerAuthModal({ onClose, onSuccess, initialTab = "login", allowGuest, onGuestContinue }: CustomerAuthModalProps): React.ReactElement {
  useBodyScrollLock(true);

  const [tab, setTab] = useState<"login" | "register" | "guest" | "forgot">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      if (tab === "login") {
        const client = await api.signInClient(email, password);
        onSuccess(client);
      } else if (tab === "register") {
        if (!name.trim() || !phone.trim() || !email.trim() || !password.trim()) {
           throw new Error("Por favor completa todos los campos.");
        }
        if (password !== passwordConfirmation) {
          throw new Error("Las contraseñas no coinciden.");
        }
        await api.signUpClient(email, password, name, phone);
        setSuccessMessage("Te enviamos un correo para activar tu cuenta. Revisá tu email antes de ingresar.");
        setPassword("");
        setPasswordConfirmation("");
        setTab("login");
      } else if (tab === "forgot") {
        if (!email.trim()) {
          throw new Error("Ingresa tu correo para enviarte el restablecimiento.");
        }
        await api.requestClientPasswordReset(email.trim());
        setSuccessMessage("Te enviamos un correo para restablecer tu cuenta. Revisa tu email.");
      } else if (tab === "guest" && onGuestContinue) {
        if (!name.trim() || !phone.trim() || !email.trim()) {
           throw new Error("Por favor completa tus datos básicos de facturación.");
        }
        onGuestContinue({ name, email, phone });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ocurrió un error en la autenticación.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      await api.signInClientWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos iniciar sesión con Google.");
      setLoading(false);
    }
  };

  const isExpandedForm = tab === "register" || tab === "guest";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-carbon/80 p-3 sm:p-5">
      <div className={`mobile-modal relative max-h-[calc(100dvh-1.5rem)] w-full max-w-[440px] overflow-y-auto rounded-[28px] border border-white/70 bg-white px-5 shadow-[0_28px_80px_rgba(16,24,40,0.28)] sm:max-h-[calc(100dvh-2.5rem)] sm:px-8 ${isExpandedForm ? "pb-5 pt-6 sm:pb-6 sm:pt-6" : "pb-6 pt-7 sm:pb-8 sm:pt-9"}`}>
        <button 
          type="button"
          aria-label="Cerrar"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary"
          onClick={onClose}
        >
          <span translate="no" className="material-symbols-outlined text-[22px]">close</span>
        </button>

        <div className={`${isExpandedForm ? "mb-4" : "mb-6"} text-center`}>
          <p className={`${isExpandedForm ? "mb-1" : "mb-2"} text-[10px] font-bold uppercase tracking-[0.28em] text-primary/70`}>Juma Accessory</p>
          <h3 className="px-8 font-serif text-[28px] font-light leading-tight text-slate-800 sm:text-[32px]">
            {tab === "login" ? "Bienvenida de nuevo" : tab === "register" ? "Crea una cuenta" : tab === "forgot" ? "Recupera tu acceso" : "Compra como invitado"}
          </h3>
          <p className={`mx-auto max-w-xs text-sm text-slate-500 ${isExpandedForm ? "mt-1 leading-4" : "mt-2 leading-5"}`}>
            {tab === "login" ? "Ingresa para guardar favoritos y revisar tus pedidos." : tab === "register" ? "Compra más rápido y lleva el control de tus pedidos." : tab === "forgot" ? "Te enviaremos un enlace seguro a tu correo." : "Completa tus datos para finalizar el pedido."}
          </p>
        </div>

        {tab !== "forgot" ? (
        <div className={`mx-auto grid w-full ${isExpandedForm ? "mb-4" : "mb-6"} ${allowGuest ? "grid-cols-3" : "grid-cols-2"} rounded-xl bg-slate-100 p-1.5`}>
          <button 
            type="button"
            className={`flex min-h-10 items-center justify-center rounded-lg px-2 text-xs font-bold transition-all sm:text-sm ${tab === "login" ? "bg-white text-primary shadow-sm ring-1 ring-black/[0.03]" : "text-slate-500 hover:text-slate-700"}`}
            onClick={() => setTab("login")}
          >
            Ingresar
          </button>
          <button 
            type="button"
            className={`flex min-h-10 items-center justify-center rounded-lg px-2 text-xs font-bold transition-all sm:text-sm ${tab === "register" ? "bg-white text-primary shadow-sm ring-1 ring-black/[0.03]" : "text-slate-500 hover:text-slate-700"}`}
            onClick={() => setTab("register")}
          >
            Registrarme
          </button>
          {allowGuest && (
            <button 
              type="button"
              className={`flex min-h-10 items-center justify-center rounded-lg px-2 text-xs font-bold transition-all sm:text-sm ${tab === "guest" ? "bg-white text-primary shadow-sm ring-1 ring-black/[0.03]" : "text-slate-500 hover:text-slate-700"}`}
              onClick={() => setTab("guest")}
            >
              Invitado
            </button>
          )}
        </div>
        ) : (
          <div className="mb-6 text-center">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
              onClick={() => {
                setError("");
                setSuccessMessage("");
                setPassword("");
                setTab("login");
              }}
            >
              <span translate="no" className="material-symbols-outlined text-lg">arrow_back</span>
              Volver al inicio de sesión
            </button>
          </div>
        )}

        {(tab === "login" || tab === "register") ? (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="flex min-h-13 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
            >
              <GoogleLogo />
              Continuar con Google
            </button>
            <div className={`${isExpandedForm ? "my-3" : "my-5"} flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400`}>
              <span className="h-px flex-1 bg-slate-200" />
              o usar correo
              <span className="h-px flex-1 bg-slate-200" />
            </div>
          </>
        ) : null}

        <form className={`flex flex-col ${isExpandedForm ? "gap-2.5" : "gap-3.5"}`} onSubmit={handleSubmit}>
          {(tab === "register" || tab === "guest") && (
            <div className="grid gap-2.5 sm:grid-cols-2">
              <label className={`grid ${isExpandedForm ? "gap-1" : "gap-1.5"} text-xs font-bold text-slate-600`}>
                Nombre y apellido
                <input className={`${isExpandedForm ? "min-h-11" : "min-h-12"} w-full rounded-xl border border-slate-200 bg-[#fcfaf8] px-4 text-sm font-normal text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-primary/60 focus:bg-white focus:ring-4 focus:ring-primary/10`} placeholder="Tu nombre completo" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
              </label>
              <label className={`grid ${isExpandedForm ? "gap-1" : "gap-1.5"} text-xs font-bold text-slate-600`}>
                Teléfono
                <input className={`${isExpandedForm ? "min-h-11" : "min-h-12"} w-full rounded-xl border border-slate-200 bg-[#fcfaf8] px-4 text-sm font-normal text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-primary/60 focus:bg-white focus:ring-4 focus:ring-primary/10`} placeholder="Ej. 351 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" required />
              </label>
            </div>
          )}
          
          <label className={`grid ${isExpandedForm ? "gap-1" : "gap-1.5"} text-xs font-bold text-slate-600`}>
            Correo electrónico
            <input className={`${isExpandedForm ? "min-h-11" : "min-h-12"} w-full rounded-xl border border-slate-200 bg-[#fcfaf8] px-4 text-sm font-normal text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-primary/60 focus:bg-white focus:ring-4 focus:ring-primary/10`} type="email" placeholder="nombre@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </label>
          
          {(tab === "login" || tab === "register") && (
            <label className={`grid ${isExpandedForm ? "gap-1" : "gap-1.5"} text-xs font-bold text-slate-600`}>
              Contraseña
              <div className="relative">
                <input className={`${isExpandedForm ? "min-h-11" : "min-h-12"} w-full rounded-xl border border-slate-200 bg-[#fcfaf8] px-4 pr-12 text-sm font-normal text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-primary/60 focus:bg-white focus:ring-4 focus:ring-primary/10`} type={showPassword ? "text" : "password"} placeholder="Tu contraseña" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={tab === "login" ? "current-password" : "new-password"} required />
                <button type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShowPassword(value => !value)} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition-colors hover:text-primary">
                  <span translate="no" className="material-symbols-outlined text-xl">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </label>
          )}

          {tab === "register" && (
            <label className={`grid ${isExpandedForm ? "gap-1" : "gap-1.5"} text-xs font-bold text-slate-600`}>
              Repetir contraseña
              <div className="relative">
                <input
                  className={`${isExpandedForm ? "min-h-11" : "min-h-12"} w-full rounded-xl border border-slate-200 bg-[#fcfaf8] px-4 pr-12 text-sm font-normal text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-primary/60 focus:bg-white focus:ring-4 focus:ring-primary/10`}
                  type={showPasswordConfirmation ? "text" : "password"}
                  placeholder="Escribe nuevamente tu contraseña"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  aria-label={showPasswordConfirmation ? "Ocultar contraseña repetida" : "Mostrar contraseña repetida"}
                  onClick={() => setShowPasswordConfirmation(value => !value)}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400 transition-colors hover:text-primary"
                >
                  <span translate="no" className="material-symbols-outlined text-xl">{showPasswordConfirmation ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </label>
          )}

          {tab === "login" ? (
            <button
              type="button"
              className="self-end text-xs font-bold text-primary hover:underline sm:text-sm"
              onClick={() => {
                setError("");
                setSuccessMessage("");
                setPassword("");
                setTab("forgot");
              }}
            >
              Olvidé mi contraseña
            </button>
          ) : null}

          <button 
            type="submit" 
            disabled={loading}
            className="mt-1 min-h-13 w-full rounded-xl bg-primary px-5 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? "Procesando..." : (tab === "login" ? "Entrar" : tab === "register" ? "Crear Cuenta" : tab === "forgot" ? "Enviar correo" : "Continuar como Invitado")}
          </button>
          
          {error && (
            <p className="text-red-500 text-sm font-bold text-center mt-2">{error}</p>
          )}
          {successMessage && (
            <p className="text-emerald-600 text-sm font-bold text-center mt-2">{successMessage}</p>
          )}

        </form>
      </div>
    </div>
  );
}
