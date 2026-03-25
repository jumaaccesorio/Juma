import type { Category, Client, Favorite, FeaturedPanel, FinanceExpense, HeroBanner, Order, OrderItem, Product } from "../types";
import { supabase } from "./supabase";
import { dataUrlToOptimizedFile, optimizeImageFile, type UploadImageVariant } from "./imageUpload";

const PRODUCT_IMAGES_BUCKET = "products";
const PRODUCT_PUBLIC_PREFIX = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
const PRODUCT_SIGNED_PREFIX = `/storage/v1/object/sign/${PRODUCT_IMAGES_BUCKET}/`;

function toErrorMessage(error: unknown, fallback = "Ocurrio un error inesperado.") {
  if (error && typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  return fallback;
}

async function getClientByEmailOrAuth(email: string, authId?: string | null) {
  if (authId) {
    const authQuery = await supabase.from("clients").select("*").eq("auth_id", authId).maybeSingle();
    if (authQuery.error) throw authQuery.error;
    if (authQuery.data) return mapClient(authQuery.data);
  }

  const emailQuery = await supabase.from("clients").select("*").eq("email", email).maybeSingle();
  if (emailQuery.error) throw emailQuery.error;
  return emailQuery.data ? mapClient(emailQuery.data) : null;
}

export const api = {
  async signUpClient(email: string, password: string, name: string, phone: string): Promise<Client> {
    const signUp = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        data: {
          name,
          phone,
        },
      },
    });
    if (signUp.error) throw signUp.error;

    const authId = signUp.data.user?.id ?? null;
    const existing = await getClientByEmailOrAuth(email, authId);
    if (existing) return existing;

    const insert = await supabase
      .from("clients")
      .insert({
        auth_id: authId,
        name,
        email,
        phone: phone || "",
      })
      .select("*")
      .single();

    if (insert.error) throw insert.error;
    return mapClient(insert.data);
  },

  async signInClient(email: string, password: string): Promise<Client> {
    const login = await supabase.auth.signInWithPassword({ email, password });
    if (login.error) throw login.error;

    const client = await getClientByEmailOrAuth(email, login.data.user?.id);
    if (!client) throw new Error("No se encontro el perfil del cliente.");
    return client;
  },

  async requestClientPasswordReset(email: string): Promise<void> {
    const reset = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (reset.error) throw reset.error;
  },

  async finalizeCurrentClientFromSession(): Promise<Client> {
    const { data: userResult, error } = await supabase.auth.getUser();
    if (error) throw error;

    const user = userResult.user;
    if (!user || !user.email) {
      throw new Error("No encontramos una sesión válida para confirmar la cuenta.");
    }

    const existing = await getClientByEmailOrAuth(user.email, user.id);
    if (existing) {
      if (!existing.authId || existing.authId !== user.id) {
        await this.updateClient(existing.id, { authId: user.id });
        return { ...existing, authId: user.id };
      }
      return existing;
    }

    const insert = await supabase
      .from("clients")
      .insert({
        auth_id: user.id,
        name: typeof user.user_metadata?.name === "string" ? user.user_metadata.name : user.email,
        email: user.email,
        phone: typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : "",
      })
      .select("*")
      .single();

    if (insert.error) throw insert.error;
    return mapClient(insert.data);
  },

  async updateCurrentUserPassword(password: string): Promise<void> {
    const update = await supabase.auth.updateUser({ password });
    if (update.error) throw update.error;
  },

  async getCategories(): Promise<Category[]> {
    const query = await supabase
      .from("categories")
      .select("id, name, parent_id, created_at")
      .order("name", { ascending: true });
    if (query.error) throw query.error;
    return (query.data ?? []).map(mapCategory);
  },

  async addCategory(name: string, parentId?: number | null): Promise<Category> {
    const query = await supabase
      .from("categories")
      .insert({ name, parent_id: parentId ?? null })
      .select("*")
      .single();
    if (query.error) throw query.error;
    return mapCategory(query.data);
  },

  async updateCategory(id: number, name: string): Promise<Category> {
    const query = await supabase
      .from("categories")
      .update({ name })
      .eq("id", id)
      .select("*")
      .single();
    if (query.error) throw query.error;
    return mapCategory(query.data);
  },

  async deleteCategory(id: number): Promise<void> {
    const query = await supabase.from("categories").delete().eq("id", id);
    if (query.error) throw query.error;
  },

  async getClients(): Promise<Client[]> {
    const query = await supabase
      .from("clients")
      .select("id, auth_id, name, email, phone, created_at")
      .order("created_at", { ascending: false });
    if (query.error) throw query.error;
    return (query.data ?? []).map(mapClient);
  },

  async addClient(client: { name: string; phone: string; email: string }): Promise<Client> {
    const query = await supabase.from("clients").insert(client).select("*").single();
    if (query.error) throw query.error;
    return mapClient(query.data);
  },

  async updateClient(id: number, updates: Partial<Client>): Promise<void> {
    const query = await supabase
      .from("clients")
      .update({
        auth_id: updates.authId,
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
      })
      .eq("id", id);
    if (query.error) throw query.error;
  },

  async deleteClient(id: number): Promise<void> {
    const query = await supabase.from("clients").delete().eq("id", id);
    if (query.error) throw query.error;
  },

  async getProducts(): Promise<Product[]> {
    const query = await supabase
      .from("products")
      .select("id, name, sub_name, category_id, is_featured, purchase_price, sale_price, stock, initial_stock, enabled, source_url, created_at, categories(name)")
      .order("created_at", { ascending: false });
    if (query.error) throw query.error;
    return (query.data ?? []).map((row: any) => mapProduct({ ...row, category_name: row.categories?.name ?? null }));
  },

  async getProductImages(productIds: number[]): Promise<Array<{ id: number; image: string }>> {
    if (productIds.length === 0) return [];
    const query = await supabase.from("products").select("id, image").in("id", productIds);
    if (query.error) throw query.error;

    const rows = (query.data ?? []).map((row: any) => ({
      id: Number(row.id),
      image: typeof row.image === "string" ? row.image : "",
    }));

    const signable = rows
      .map((row) => ({ id: row.id, path: extractProductStoragePath(row.image) }))
      .filter((row): row is { id: number; path: string } => Boolean(row.path));

    if (signable.length === 0) return rows;

    const signed = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).createSignedUrls(
      signable.map((row) => row.path),
      60 * 60 * 24 * 7,
    );

    if (signed.error) throw signed.error;

    const signedMap = new Map<number, string>();
    signable.forEach((row, index) => {
      const signedUrl = signed.data?.[index]?.signedUrl;
      if (signedUrl) signedMap.set(row.id, signedUrl);
    });

    return rows.map((row) => ({
      id: row.id,
      image: signedMap.get(row.id) ?? row.image,
    }));
  },

  async addProduct(product: Partial<Product>): Promise<Product> {
    const payload = {
      name: product.name ?? "",
      sub_name: product.subName ?? "",
      category_id: product.categoryId ?? null,
      is_featured: Boolean(product.isFeatured),
      purchase_price: product.purchasePrice ?? 0,
      sale_price: product.salePrice ?? 0,
      stock: product.stock ?? 0,
      initial_stock: product.initialStock ?? product.stock ?? 0,
      enabled: product.enabled ?? true,
      image: product.image ?? "",
      source_url: product.sourceUrl ?? "",
    };

    const insert = await supabase
      .from("products")
      .insert(payload)
      .select("*, categories(name)")
      .single();
    if (insert.error) throw insert.error;
    return mapProduct({ ...insert.data, category_name: insert.data.categories?.name ?? null });
  },

  async updateProduct(id: number, updates: Partial<Product>): Promise<void> {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.subName !== undefined) payload.sub_name = updates.subName;
    if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
    if (updates.isFeatured !== undefined) payload.is_featured = updates.isFeatured;
    if (updates.purchasePrice !== undefined) payload.purchase_price = updates.purchasePrice;
    if (updates.salePrice !== undefined) payload.sale_price = updates.salePrice;
    if (updates.stock !== undefined) payload.stock = updates.stock;
    if (updates.enabled !== undefined) payload.enabled = updates.enabled;
    if (updates.image !== undefined) payload.image = updates.image;
    if (updates.sourceUrl !== undefined) payload.source_url = updates.sourceUrl;

    const query = await supabase.from("products").update(payload).eq("id", id);
    if (query.error) throw query.error;
  },

  async updateStock(id: number, stock: number): Promise<void> {
    const query = await supabase.from("products").update({ stock }).eq("id", id);
    if (query.error) throw query.error;
  },

  async deleteProduct(id: number): Promise<void> {
    const query = await supabase.from("products").delete().eq("id", id);
    if (query.error) throw query.error;
  },

  async getOrders(): Promise<Order[]> {
    const ordersQuery = await supabase
      .from("orders")
      .select("id, client_id, guest_name, guest_email, guest_phone, date, status")
      .order("date", { ascending: false });
    if (ordersQuery.error) throw ordersQuery.error;

    const orders = ordersQuery.data ?? [];
    if (orders.length === 0) return [];

    const orderIds = orders.map((order) => order.id);
    const itemsQuery = await supabase
      .from("order_items")
      .select("order_id, product_id, quantity, unit_sale_price, unit_purchase_price")
      .in("order_id", orderIds);
    if (itemsQuery.error) throw itemsQuery.error;

    const itemsByOrderId = new Map<number, any[]>();
    for (const item of itemsQuery.data ?? []) {
      const list = itemsByOrderId.get(item.order_id) ?? [];
      list.push(item);
      itemsByOrderId.set(item.order_id, list);
    }

    return orders.map((order) => mapOrder({ ...order, items: itemsByOrderId.get(order.id) ?? [] }));
  },

  async getFinanceExpenses(): Promise<FinanceExpense[]> {
    const query = await supabase
      .from("finance_expenses")
      .select("id, type, description, detail, category, amount, date, created_at")
      .order("date", { ascending: false })
      .order("id", { ascending: false });
    if (query.error) throw query.error;
    return (query.data ?? []).map(mapFinanceExpense);
  },

  async addFinanceExpense(expense: {
    type: "INGRESO" | "EGRESO";
    description: string;
    detail: string;
    category: string;
    amount: number;
    date: string;
  }): Promise<FinanceExpense> {
    const query = await supabase
      .from("finance_expenses")
      .insert({
        type: expense.type,
        description: expense.description,
        detail: expense.detail,
        category: expense.category,
        amount: expense.amount,
        date: expense.date,
      })
      .select("*")
      .single();
    if (query.error) throw query.error;
    return mapFinanceExpense(query.data);
  },

  async deleteFinanceExpense(id: number): Promise<void> {
    const query = await supabase.from("finance_expenses").delete().eq("id", id);
    if (query.error) throw query.error;
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
    const orderInsert = await supabase
      .from("orders")
      .insert({
        client_id: order.clientId ?? null,
        guest_name: order.guestName ?? null,
        guest_email: order.guestEmail ?? null,
        guest_phone: order.guestPhone ?? null,
        date: order.date,
        status: order.status,
      })
      .select("*")
      .single();

    if (orderInsert.error) throw orderInsert.error;

    const orderItems = order.items.map((item) => ({
      order_id: orderInsert.data.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_sale_price: item.unitSalePrice,
      unit_purchase_price: item.unitPurchasePrice,
    }));

    if (orderItems.length > 0) {
      const itemsInsert = await supabase.from("order_items").insert(orderItems);
      if (itemsInsert.error) throw itemsInsert.error;
    }

    return mapOrder({ ...orderInsert.data, items: orderItems });
  },

  async updateOrderStatus(id: number, status: string): Promise<void> {
    const query = await supabase.from("orders").update({ status }).eq("id", id);
    if (query.error) throw query.error;
  },

  async deleteOrder(id: number): Promise<void> {
    const query = await supabase.from("orders").delete().eq("id", id);
    if (query.error) throw query.error;
  },

  async getFavorites(clientId: number): Promise<Favorite[]> {
    const query = await supabase
      .from("favorites")
      .select("id, client_id, product_id, created_at")
      .eq("client_id", clientId);
    if (query.error) throw query.error;
    return (query.data ?? []).map(mapFavorite);
  },

  async toggleFavorite(clientId: number, productId: number, isFav: boolean): Promise<void> {
    if (isFav) {
      const remove = await supabase.from("favorites").delete().eq("client_id", clientId).eq("product_id", productId);
      if (remove.error) throw remove.error;
      return;
    }

    const insert = await supabase.from("favorites").insert({ client_id: clientId, product_id: productId });
    if (insert.error) throw insert.error;
  },

  async getHeroBanner(): Promise<HeroBanner | null> {
    const query = await supabase
      .from("hero_banner")
      .select("id, tag, title, subtitle, image")
      .eq("id", 1)
      .maybeSingle();
    if (query.error) throw query.error;
    if (!query.data) return null;

    const signedImage = await resolveSignedStorageImage(query.data.image);

    return {
      tag: query.data.tag,
      title: query.data.title,
      subtitle: query.data.subtitle,
      image: signedImage ?? query.data.image,
    };
  },

  async getFeaturedPanels(): Promise<FeaturedPanel[]> {
    const query = await supabase
      .from("featured_panels")
      .select("id, title, cta, image, class_name, category_id");
    if (query.error) throw query.error;

    const panels = (query.data ?? []).map((panel: any) => ({
      id: String(panel.id),
      title: panel.title,
      cta: panel.cta,
      image: panel.image,
      className: panel.class_name as FeaturedPanel["className"],
      categoryId: panel.category_id ?? null,
    }));

    const signable = panels
      .map((panel) => ({ id: panel.id, path: extractProductStoragePath(panel.image) }))
      .filter((panel): panel is { id: string; path: string } => Boolean(panel.path));

    if (signable.length === 0) return panels;

    const signed = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).createSignedUrls(
      signable.map((panel) => panel.path),
      60 * 60 * 24 * 7,
    );

    if (signed.error) throw signed.error;

    const signedMap = new Map<string, string>();
    signable.forEach((panel, index) => {
      const signedUrl = signed.data?.[index]?.signedUrl;
      if (signedUrl) signedMap.set(panel.id, signedUrl);
    });

    return panels.map((panel) => ({
      ...panel,
      image: signedMap.get(panel.id) ?? panel.image,
    }));
  },

  async saveHomeConfiguration(
    heroBanner: HeroBanner,
    featuredPanels: FeaturedPanel[],
  ): Promise<{ heroBanner: HeroBanner; featuredPanels: FeaturedPanel[] }> {
    let resolvedHeroImage = heroBanner.image;
    if (resolvedHeroImage.startsWith("data:image/")) {
      const heroFile = await dataUrlToOptimizedFile(resolvedHeroImage, "hero", "hero-banner");
      resolvedHeroImage = await this.uploadImage(heroFile, { variant: "hero", folder: "home/hero" });
    }

    const resolvedPanels = await Promise.all(
      featuredPanels.map(async (panel) => {
        if (!panel.image.startsWith("data:image/")) return panel;
        const panelFile = await dataUrlToOptimizedFile(panel.image, "panel", `featured-panel-${panel.id}`);
        const image = await this.uploadImage(panelFile, { variant: "panel", folder: "home/panels" });
        return { ...panel, image };
      }),
    );

    const heroQuery = await supabase.from("hero_banner").upsert(
      {
        id: 1,
        tag: heroBanner.tag,
        title: heroBanner.title,
        subtitle: heroBanner.subtitle,
        image: resolvedHeroImage,
      },
      { onConflict: "id" },
    );
    if (heroQuery.error) throw heroQuery.error;

    if (resolvedPanels.length === 0) {
      const deleteAll = await supabase.from("featured_panels").delete().not("id", "is", null);
      if (deleteAll.error) throw deleteAll.error;
      return {
        heroBanner: { ...heroBanner, image: resolvedHeroImage },
        featuredPanels: [],
      };
    }

    const panelIdsSql = `(${resolvedPanels.map((panel) => `"${panel.id}"`).join(",")})`;
    const deleteMissing = await supabase.from("featured_panels").delete().not("id", "in", panelIdsSql);
    if (deleteMissing.error) throw deleteMissing.error;

    const upsertPanels = await supabase.from("featured_panels").upsert(
      resolvedPanels.map((panel) => ({
        id: panel.id,
        title: panel.title,
        cta: panel.cta,
        image: panel.image,
        class_name: panel.className,
        category_id: panel.categoryId ?? null,
      })),
      { onConflict: "id" },
    );
    if (upsertPanels.error) throw upsertPanels.error;

    return {
      heroBanner: { ...heroBanner, image: resolvedHeroImage },
      featuredPanels: resolvedPanels,
    };
  },

  async uploadImage(file: File, options?: { variant?: UploadImageVariant; folder?: string }): Promise<string> {
    try {
      const variant = options?.variant ?? "product";
      const optimizedFile = await optimizeImageFile(file, variant);
      const extension = optimizedFile.name.split(".").pop()?.toLowerCase() || "webp";
      const fileName = `${crypto.randomUUID()}.${extension}`;
      const filePath = options?.folder ? `${options.folder}/${fileName}` : fileName;

      const upload = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(filePath, optimizedFile, {
        cacheControl: "31536000",
        upsert: false,
        contentType: optimizedFile.type || undefined,
      });

      if (upload.error) throw upload.error;

      const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      throw new Error(toErrorMessage(error, "Error subiendo imagen"));
    }
  },
};

