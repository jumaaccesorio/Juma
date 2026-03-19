import type { Client, Product, Order, OrderItem, HeroBanner, FeaturedPanel, Category, Favorite } from '../types';

const BASE = "http://localhost:4000/api";

async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // ── AUTH ──────────────────────────────────────────────────
  async signUpClient(email: string, password: string, name: string, phone: string): Promise<Client> {
    const data = await http<{ client: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, phone, password }),
    });
    return mapClient(data.client);
  },

  async signInClient(email: string, password: string): Promise<Client> {
    const data = await http<{ client: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return mapClient(data.client);
  },

  // ── CATEGORIES ────────────────────────────────────────────
  async getCategories(): Promise<Category[]> {
    const rows = await http<any[]>("/categories");
    return rows.map(mapCategory);
  },

  async addCategory(name: string, parentId?: number | null): Promise<Category> {
    const row = await http<any>("/categories", {
      method: "POST",
      body: JSON.stringify({ name, parentId }),
    });
    return mapCategory(row);
  },

  async deleteCategory(id: number): Promise<void> {
    await http(`/categories/${id}`, { method: "DELETE" });
  },

  // ── CLIENTS ───────────────────────────────────────────────
  async getClients(): Promise<Client[]> {
    const rows = await http<any[]>("/clients");
    return rows.map(mapClient);
  },

  async addClient(client: { name: string; phone: string; email: string }): Promise<Client> {
    const row = await http<any>("/clients", {
      method: "POST",
      body: JSON.stringify(client),
    });
    return mapClient(row);
  },

  async updateClient(id: number, updates: Partial<Client>): Promise<void> {
    await http(`/clients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  async deleteClient(id: number): Promise<void> {
    await http(`/clients/${id}`, {
      method: "DELETE",
    });
  },

  // ── PRODUCTS ──────────────────────────────────────────────
  async getProducts(): Promise<Product[]> {
    const rows = await http<any[]>("/products");
    return rows.map(mapProduct);
  },

  async addProduct(product: Partial<Product>): Promise<Product> {
    const row = await http<any>("/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
    return mapProduct(row);
  },

  async updateProduct(id: number, updates: Partial<Product>): Promise<void> {
    await http(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  async updateStock(id: number, stock: number): Promise<void> {
    await http(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ stock }),
    });
  },

  // ── ORDERS ────────────────────────────────────────────────
  async getOrders(): Promise<Order[]> {
    const rows = await http<any[]>("/orders");
    return rows.map(mapOrder);
  },

  async addOrder(order: {
    clientId?: number;
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
    date: string;
    status: string;
    items: OrderItem[];
  }): Promise<Order> {
    const row = await http<any>("/orders", {
      method: "POST",
      body: JSON.stringify(order),
    });
    return mapOrder(row);
  },

  async updateOrderStatus(id: number, status: string): Promise<void> {
    await http(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  // ── FAVORITES ─────────────────────────────────────────────
  async getFavorites(clientId: number): Promise<Favorite[]> {
    const rows = await http<any[]>(`/favorites/${clientId}`);
    return rows.map(f => ({
      id: f.id,
      clientId: f.client_id,
      productId: f.product_id,
      createdAt: f.created_at,
    }));
  },

  async toggleFavorite(clientId: number, productId: number, isFav: boolean): Promise<void> {
    if (isFav) {
      await http("/favorites", {
        method: "DELETE",
        body: JSON.stringify({ clientId, productId }),
      });
    } else {
      await http("/favorites", {
        method: "POST",
        body: JSON.stringify({ clientId, productId }),
      });
    }
  },

  // ── HERO BANNER ───────────────────────────────────────────
  async getHeroBanner(): Promise<HeroBanner | null> {
    return http<HeroBanner | null>("/hero-banner").catch(() => null);
  },

  // ── FEATURED PANELS ───────────────────────────────────────
  async getFeaturedPanels(): Promise<FeaturedPanel[]> {
    const rows = await http<any[]>("/featured-panels");
    return rows.map(p => ({
      id: String(p.id),
      title: p.title,
      cta: p.cta,
      image: p.image,
      className: p.class_name as FeaturedPanel["className"],
      categoryId: p.category_id ?? null,
    }));
  },

  // ── IMAGE UPLOAD ──────────────────────────────────────────
  async uploadImage(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`http://localhost:4000/api/files`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error("Error subiendo imagen");
    const data = await res.json();
    return data.url as string;
  },
};

// ── MAPPERS ─────────────────────────────────────────────────
function mapClient(c: any): Client {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone ?? "",
    createdAt: c.created_at ?? "",
  };
}

function mapCategory(c: any): Category {
  return {
    id: c.id,
    name: c.name,
    parentId: c.parent_id ?? null,
    createdAt: c.created_at ?? "",
  };
}

function mapProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    categoryId: p.category_id ?? null,
    categoryName: p.category_name ?? undefined,
    isFeatured: Boolean(p.is_featured),
    purchasePrice: p.purchase_price,
    salePrice: p.sale_price,
    stock: p.stock,
    initialStock: p.initial_stock,
    enabled: Boolean(p.enabled),
    image: p.image ?? "",
    sourceUrl: p.source_url ?? "",
    createdAt: p.created_at ?? "",
  };
}

function mapOrder(o: any): Order {
  return {
    id: o.id,
    clientId: o.client_id ?? undefined,
    guestName: o.guest_name ?? undefined,
    guestEmail: o.guest_email ?? undefined,
    guestPhone: o.guest_phone ?? undefined,
    date: o.date,
    status: o.status,
    items: (o.items ?? []).map((i: any) => ({
      productId: i.product_id,
      quantity: i.quantity,
      unitSalePrice: i.unit_sale_price,
      unitPurchasePrice: i.unit_purchase_price,
    })),
  };
}
