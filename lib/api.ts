import { CashierSession, StoreRecord, VerifiedPickup } from "@/lib/types";

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? "https://server.jumpqapp.com/api"
).replace(/\/$/, "");

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: Record<string, unknown> | string | undefined;
  token?: string;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function requestJson<T>(path: string, options: RequestOptions = {}) {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: HeadersInit = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers ?? {}),
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body:
      typeof options.body === "string"
        ? options.body
        : options.body
          ? JSON.stringify(options.body)
          : undefined,
  });

  const raw = await response.text();

  let payload: any = {};
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = { message: raw };
    }
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.message || payload?.error || "Request failed",
      response.status,
      payload,
    );
  }

  return payload as { success?: boolean; message?: string; data: T };
}

export async function loginCashier(payload: {
  username: string;
  pin: string;
  storeCode: string;
}) {
  return requestJson<CashierSession>("/cashiers/login", {
    method: "POST",
    body: payload,
  });
}

export async function fetchPublicStore(storeCode: string) {
  return requestJson<{ store: StoreRecord }>(
    `/stores/public/${encodeURIComponent(storeCode)}`,
    {
      method: "GET",
    },
  );
}

export async function verifyPickupCode(token: string, code: string) {
  return requestJson<VerifiedPickup>("/cashiers/verify-pickup", {
    method: "POST",
    token,
    body: { code },
  });
}

export async function collectPickupOrder(token: string, code: string) {
  return requestJson<{ code: string; collectedAt: string }>(
    "/cashiers/collect-order",
    {
      method: "POST",
      token,
      body: { code },
    },
  );
}
