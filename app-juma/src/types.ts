export type Tab = "inicio_admin" | "clientes" | "productos" | "catalogo" | "inventario" | "pedidos" | "finanzas" | "carrito";
export type OrderStatus = "PENDIENTE" | "REALIZADO";
export type CartItem = { productId: number; quantity: number };

export type Client = {
  id: number;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
};

export type Product = {
  id: number;
  name: string;
  category: string;
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
  clientId: number;
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
  className: "card-left" | "card-top" | "card-bottom-left" | "card-bottom-right";
};

export type HeroBanner = {
  tag: string;
  title: string;
  subtitle: string;
  image: string;
};
