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
      /* fallback: do nothing */
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
    <div className="space-y-8 overflow-x-hidden px-4 pb-10 pt-20 sm:px-6 lg:px-10 lg:pb-16 lg:pt-24">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-headline text-2xl text-ink lg:text-3xl">Comunidad</h2>
          <p className="font-body text-sm text-muted mt-1">
            Emails suscriptos desde el catálogo · {subscribers.length} suscriptor{subscribers.length !== 1 ? "es" : ""}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={copyAllEmails}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-line text-ink font-semibold text-xs tracking-wide uppercase rounded-lg hover:border-primary/40 hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
            {copiedId === -1 ? "¡Copiados!" : "Copiar todos"}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/60 text-[18px]">search</span>
        <input
          className="w-full bg-white border border-line rounded-xl pl-11 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          placeholder="Buscar por email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-line/60 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-lg">
            <span className="material-symbols-outlined text-2xl">group</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Suscriptores</p>
            <p className="text-2xl font-black text-slate-900">{subscribers.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-line/60 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <span className="material-symbols-outlined text-2xl">calendar_today</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Esta semana</p>
            <p className="text-2xl font-black text-slate-900">
              {subscribers.filter((s) => {
                const d = new Date(s.createdAt).getTime();
                return !Number.isNaN(d) && d >= Date.now() - 7 * 24 * 60 * 60 * 1000;
              }).length}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-line/60 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <span className="material-symbols-outlined text-2xl">mail</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Filtrados</p>
            <p className="text-2xl font-black text-slate-900">{filtered.length}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-line/60 shadow-sm overflow-hidden">
        {/* Mobile list */}
        <div className="divide-y divide-line/30 lg:hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <span className="material-symbols-outlined text-5xl text-slate-200 mb-3">group_off</span>
              <p className="text-sm font-semibold text-slate-400">No hay suscriptores</p>
              <p className="text-xs text-slate-300 mt-1">Los emails aparecerán aquí cuando los visitantes se suscriban desde el catálogo.</p>
            </div>
          ) : (
            filtered.map((sub) => (
              <div key={sub.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-shrink-0 size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                  {sub.email.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{sub.email}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(sub.createdAt).toLocaleDateString("es-AR", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => copyEmail(sub.email, sub.id)}
                    className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Copiar email"
                  >
                    <span className="material-symbols-outlined text-[16px]">{copiedId === sub.id ? "check" : "content_copy"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSubscriber(sub.id)}
                    className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Eliminar suscriptor"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop table */}
        <table className="hidden lg:table w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-line/40">
              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted/70">Email</th>
              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted/70">Fecha de suscripción</th>
              <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted/70 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/30">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-16 text-center">
                  <span className="material-symbols-outlined text-5xl text-slate-200 mb-3 block">group_off</span>
                  <p className="text-sm font-semibold text-slate-400">No hay suscriptores</p>
                  <p className="text-xs text-slate-300 mt-1">Los emails aparecerán aquí cuando los visitantes se suscriban desde el catálogo.</p>
                </td>
              </tr>
            ) : (
              filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                        {sub.email.slice(0, 2)}
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{sub.email}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 font-medium">
                    {new Date(sub.createdAt).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => copyEmail(sub.email, sub.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-primary/10 hover:text-primary px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">{copiedId === sub.id ? "check" : "content_copy"}</span>
                      {copiedId === sub.id ? "Copiado" : "Copiar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSubscriber(sub.id)}
                      className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
