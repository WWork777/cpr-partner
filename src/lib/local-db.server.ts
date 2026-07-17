import { createHash, randomBytes } from "node:crypto";
import { Pool, type QueryResultRow } from "pg";
import bcrypt from "bcryptjs";

const TABLES = new Set([
  "categories",
  "courses",
  "applications",
  "blog_posts",
  "app_settings",
  "certificates",
  "banners",
  "promocodes",
  "course_schedules",
  "course_reviews",
  "audit_log",
  "teachers",
  "org_documents",
  "gallery_images",
  "course_teachers",
  "document_samples",
  "public_schedule",
]);

const ADMIN_ONLY_TABLES = new Set([
  "applications",
  "promocodes",
  "audit_log",
  "course_teachers",
]);

const PUBLIC_TABLES = new Set([
  "categories",
  "courses",
  "blog_posts",
  "banners",
  "course_schedules",
  "course_reviews",
  "certificates",
  "teachers",
  "org_documents",
  "gallery_images",
  "document_samples",
  "public_schedule",
]);

let pool: Pool | undefined;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not configured");
    pool = new Pool({ connectionString, max: 10 });
  }
  return pool;
}

export async function queryDatabase<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []) {
  return getPool().query<T>(sql, params);
}

function identifier(value: string) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(value)) throw new Error("Invalid database identifier");
  return `"${value}"`;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export type AuthUser = {
  id: string;
  email: string;
  role: "admin" | "user";
};

export async function getUserFromRequest(request: Request): Promise<AuthUser | null> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  const tokenHash = hashToken(header.slice(7).trim());
  if (!tokenHash) return null;

  const result = await getPool().query<AuthUser>(
    `SELECT u.id, u.email, COALESCE(r.role, 'user') AS role
     FROM app_sessions s
     JOIN app_users u ON u.id = s.user_id
     LEFT JOIN LATERAL (
       SELECT role FROM user_roles WHERE user_id = u.id ORDER BY role = 'admin' DESC LIMIT 1
     ) r ON true
     WHERE s.token_hash = $1 AND s.expires_at > now()` ,
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export async function login(email: string, password: string) {
  const result = await getPool().query<{ id: string; email: string; password_hash: string; role: "admin" | "user" }>(
    `SELECT u.id, u.email, u.password_hash, COALESCE(r.role, 'user') AS role
     FROM app_users u
     LEFT JOIN LATERAL (
       SELECT role FROM user_roles WHERE user_id = u.id ORDER BY role = 'admin' DESC LIMIT 1
     ) r ON true
     WHERE lower(u.email) = lower($1)`,
    [email.trim()],
  );
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return { error: "Неверный email или пароль" as const };
  }
  return createSession(user.id, user.email, user.role);
}

export async function signup(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (password.length < 6) return { error: "Пароль должен быть не короче 6 символов" as const };
  const passwordHash = await bcrypt.hash(password, 12);
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query<{ id: string; email: string }>(
      `INSERT INTO app_users (email, password_hash) VALUES ($1, $2) RETURNING id, email`,
      [normalizedEmail, passwordHash],
    );
    await client.query(`INSERT INTO user_roles (user_id, role) VALUES ($1, 'user')`, [inserted.rows[0].id]);
    await client.query("COMMIT");
    return createSession(inserted.rows[0].id, inserted.rows[0].email, "user");
  } catch (error) {
    await client.query("ROLLBACK");
    if (isUniqueViolation(error)) return { error: "Этот email уже зарегистрирован" as const };
    throw error;
  } finally {
    client.release();
  }
}

async function createSession(id: string, email: string, role: "admin" | "user") {
  const token = randomBytes(32).toString("hex");
  await getPool().query(
    `INSERT INTO app_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + interval '30 days')`,
    [hashToken(token), id],
  );
  return { token, user: { id, email, role } satisfies AuthUser };
}

export async function logout(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Bearer ")) {
    await getPool().query("DELETE FROM app_sessions WHERE token_hash = $1", [hashToken(header.slice(7).trim())]);
  }
}

type Filter = { op: string; column: string; value?: unknown };
type Order = { column: string; ascending?: boolean; nullsFirst?: boolean };

