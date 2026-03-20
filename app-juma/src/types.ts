export type Tab = "dashboard" | "inicio_admin" | "categorias" | "clientes" | "productos" | "catalogo" | "inventario" | "pedidos" | "finanzas" | "carrito" | "perfil" | "venta_rapida";
export type OrderStatus = "PENDIENTE" | "REALIZADO";
export type CartItem = { productId: number; quantity: number };

export type Category = {
  id: number;
  name: string;
  parentId?: number | null;
  createdAt: string;
};

export type Favorite = {
  id: number;
  clientId: number;
  productId: number;
  createdAt: string;
};

export type Client = {
  id: number;
  authId?: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
};

export type Product = {
  id: number;
  name: string;
  subName: string;
  categoryId?: number | null;
  categoryName?: string; // Denormalized or joined for UI
  isFeatured: boolean;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  initialStock: number;
  enabled: boolean;
  image: string;
  sourceUrl: string;
  createdAt: string;
};

export type OrderItem = {
  productId: number;
  quantity: number;
  unitSalePrice: number;
  unitPurchasePrice: number;
};

export type Order = {
  id: number;
  clientId?: number;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
};

export type NewOrderItem = {
  productId: string;
  quantity: string;
};

export type FeaturedPanel = {
  id: string;
  title: string;
  cta: string;
  image: string;
  categoryId?: number | null;
  className: "card-left" | "card-top" | "card-bottom-left" | "card-bottom-right";
};

export type HeroBanner = {
  tag: string;
  title: string;
  subtitle: string;
  image: string;
};
