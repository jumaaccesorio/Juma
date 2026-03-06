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
};

function ClientsPanel({ clientForm, clientStats, onClientFormChange, onAddClient }: ClientsPanelProps) {
  return (
    <section className="panel">
      <h2>Registro de clientes</h2>
      <form className="form-grid" onSubmit={onAddClient}>
        <input placeholder="Nombre" value={clientForm.name} onChange={(e) => onClientFormChange({ ...clientForm, name: e.target.value })} />
        <input placeholder="Telefono" value={clientForm.phone} onChange={(e) => onClientFormChange({ ...clientForm, phone: e.target.value })} />
        <input placeholder="Email" value={clientForm.email} onChange={(e) => onClientFormChange({ ...clientForm, email: e.target.value })} />
        <button type="submit">Guardar cliente</button>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Contacto</th>
              <th>Pedidos</th>
              <th>Ultima compra</th>
              <th>Total comprado</th>
            </tr>
          </thead>
          <tbody>
            {clientStats.map((row) => (
              <tr key={row.client.id}>
                <td>{row.client.name}</td>
                <td>{row.client.phone || "-"} {row.client.email ? `| ${row.client.email}` : ""}</td>
                <td>{row.orders.length}</td>
                <td>{row.lastOrderDate}</td>
                <td>${row.totalSpent.toLocaleString("es-AR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default ClientsPanel;