export type TableRequest = {
  table: string;
  action: "select" | "insert" | "update" | "delete" | "upsert";
  select?: string;
  filters?: Filter[];
  or?: string;
  orders?: Order[];
  limit?: number;
  single?: boolean;
  values?: Record<string, unknown> | Record<string, unknown>[];
  onConflict?: string;
};

export async function executeTableRequest(request: Request, input: TableRequest) {
  if (!TABLES.has(input.table)) throw new Error("Unknown table");
  const user = await getUserFromRequest(request);
  const isAdmin = user?.role === "admin";
  if (ADMIN_ONLY_TABLES.has(input.table) && !isAdmin) {
    if (!(input.table === "applications" && input.action === "insert")) throw new Error("Доступ запрещён");
  }
  if (input.action !== "select" && !(input.table === "applications" && input.action === "insert") && !(input.table === "course_reviews" && input.action === "insert")) {
    if (!isAdmin) throw new Error("Доступ запрещён");
  }

  if (!isAdmin && input.table === "courses") {
    input.filters = [...(input.filters ?? []), { op: "eq", column: "published", value: true }];
  }
  if (!isAdmin && input.table === "blog_posts") {
    input.filters = [...(input.filters ?? []), { op: "eq", column: "published", value: true }];
  }
  if (!isAdmin && input.table === "teachers") {
    input.filters = [...(input.filters ?? []), { op: "eq", column: "is_published", value: true }];
  }

  switch (input.action) {
    case "select":
      return selectRows(input);
    case "insert":
      return mutateRows(input, "insert");
    case "update":
      return mutateRows(input, "update");
    case "delete":
      return mutateRows(input, "delete");
    case "upsert":
      return mutateRows(input, "upsert");
  }
}

async function selectRows(input: TableRequest) {
  const params: unknown[] = [];
  const columns = selectColumns(input.select);
  let sql = `SELECT ${columns} FROM ${identifier(input.table)}`;
  const where = buildWhere(input, params);
  if (where) sql += ` WHERE ${where}`;
  for (const order of input.orders ?? []) {
    sql += ` ORDER BY ${identifier(order.column)} ${order.ascending === false ? "DESC" : "ASC"}${order.nullsFirst === true ? " NULLS FIRST" : order.nullsFirst === false ? " NULLS LAST" : ""}`;
  }
  if (input.limit) {
    params.push(Math.min(Math.max(Math.trunc(input.limit), 1), 1000));
    sql += ` LIMIT $${params.length}`;
  }
  const result = await getPool().query(sql, params);
  const rows = await addNestedRelations(input, result.rows);
  if (input.single) return rows[0] ?? null;
  return rows;
}

