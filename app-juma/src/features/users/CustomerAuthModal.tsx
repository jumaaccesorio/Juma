import React, { useState } from "react";
import { api } from "../../lib/api";
import type { Client } from "../../types";

type CustomerAuthModalProps = {
  onClose: () => void;
  onSuccess: (client: Client) => void;
  allowGuest?: boolean;
  onGuestContinue?: (guestData: { name: string; email: string; phone: string }) => void;
};

export default function CustomerAuthModal({ onClose, onSuccess, allowGuest, onGuestContinue }: CustomerAuthModalProps): React.ReactElement {
  const [tab, setTab] = useState<"login" | "register" | "guest">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (tab === "login") {
        const client = await api.signInClient(email, password);
        onSuccess(client);
      } else if (tab === "register") {
        if (!name.trim() || !phone.trim() || !email.trim() || !password.trim()) {
           throw new Error("Por favor completa todos los campos.");
        }
        const client = await api.signUpClient(email, password, name, phone);
        onSuccess(client);
      } else if (tab === "guest" && onGuestContinue) {
        if (!name.trim() || !phone.trim() || !email.trim()) {
           throw new Error("Por favor completa tus datos básicos de facturación.");
        }
        onGuestContinue({ name, email, phone });
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error en la autenticación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-carbon/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl relative">
        <button 
          className="absolute top-4 right-4 text-slate-400 hover:text-primary transition-colors"
          onClick={onClose}
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <h3 className="font-serif text-3xl font-light text-slate-800 mb-6 text-center">
          {tab === "login" ? "Ingresa a tu cuenta" : tab === "register" ? "Crea una cuenta" : "Checkout Rápido"}
        </h3>

        <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${tab === "login" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            onClick={() => setTab("login")}
          >
            Ingresar
          </button>
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${tab === "register" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            onClick={() => setTab("register")}
          >
            Registrarme
          </button>
          {allowGuest && (
            <button 
              type="button"
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${tab === "guest" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              onClick={() => setTab("guest")}
            >
              Invitado
            </button>
          )}
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {(tab === "register" || tab === "guest") && (
            <>
              <input
                className="w-full rounded-md border-primary/20 bg-background px-5 py-3 focus:border-primary focus:ring-primary focus:ring-2 outline-none transition-all placeholder:text-slate-400"
                placeholder="Nombre Completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                className="w-full rounded-md border-primary/20 bg-background px-5 py-3 focus:border-primary focus:ring-primary focus:ring-2 outline-none transition-all placeholder:text-slate-400"
                placeholder="Teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </>
          )}
          
          <input
            className="w-full rounded-md border-primary/20 bg-background px-5 py-3 focus:border-primary focus:ring-primary focus:ring-2 outline-none transition-all placeholder:text-slate-400"
            type="email"
            placeholder="Correo Electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          {(tab === "login" || tab === "register") && (
            <input
              className="w-full rounded-md border-primary/20 bg-background px-5 py-3 focus:border-primary focus:ring-primary focus:ring-2 outline-none transition-all placeholder:text-slate-400"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="bg-primary text-white w-full py-4 rounded-md font-bold uppercase tracking-wider hover:bg-primary/90 transition-all transform hover:-translate-y-1 shadow-lg shadow-primary/30 mt-2 disabled:opacity-50"
          >
            {loading ? "Procesando..." : (tab === "login" ? "Entrar" : tab === "register" ? "Crear Cuenta" : "Continuar como Invitado")}
          </button>
          
          {error && (
            <p className="text-red-500 text-sm font-bold text-center mt-2">{error}</p>
          )}

        </form>
      </div>
    </div>
  );
}
