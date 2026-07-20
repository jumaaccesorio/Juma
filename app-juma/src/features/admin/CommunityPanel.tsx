import { useState } from "react";
import type { CommunitySubscriber } from "../../types";

type CommunityPanelProps = {
  subscribers: CommunitySubscriber[];
  onDeleteSubscriber: (id: number) => void;
};

export default function CommunityPanel({ subscribers, onDeleteSubscriber }: CommunityPanelProps) {
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filtered = query.trim()
    ? subscribers.filter((s) => s.email.toLowerCase().includes(query.trim().toLowerCase()))
    : subscribers;

  const copyEmail = async (email: string, id: number) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* fallback */
    }
  };

  const copyAllEmails = async () => {
    const emails = filtered.map((s) => s.email).join(", ");
    try {
      await navigator.clipboard.writeText(emails);
      setCopiedId(-1);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* fallback */
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 space-y-6 px-4 pb-12 pt-20 sm:px-6 lg:px-10 lg:pt-24">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-headline text-2xl font-extrabold text-slate-900 lg:text-3xl">Comunidad y Novedades</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Emails de suscriptores registrados desde el catálogo online.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={copyAllEmails}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[18px]">content_copy</span>
            {copiedId === -1 ? "¡Copiados!" : "Copiar todos los emails"}
          </button>
        </div>
      </div>

      {/* ── METRICS CARDS ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 shrink-0">
            <span className="material-symbols-outlined text-xl">group</span>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Total Suscriptores</span>
            <p className="font-headline text-2xl font-extrabold text-slate-900 leading-none mt-1">{subscribers.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <span className="material-symbols-outlined text-xl">calendar_today</span>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Últimos 7 días</span>
            <p className="font-headline text-2xl font-extrabold text-blue-600 leading-none mt-1">
              {subscribers.filter((s) => {
                const d = new Date(s.createdAt).getTime();
                return !Number.isNaN(d) && d >= Date.now() - 7 * 24 * 60 * 60 * 1000;
              }).length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <span className="material-symbols-outlined text-xl">mail</span>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Filtrados</span>
            <p className="font-headline text-2xl font-extrabold text-emerald-600 leading-none mt-1">{filtered.length}</p>
          </div>
        </div>
      </div>

      {/* ── DIRECTORY TABLE ── */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-headline text-lg font-bold text-slate-900">Lista de Suscriptores</h2>
            <p className="text-xs text-slate-400">Suscriptores activos interesados en promociones y novedades.</p>
          </div>

          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:border-primary shadow-2xs"
              placeholder="Buscar por email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Fecha de Suscripción</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-extrabold uppercase text-xs">
                        {sub.email.slice(0, 2)}
                      </div>
                      <span className="font-bold text-slate-900">{sub.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 font-medium">
                    {new Date(sub.createdAt).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyEmail(sub.email, sub.id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all"
                      >
                        <span className="material-symbols-outlined text-[16px]">{copiedId === sub.id ? "check" : "content_copy"}</span>
                        {copiedId === sub.id ? "Copiado" : "Copiar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSubscriber(sub.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Eliminar suscriptor"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-10 text-center text-slate-400 font-semibold">
                    No hay suscriptores registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
