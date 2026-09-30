import axios, { type AxiosError } from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  // The custom header is what the backend requires on writes (CSRF protection).
  headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
  withCredentials: true,
});

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

// Turns HTTP failures into readable messages: screens already show `error.message`.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string }>) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const isAuthCall = url.endsWith("/api/login") || url.endsWith("/api/me");

    if (status === 401 && !isAuthCall) onUnauthorized?.();

    if (status === 401 && url.endsWith("/api/login")) error.message = "Usuário ou senha inválidos.";
    else if (status === 401) error.message = "Sessão expirada. Entre novamente.";
    else if (status === 403) error.message = "Você não tem permissão para esta ação.";
    else if (status === 429) error.message = "Muitas tentativas. Aguarde um momento e tente novamente.";
    else if (error.response?.data?.error) error.message = error.response.data.error;
    return Promise.reject(error);
  },
);

export type Perfil = "admin" | "member";

export type Usuario = {
  id: number;
  username: string;
  role: Perfil;
  active: boolean;
  created_at: string | null;
};

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

export type MarketQuerySource = {
  title: string | null;
  url: string | null;
};

export type MarketQueryResult = {
  id: number;
  product_id: number;
  name: string;
  response: string;
  sources: MarketQuerySource[];
  date: string;
};