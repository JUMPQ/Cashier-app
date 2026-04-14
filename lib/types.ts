export type CashierRecord = {
  id: number;
  name: string;
  email?: string;
  role?: string;
  is_active?: boolean;
  last_login?: string;
};

export type StoreRecord = {
  id: number;
  store_name: string;
  store_code: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  primary_color?: string;
  secondary_color?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  is_active?: boolean;
};

export type PickupItem = {
  name: string;
  quantity: number;
  price?: number;
  total?: number;
  image?: string;
  unit?: string;
};

export type VerifiedPickup = {
  code: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount?: number;
  totalItems?: number;
  items: PickupItem[];
  status?: string;
  paidAt?: string;
};

export type CashierSession = {
  token: string;
  cashier: CashierRecord;
  store: StoreRecord;
};
