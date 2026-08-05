import type { FormEvent } from "react";
import type { Client, Order } from "../../types";

type ClientForm = { name: string; phone: string; email: string; password: string };

type ClientStat = {
  client: Client;
  orders: Order[];
  totalSpent: number;
  lastOrderDate: string;
};

type ClientsPanelProps = {
  clientForm: ClientForm;
  clientStats: ClientStat[];
  onClientFormChange: (next: ClientForm) => void;
  onAddClient: (event: FormEvent<HTMLFormElement>) => void;
  onEditClick: (client: Client) => void;
  onToggleActive: (client: Client) => void;
  onResetPassword: (client: Client) => void;
  editingClientId: number | null;
  onCancelEdit: () => void;
};

function ClientsPanel({ 
  clientForm, 
  clientStats, 
  onClientFormChange, 
  onAddClient, 
  onEditClick, 
  onToggleActive, 
  onResetPassword,
  editingClientId, 
  onCancelEdit 
}: ClientsPanelProps) {
  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 space-y-6 px-4 pb-12 pt-20 sm:px-6 lg:px-10 lg:pt-24">
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-headline text-2xl font-extrabold text-slate-900 lg:text-3xl">Administración de Usuarios</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Directorio de usuarios registrados y comportamiento de compra.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100">
            <span translate="no" className="material-symbols-outlined text-blue-600 text-xl">groups</span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Usuarios</span>
              <span className="font-headline text-lg font-extrabold text-slate-900 leading-none">{clientStats.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ADD / EDIT USER FORM ── */}
      <form 
        className={`rounded-2xl border p-6 shadow-sm transition-all space-y-5 ${
          editingClientId 
            ? 'bg-amber-50/70 border-amber-200' 
            : 'bg-white border-slate-200/80'
        }`} 
        onSubmit={onAddClient}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
          <div>
            <h2 className="font-headline text-lg font-bold text-slate-900">
              {editingClientId ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {editingClientId ? "Modificá los datos del usuario seleccionado." : "Agregá un nuevo cliente para gestionar sus ventas y acceso."}
            </p>
          </div>
          {editingClientId && (
            <button 
              type="button" 
              onClick={onCancelEdit}
              className="text-amber-700 text-xs font-bold flex items-center gap-1 hover:underline bg-white px-3 py-1.5 rounded-lg border border-amber-200 shadow-2xs"
            >
              <span translate="no" className="material-symbols-outlined text-[16px]">close</span>
              Cancelar Edición
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Nombre Completo</label>
            <input 
              required 
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm" 
              placeholder="Ej. Nicolas Garcia" 
              value={clientForm.name} 
              onChange={(e) => onClientFormChange({ ...clientForm, name: e.target.value })} 
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Teléfono</label>
            <input 
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm" 
              placeholder="Ej. 11 1234 5678" 
              value={clientForm.phone} 
              onChange={(e) => onClientFormChange({ ...clientForm, phone: e.target.value })} 
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Email (Opcional)</label>
            <input 
              type="email" 
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm" 
              placeholder="Ej. correo@ejemplo.com" 
              value={clientForm.email} 
              onChange={(e) => onClientFormChange({ ...clientForm, email: e.target.value })} 
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
              {editingClientId ? "Nueva Contraseña" : "Contraseña (Opcional)"}
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
              placeholder={editingClientId ? "Restablecer clave" : "Mínimo 6 caracteres"}
              value={clientForm.password}
              onChange={(e) => onClientFormChange({ ...clientForm, password: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            className={`rounded-xl px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all active:scale-95 ${
              editingClientId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {editingClientId ? 'Actualizar Usuario' : 'Guardar Usuario'}
          </button>
        </div>
      </form>

      {/* ── USERS TABLE DIRECTORY ── */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-headline text-lg font-bold text-slate-900">Directorio de Usuarios</h2>
            <p className="text-xs text-slate-400">Listado completo de clientes registrados en el sistema.</p>
          </div>
          <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {clientStats.length} registrado{clientStats.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Mobile View */}
        <div className="space-y-3 lg:hidden">
          {clientStats.map((row) => (
            <div key={`mobile-${row.client.id}`} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-extrabold text-primary uppercase">
                    {row.client.name.substring(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{row.client.name}</p>
                    <p className="text-xs text-slate-500">{row.orders.length} pedidos realizados</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {row.client.email && (
                    <button onClick={() => onResetPassword(row.client)} className="rounded-lg bg-white border border-slate-200 p-2 text-amber-600 shadow-2xs hover:bg-amber-50" title="Restablecer acceso">
                      <span translate="no" className="material-symbols-outlined text-base">lock_reset</span>
                    </button>
                  )}
                  <button
                    onClick={() => onToggleActive(row.client)}
                    className={`rounded-lg p-2 ${row.client.isActive ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}
                    title={row.client.isActive ? "Desactivar" : "Activar"}
                  >
                    <span translate="no" className="material-symbols-outlined text-base">{row.client.isActive ? "person_off" : "person_check"}</span>
                  </button>
                  <button onClick={() => onEditClick(row.client)} className="rounded-lg bg-white border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
                    <span translate="no" className="material-symbols-outlined text-base">edit</span>
                  </button>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/60 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Email / Login:</span>
                  <span className="font-medium text-slate-800">{row.client.email || "Sin email"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Teléfono:</span>
                  <span className="font-medium text-slate-800">{row.client.phone || "Sin teléfono"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Gastado:</span>
                  <span className="font-mono font-bold text-emerald-600">${row.totalSpent.toLocaleString("es-AR")}</span>
                </div>
              </div>
            </div>
          ))}
          {clientStats.length === 0 && <div className="p-8 text-center text-xs font-semibold text-slate-400">No se encontraron clientes registrados.</div>}
        </div>

        {/* Desktop View Table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Usuario / Email</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3 text-center">Pedidos</th>
                <th className="px-4 py-3">Última Compra</th>
                <th className="px-4 py-3 text-right">Total Comprado</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {clientStats.map((row) => (
                <tr key={row.client.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-extrabold uppercase text-xs">
                        {row.client.name.substring(0, 2)}
                      </div>
                      <span className="font-bold text-slate-900">{row.client.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {row.client.email ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-slate-800">{row.client.email}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${row.client.isActive ? "text-emerald-600" : "text-amber-600"}`}>
                          {row.client.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Sin acceso</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {row.client.phone ? (
                      <span className="flex items-center gap-1"><span translate="no" className="material-symbols-outlined text-[14px] text-slate-400">call</span> {row.client.phone}</span>
                    ) : (
                      <span className="text-slate-400 italic">Sin teléfono</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex items-center justify-center size-7 rounded-xl bg-slate-100 font-bold text-slate-700">
                      {row.orders.length}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 font-medium">
                    {row.lastOrderDate === "-" ? "-" : new Date(row.lastOrderDate).toLocaleDateString("es-AR", { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600">
                    ${row.totalSpent.toLocaleString("es-AR")}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      {row.client.email && (
                        <button 
                          type="button"
                          onClick={() => onResetPassword(row.client)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Restablecer contraseña"
                        >
                          <span translate="no" className="material-symbols-outlined text-lg">lock_reset</span>
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={() => onToggleActive(row.client)}
                        className={`p-1.5 rounded-lg transition-colors ${row.client.isActive ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                        title={row.client.isActive ? "Marcar como inactivo" : "Reactivar usuario"}
                      >
                        <span translate="no" className="material-symbols-outlined text-lg">{row.client.isActive ? "person_off" : "person_check"}</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => onEditClick(row.client)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar usuario"
                      >
                        <span translate="no" className="material-symbols-outlined text-lg">edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {clientStats.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">No se encontraron usuarios registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ClientsPanel;
