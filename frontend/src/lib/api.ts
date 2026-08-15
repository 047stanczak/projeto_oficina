import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  headers: { Accept: "application/json" },
});

export type ProdutoExtraido = {
  code: string;
  name: string;
  new_cost: number;
  quantity: number;
};

export type UploadResponse = {
  success: boolean;
  invoice_id: string | number;
  products: ProdutoExtraido[];
};

export type Produto = {
  id: number;
  code: string;
  name: string;
  current_cost: number;
  sale_price: number;
  suggested_price: number | null;
  stock: number;
  min_stock: number | null;
  effective_min_stock: number;
  is_low_stock: boolean;
};

export type Regra = {
  id: number;
  product_id: number | null;
  product_name: string;
  margin_percentage: number;
  tax_percentage: number;
};

export type DashboardData = {
  invested_value: number;
  potential_sale_value: number;
  gross_profit_estimate: number;
  net_profit_estimate: number;
  estimated_profitability_percentage: number;
  products_for_adjustment: number;
};

export type SimuladorData = Omit<DashboardData, "products_for_adjustment">;

export type HistoricoCompra = {
  id: number;
  code: string;
  name: string;
  old_cost: number;
  new_cost: number;
  quantity: number;
  date: string;
};
export type HistoricoPreco = {
  id: number;
  code: string;
  name: string;
  old_price: number;
  new_price: number;
  date: string;
};
export type AumentoCusto = {
  code: string;
  name: string;
  old_cost: number;
  new_cost: number;
  increase: number;
};
