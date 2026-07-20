type Filter = { op: string; column: string; value?: unknown };
type Order = { column: string; ascending?: boolean; nullsFirst?: boolean };

type QueryState = {
  table: string;
  action: "select" | "insert" | "update" | "delete" | "upsert";
  select?: string;
  filters: Filter[];
  or?: string;
  orders: Order[];
  limit?: number;
  single?: boolean;
  values?: unknown;
  onConflict?: string;
};

type ApiResponse<T = unknown> = { data: T; error: { message: string } | null };

const TOKEN_KEY = "cpr_access_token";
const REQUEST_TIMEOUT_MS = 20_000;
const UPLOAD_TIMEOUT_MS = 60_000;
const listeners = new Set<(event: string, session: unknown) => void>();

function apiUrl(path: string) {
  if (typeof window !== "undefined") return path;
  return `http://127.0.0.1:${process.env.PORT || "3000"}${path}`;
}

function token() {
  return typeof window === "undefined" ? "" : window.localStorage.getItem(TOKEN_KEY) || "";
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");
  const accessToken = token();
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(apiUrl(path), { ...init, headers, signal: controller.signal });
    const body = await response.json().catch(() => ({ data: null, error: { message: `Ошибка сервера (${response.status})` } }));
    if (!response.ok && !body.error) {
      return { data: null as T, error: { message: `Ошибка сервера (${response.status})` } };
    }
    return body as ApiResponse<T>;
  } catch (error) {
    const message = error instanceof DOMException && error.name === "AbortError"
      ? "Сервер не отвечает. Проверьте подключение и попробуйте ещё раз."
      : "Не удалось связаться с сервером. Попробуйте ещё раз.";
    return { data: null as T, error: { message } };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

class QueryBuilder<T = any> implements PromiseLike<ApiResponse<T>> {
  private state: QueryState;

  constructor(table: string) {
    this.state = { table, action: "select", filters: [], orders: [] };
  }

  select(columns = "*", _options?: unknown) {
    this.state.select = columns;
    if (this.state.action === "insert" || this.state.action === "update" || this.state.action === "upsert") {
      return this;
    }
    return this as QueryBuilder<T>;
  }

  insert(values: unknown) { this.state.action = "insert"; this.state.values = values; return this; }
  update(values: unknown) { this.state.action = "update"; this.state.values = values; return this; }
  delete() { this.state.action = "delete"; return this; }
  upsert(values: unknown, options?: { onConflict?: string }) { this.state.action = "upsert"; this.state.values = values; this.state.onConflict = options?.onConflict; return this; }
  eq(column: string, value: unknown) { this.state.filters.push({ op: "eq", column, value }); return this; }
  neq(column: string, value: unknown) { this.state.filters.push({ op: "neq", column, value }); return this; }
  in(column: string, value: unknown[]) { this.state.filters.push({ op: "in", column, value }); return this; }
  gte(column: string, value: unknown) { this.state.filters.push({ op: "gte", column, value }); return this; }
  lte(column: string, value: unknown) { this.state.filters.push({ op: "lte", column, value }); return this; }
  ilike(column: string, value: unknown) { this.state.filters.push({ op: "ilike", column, value }); return this; }
  or(value: string) { this.state.or = value; return this; }
  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) { this.state.orders.push({ column, ...options }); return this; }
  limit(value: number) { this.state.limit = value; return this; }
  single() { this.state.single = true; return this; }
  maybeSingle() { this.state.single = true; return this; }

  then<TResult1 = ApiResponse<T>, TResult2 = never>(onfulfilled?: ((value: ApiResponse<T>) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null) {
    return request<T>("/api/db", { method: "POST", body: JSON.stringify(this.state) }).then(onfulfilled, onrejected);
  }
}

const auth = {
  async getUser() {
    const response = await request<{ user: { id: string; email: string; role: string; permissions?: string[]; display_name?: string | null } | null }>("/api/auth/session");
    return { data: { user: response.data?.user ?? null }, error: response.error };
  },
  async getSession() {
    const response = await request<{ user: { id: string; email: string; role: string; permissions?: string[]; display_name?: string | null } | null }>("/api/auth/session");
    const user = response.data?.user ?? null;
    return { data: { session: user && token() ? { access_token: token(), user } : null }, error: response.error };
  },
  async signInWithPassword(credentials: { email: string; password: string }) {
    const response = await request<{ token: string; user: unknown }>("/api/auth/login", { method: "POST", body: JSON.stringify(credentials) });
    if (!response.error && response.data?.token && typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_KEY, response.data.token);
      listeners.forEach((listener) => listener("SIGNED_IN", response.data));
    }
    return { data: response.data ?? { user: null, session: null }, error: response.error };
  },
  async signUp(credentials: { email: string; password: string; options?: unknown }) {
    const response = await request<{ token: string; user: unknown }>("/api/auth/signup", { method: "POST", body: JSON.stringify(credentials) });
    if (!response.error && response.data?.token && typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_KEY, response.data.token);
      listeners.forEach((listener) => listener("SIGNED_IN", response.data));
    }
    return { data: response.data ?? { user: null, session: null }, error: response.error };
  },
  async requestPasswordReset(email: string) {
    return request<{ ok: boolean }>("/api/auth/request-password-reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  async resetPassword(tokenValue: string, password: string) {
    return request<{ ok: boolean }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token: tokenValue, password }),
    });
  },
  async updateEmail(email: string, currentPassword: string) {
    return request<{ email: string }>("/api/auth/update-email", {
      method: "POST",
      body: JSON.stringify({ email, currentPassword }),
    });
  },
  async signOut() {
    const response = await request<null>("/api/auth/logout", { method: "POST", body: "{}" });
    if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
    listeners.forEach((listener) => listener("SIGNED_OUT", null));
    return { error: response.error };
  },
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    listeners.add(callback);
    return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } };
  },
};

