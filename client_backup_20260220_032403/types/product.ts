export interface Supplier {
  name: string;
  priceUYU: number;
  priceUSD: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  manufacturer: string;
  category: string;
  priceUYU: number;
  priceUSD: number;
  badge: "Servicio" | "Producto";
  imageUrl?: string;
  stock?: number;
  manufacturerLogoUrl?: string;
  quotedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  suppliers?: Supplier[];
}
