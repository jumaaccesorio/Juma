export type Tab = "dashboard" | "inicio_admin" | "categorias" | "clientes" | "productos" | "catalogo" | "inventario" | "pedidos" | "reposicion" | "finanzas" | "carrito" | "perfil" | "venta_rapida" | "comunidad";
export type OrderStatus = "PENDIENTE" | "REALIZADO";
export type CartItem = { productId: number; quantity: number; size?: string };

export type ProductSize = {
  id: number;
  productId: number;
  size: string;
  stock: number;
};

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
  isActive: boolean;
  createdAt: string;
};

export type Product = {
  id: number;
  name: string;
  subName: string;
  size?: string; // Campo legado — usar sizes[] para variantes múltiples
  sizes?: ProductSize[]; // Variantes de talle con stock individual
  categoryId?: number | null;
  categoryName?: string; // Denormalized or joined for UI
  isFeatured: boolean;
  purchasePrice: number;
  salePrice: number;
  stock: number; // Total (suma de sizes o stock directo si no hay sizes)
  initialStock: number;
  enabled: boolean;
  image: string;
  originalImage?: string;
  imageThumb?: string;
  imageCard?: string;
  imageFull?: string;
  sourceUrl: string;
  createdAt: string;
};

export type OrderItem = {
  productId: number;
  quantity: number;
  size?: string;
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

export type RestockCartItem = {
  productId: number;
  requested: boolean;
  inCart: boolean;
  hidden: boolean;
  manual: boolean;
  quantity: number;
  updatedAt: string;
};

export type FinanceExpense = {
  id: number;
  type: "INGRESO" | "EGRESO";
  description: string;
  detail: string;
  category: string;
  amount: number;
  date: string;
  createdAt: string;
};

export type NewOrderItem = {
  productId: string;
  quantity: string;
  size?: string;
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

export type CommunitySubscriber = {
  id: number;
  email: string;
  createdAt: string;
};
