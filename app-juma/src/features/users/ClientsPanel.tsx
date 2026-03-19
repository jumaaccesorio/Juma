import type { FormEvent } from "react";
import type { Client, Order } from "../../types";

type ClientForm = { name: string; phone: string; email: string };

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
  onDeleteClick: (id: number) => void;
  editingClientId: number | null;
  onCancelEdit: () => void;
};

function ClientsPanel({ 
  clientForm, 
  clientStats, 
  onClientFormChange, 
  onAddClient, 
  onEditClick, 
  onDeleteClick, 
  editingClientId, 
  onCancelEdit 
}: ClientsPanelProps) {
  return (
    <div className="flex-1 p-6 md:p-10 space-y-20 bg-secondary dark:bg-carbon min-h-screen">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">Administración de Usuarios</h2>
          <p className="text-slate-500 mt-1">Directorio de usuarios registrados y comportamiento de compra.</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-neutral-soft dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
            <span className="material-symbols-outlined text-3xl">groups</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Usuarios</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{clientStats.length}</p>
          </div>
        </div>
      </div>

      {/* Add Client Form */}
      <form className={`p-8 rounded-xl border shadow-sm transition-all ${editingClientId ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30' : 'bg-white dark:bg-slate-900 border-neutral-soft dark:border-slate-800'}`} onSubmit={onAddClient}>
        <div className="flex items-center justify-between mb-6 border-b border-neutral-soft dark:border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {editingClientId ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
          </h3>
          {editingClientId && (
            <button 
              type="button" 
              onClick={onCancelEdit}
              className="text-amber-700 dark:text-amber-400 text-sm font-bold flex items-center gap-1 hover:underline"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              Cancelar Edición
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Nombre Completo</label>
            <input required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Ej. Nicolas Garcia" value={clientForm.name} onChange={(e) => onClientFormChange({ ...clientForm, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Teléfono</label>
            <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Ej. 11 1234 5678" value={clientForm.phone} onChange={(e) => onClientFormChange({ ...clientForm, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Email (Opcional)</label>
            <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Ej. correo@ejemplo.com" value={clientForm.email} onChange={(e) => onClientFormChange({ ...clientForm, email: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t border-neutral-soft dark:border-slate-800">
          <button type="submit" className={`${editingClientId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary hover:bg-primary/90'} text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-all`}>
            {editingClientId ? 'Actualizar Usuario' : 'Guardar Usuario'}
          </button>
        </div>
      </form>

      {/* Clients Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-neutral-soft dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-soft dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">Directorio</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Cliente</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Contacto</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Pedidos</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Última Compra</th>
                 <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Total Comprado</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-soft dark:divide-slate-800">
              {clientStats.map((row) => (
                <tr key={row.client.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold uppercase text-sm">
                        {row.client.name.substring(0, 2)}
                      </div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{row.client.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex flex-col gap-1">
                      {row.client.phone && <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-slate-400">call</span> {row.client.phone}</span>}
                      {row.client.email && <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-slate-400">mail</span> {row.client.email}</span>}
                      {!row.client.phone && !row.client.email && <span className="text-slate-400 italic">Sin datos</span>}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 text-sm">
                      {row.orders.length}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-500">{row.lastOrderDate === "-" ? "-" : new Date(row.lastOrderDate).toLocaleDateString("es-AR", { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td className="p-4 text-right font-bold text-primary text-base">${row.totalSpent.toLocaleString("es-AR")}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => onEditClick(row.client)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Editar usuario"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button 
                        onClick={() => onDeleteClick(row.client.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar usuario"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {clientStats.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">No se encontraron clientes registrados.</td>
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