function mapClient(row: any): Client {
  return {
    id: row.id,
    authId: row.auth_id ?? undefined,
    name: row.name,
    email: row.email,
    phone: row.phone ?? "",
    createdAt: row.created_at ?? "",
  };
}

function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id ?? null,
    createdAt: row.created_at ?? "",
  };
}

function mapProduct(row: any): Product {
  const rawName = typeof row.name === "string" ? row.name.trim() : "";
  const rawSubName = typeof row.sub_name === "string" ? row.sub_name.trim() : "";
  return {
    id: row.id,
    name: rawName || rawSubName,
    subName: rawSubName,
    categoryId: row.category_id ?? null,
    categoryName: row.category_name ?? undefined,
    isFeatured: Boolean(row.is_featured),
    purchasePrice: Number(row.purchase_price ?? 0),
    salePrice: Number(row.sale_price ?? 0),
    stock: Number(row.stock ?? 0),
    initialStock: Number(row.initial_stock ?? 0),
    enabled: Boolean(row.enabled),
    image: row.image ?? "",
    sourceUrl: row.source_url ?? "",
    createdAt: row.created_at ?? "",
  };
}

function extractProductStoragePath(image: string): string | null {
  if (!image) return null;
  if (image.startsWith("data:image/")) return null;

  if (/^https?:\/\//i.test(image)) {
    try {
      const url = new URL(image);
      if (url.pathname.includes(PRODUCT_PUBLIC_PREFIX)) {
        return decodeURIComponent(url.pathname.split(PRODUCT_PUBLIC_PREFIX)[1] ?? "").trim() || null;
      }
      if (url.pathname.includes(PRODUCT_SIGNED_PREFIX)) {
        return decodeURIComponent(url.pathname.split(PRODUCT_SIGNED_PREFIX)[1] ?? "").trim() || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  return image.trim() || null;
}

async function resolveSignedStorageImage(image: string): Promise<string | null> {
  const path = extractProductStoragePath(image);
  if (!path) return null;

  const signed = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
  if (signed.error) throw signed.error;
  return signed.data.signedUrl ?? null;
}

function mapOrder(row: any): Order {
  return {
    id: row.id,
    clientId: row.client_id ?? undefined,
    guestName: row.guest_name ?? undefined,
    guestEmail: row.guest_email ?? undefined,
    guestPhone: row.guest_phone ?? undefined,
    date: row.date,
    status: row.status,
    items: (row.items ?? []).map((item: any) => ({
      productId: item.product_id,
      quantity: item.quantity,
      unitSalePrice: Number(item.unit_sale_price ?? 0),
      unitPurchasePrice: Number(item.unit_purchase_price ?? 0),
    })),
  };
}

function mapFavorite(row: any): Favorite {
  return {
    id: row.id,
    clientId: row.client_id,
    productId: row.product_id,
    createdAt: row.created_at,
  };
}

function mapFinanceExpense(row: any): FinanceExpense {
  return {
    id: row.id,
    type: row.type === "INGRESO" ? "INGRESO" : "EGRESO",
    description: row.description ?? "",
    detail: row.detail ?? "",
    category: row.category ?? "General",
    amount: Number(row.amount ?? 0),
    date: row.date,
    createdAt: row.created_at ?? "",
  };
}