async function mutateRows(input: TableRequest, mode: "insert" | "update" | "delete" | "upsert") {
  const values = Array.isArray(input.values) ? input.values : input.values ? [input.values] : [];
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    let rows: QueryResultRow[] = [];
    if (mode === "insert" || mode === "upsert") {
      if (!values.length) throw new Error("Empty insert payload");
      const keys = Object.keys(values[0]).filter((key) => key !== "created_at" && key !== "updated_at");
      if (!keys.length) throw new Error("Empty insert payload");
      const params: unknown[] = [];
      const tuples = values.map((row) => `(${keys.map((key) => { params.push(row[key]); return `$${params.length}`; }).join(", ")})`);
      let sql = `INSERT INTO ${identifier(input.table)} (${keys.map(identifier).join(", ")}) VALUES ${tuples.join(", ")}`;
      if (mode === "upsert") {
        const conflict = (input.onConflict ?? "").split(",").map((x) => x.trim()).filter(Boolean);
        if (!conflict.length) throw new Error("onConflict is required for upsert");
        sql += ` ON CONFLICT (${conflict.map(identifier).join(", ")}) DO UPDATE SET ${keys.filter((key) => !conflict.includes(key)).map((key) => `${identifier(key)} = EXCLUDED.${identifier(key)}`).join(", ") || ""}`;
      }
      sql += " RETURNING *";
      rows = (await client.query(sql, params)).rows;
    } else {
      const params: unknown[] = [];
      let sql: string;
      if (mode === "delete") {
        sql = `DELETE FROM ${identifier(input.table)}`;
      } else {
        const payload = values[0] ?? {};
        const keys = Object.keys(payload).filter((key) => key !== "id" && key !== "created_at" && key !== "updated_at");
        if (!keys.length) throw new Error("Empty update payload");
        sql = `UPDATE ${identifier(input.table)} SET ${keys.map((key) => { params.push(payload[key]); return `${identifier(key)} = $${params.length}`; }).join(", ")}`;
      }
      const where = buildWhere(input, params);
      if (!where) throw new Error("Update/delete requires a filter");
      sql += ` WHERE ${where} RETURNING *`;
      rows = (await client.query(sql, params)).rows;
    }
    await client.query("COMMIT");
    return input.single ? rows[0] ?? null : rows;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function selectColumns(selection?: string) {
  if (!selection || selection.includes("*")) return "*";
  const columns = selection.split(",").map((part) => part.trim()).filter((part) => !part.includes("("));
  if (!columns.length) return "*";
  return columns.map((column) => identifier(column)).join(", ");
}

function buildWhere(input: TableRequest, params: unknown[]) {
  const parts: string[] = [];
  for (const filter of input.filters ?? []) {
    const column = identifier(filter.column);
    if (filter.op === "is") {
      parts.push(filter.value === null ? `${column} IS NULL` : `${column} IS NOT NULL`);
      continue;
    }
    if (filter.op === "in") {
      const values = Array.isArray(filter.value) ? filter.value : [];
      if (!values.length) { parts.push("FALSE"); continue; }
      parts.push(`${column} IN (${values.map((value) => { params.push(value); return `$${params.length}`; }).join(", ")})`);
      continue;
    }
    const operator = { eq: "=", neq: "<>", gte: ">=", lte: "<=", gt: ">", lt: "<", ilike: "ILIKE" }[filter.op];
    if (!operator) throw new Error("Unsupported filter");
    params.push(filter.value);
    parts.push(filter.value === null ? `${column} IS ${operator === "=" ? "" : "NOT "}NULL` : `${column} ${operator} $${params.length}`);
  }
  if (input.or) {
    const orParts = input.or.split(",").map((item) => item.trim()).filter(Boolean).map((item) => {
      const [column, op, raw] = item.split(".");
      if (!column || !op) throw new Error("Invalid OR filter");
      if (op === "is" && raw === "null") return `${identifier(column)} IS NULL`;
      if (op !== "eq") throw new Error("Unsupported OR filter");
      params.push(raw);
      return `${identifier(column)} = $${params.length}`;
    });
    if (orParts.length) parts.push(`(${orParts.join(" OR ")})`);
  }
  return parts.join(" AND ");
}

async function addNestedRelations(input: TableRequest, rows: QueryResultRow[]) {
  if (!rows.length || !input.select?.includes("(")) return rows;
  if (input.table === "courses" && input.select.includes("categories(")) {
    const ids = [...new Set(rows.map((row) => row.category_id).filter(Boolean))];
    if (!ids.length) return rows.map((row) => ({ ...row, categories: null }));
    const result = await getPool().query("SELECT id, name, slug FROM categories WHERE id = ANY($1::uuid[])", [ids]);
    const byId = new Map(result.rows.map((row) => [row.id, row]));
    return rows.map((row) => ({ ...row, categories: byId.get(row.category_id) ?? null }));
  }
  if (input.table === "applications" && input.select.includes("courses(")) {
    const ids = [...new Set(rows.map((row) => row.course_id).filter(Boolean))];
    if (!ids.length) return rows.map((row) => ({ ...row, courses: null }));
    const result = await getPool().query("SELECT id, title, slug FROM courses WHERE id = ANY($1::uuid[])", [ids]);
    const byId = new Map(result.rows.map((row) => [row.id, row]));
    return rows.map((row) => ({ ...row, courses: byId.get(row.course_id) ?? null }));
  }
  if (input.table === "course_reviews" && input.select.includes("courses(")) {
    const ids = [...new Set(rows.map((row) => row.course_id).filter(Boolean))];
    if (!ids.length) return rows.map((row) => ({ ...row, courses: null }));
    const result = await getPool().query("SELECT id, title, slug FROM courses WHERE id = ANY($1::uuid[])", [ids]);
    const byId = new Map(result.rows.map((row) => [row.id, row]));
    return rows.map((row) => ({ ...row, courses: byId.get(row.course_id) ?? null }));
  }
  return rows;
}

function isUniqueViolation(error: unknown): error is { code: string } {
  return !!error && typeof error === "object" && "code" in error && error.code === "23505";
}

export { PUBLIC_TABLES };
