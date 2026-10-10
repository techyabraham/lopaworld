export type StoreCartItem = {
  id: string;
  title?: string;
  quantity: number;
  unit_price?: number;
  total?: number;
  subtotal?: number;
  thumbnail?: string | null;
  metadata?: Record<string, unknown> | null;
  product?: { title?: string; handle?: string; thumbnail?: string | null; metadata?: Record<string, unknown> | null };
  variant?: {
    id?: string;
    title?: string;
    manage_inventory?: boolean;
    allow_backorder?: boolean;
    inventory_quantity?: number;
    options?: Array<{ value?: string; option?: { title?: string } }>;
  };
};

export type StoreCart = {
  id: string;
  currency_code?: string;
  items?: StoreCartItem[];
  subtotal?: number;
  shipping_total?: number;
  tax_total?: number;
  total?: number;
  email?: string;
  region_id?: string;
  shipping_address?: {
    first_name?: string; last_name?: string; phone?: string; address_1?: string; address_2?: string;
    city?: string; province?: string; postal_code?: string; country_code?: string;
  };
  shipping_methods?: Array<{ shipping_option_id?: string; name?: string; amount?: number; total?: number }>;
};