const storage = {
  from(_bucket: string) {
    return {
      async upload(path: string, file: Blob, options?: { contentType?: string }) {
        const form = new FormData();
        form.set("path", path);
        form.set("contentType", options?.contentType || file.type || "application/octet-stream");
        form.set("file", file);
        const headers = new Headers();
        const accessToken = token();
        if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
        let response: Response;
        try {
          response = await fetchWithTimeout(apiUrl("/api/storage"), { method: "POST", headers, body: form }, UPLOAD_TIMEOUT_MS);
        } catch (error) {
          const message = error instanceof DOMException && error.name === "AbortError"
            ? "Загрузка занимает слишком долго. Проверьте размер файла и подключение."
            : "Не удалось загрузить файл. Попробуйте ещё раз.";
          return { data: null, error: { message } };
        }
        const body = await response.json().catch(() => ({ data: null, error: { message: `Ошибка загрузки (${response.status})` } })) as ApiResponse<{ path: string }>;
        return response.ok
          ? { data: body.data, error: body.error }
          : { data: null, error: body.error ?? { message: `Ошибка загрузки (${response.status})` } };
      },
      async createSignedUrl(path: string, _expiresIn: number) {
        return { data: { signedUrl: `${apiUrl("/uploads")}/${path.replace(/^\/+/, "")}` }, error: null };
      },
    };
  },
};

const adminApi = {
  async listUsers() {
    return request<unknown[]>("/api/admin/users");
  },
  async createUser(payload: unknown) {
    return request<{ id: string }>("/api/admin/users", { method: "POST", body: JSON.stringify(payload) });
  },
  async updateUser(id: string, payload: unknown) {
    return request<{ id: string }>(`/api/admin/users/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) });
  },
};

export const db = {
  from: <T = any>(table: string) => new QueryBuilder<T>(table),
  auth,
  storage,
  admin: adminApi,
  async rpc(name: string, args: { _user_id?: string; _role?: string }) {
    if (name !== "has_role") return { data: null, error: { message: "Unknown function" } };
    const response = await request<boolean>("/api/auth/has-role", { method: "POST", body: JSON.stringify({ userId: args._user_id, role: args._role }) });
    return { data: response.data, error: response.error };
  },
} as any;
