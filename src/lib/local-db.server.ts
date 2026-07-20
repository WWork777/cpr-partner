import { createHash, randomBytes } from "node:crypto";
import { Pool, type QueryResultRow } from "pg";
import bcrypt from "bcryptjs";
import { PERMISSION_KEYS, type PermissionKey } from "./permissions";

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

const TABLE_PERMISSIONS: Record<string, PermissionKey> = {
  applications: "applications",
  courses: "courses",
  course_teachers: "courses",
  course_schedules: "schedules",
  public_schedule: "site_schedule",
  categories: "categories",
  teachers: "teachers",
  org_documents: "documents",
  document_samples: "doc_samples",
  gallery_images: "gallery",
  banners: "banners",
  promocodes: "promocodes",
  blog_posts: "blog",
  certificates: "certificates",
  course_reviews: "reviews",
  audit_log: "audit",
  app_settings: "settings",
};

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

const JSONB_COLUMNS: Record<string, Set<string>> = {
  courses: new Set(["features", "steps", "faqs"]),
  app_settings: new Set(["value"]),
  audit_log: new Set(["diff"]),
  public_schedule: new Set(["sets"]),
};

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not configured");
    pool = new Pool({
      connectionString,
      max: 10,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
      statement_timeout: 20_000,
      query_timeout: 25_000,
    });
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
  display_name?: string | null;
  role: "admin" | "manager" | "user";
  permissions: string[];
};

export async function getUserFromRequest(request: Request): Promise<AuthUser | null> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  const tokenHash = hashToken(header.slice(7).trim());
  if (!tokenHash) return null;

  const result = await getPool().query<AuthUser>(
    `SELECT u.id, u.email, u.display_name, COALESCE(r.role, 'user') AS role,
            COALESCE(array_agg(p.permission) FILTER (WHERE p.permission IS NOT NULL), '{}')::text[] AS permissions
     FROM app_sessions s
     JOIN app_users u ON u.id = s.user_id
     LEFT JOIN LATERAL (
       SELECT role FROM user_roles WHERE user_id = u.id
       ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'manager' THEN 2 ELSE 3 END LIMIT 1
     ) r ON true
     LEFT JOIN user_permissions p ON p.user_id = u.id
     WHERE s.token_hash = $1 AND s.expires_at > now() AND u.is_active = true
     GROUP BY u.id, u.email, u.display_name, r.role` ,
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export async function login(email: string, password: string) {
  const result = await getPool().query<{ id: string; email: string; display_name: string | null; password_hash: string; is_active: boolean; role: "admin" | "manager" | "user" }>(
    `SELECT u.id, u.email, u.display_name, u.password_hash, u.is_active, COALESCE(r.role, 'user') AS role
     FROM app_users u
     LEFT JOIN LATERAL (
       SELECT role FROM user_roles WHERE user_id = u.id
       ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'manager' THEN 2 ELSE 3 END LIMIT 1
     ) r ON true
     WHERE lower(u.email) = lower($1)`,
    [email.trim()],
  );
  const user = result.rows[0];
  if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
    return { error: "Неверный email или пароль" as const };
  }
  return createSession(user.id, user.email, user.role, user.display_name);
}

export async function updateOwnEmail(request: Request, nextEmail: string, currentPassword: string) {
  const currentUser = await getUserFromRequest(request);
  if (!currentUser) throw new Error("Сессия истекла. Войдите снова");

  const email = nextEmail.trim().toLowerCase();
  if (!email || !email.includes("@")) throw new Error("Укажите корректный email");
  if (!currentPassword) throw new Error("Введите текущий пароль");

  const current = await getPool().query<{ password_hash: string }>(
    "SELECT password_hash FROM app_users WHERE id = $1 AND is_active = true",
    [currentUser.id],
  );
  if (!current.rows[0] || !(await bcrypt.compare(currentPassword, current.rows[0].password_hash))) {
    throw new Error("Текущий пароль указан неверно");
  }

  try {
    await getPool().query("UPDATE app_users SET email = $1 WHERE id = $2", [email, currentUser.id]);
  } catch (error) {
    if (isUniqueViolation(error)) throw new Error("Этот email уже используется");
    throw error;
  }

  await getPool().query("DELETE FROM app_sessions WHERE user_id = $1", [currentUser.id]);
  return { email };
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

async function createSession(id: string, email: string, role: "admin" | "manager" | "user", displayName?: string | null) {
  const token = randomBytes(32).toString("hex");
  await getPool().query(
    `INSERT INTO app_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + interval '30 days')`,
    [hashToken(token), id],
  );
  const permissions = await getUserPermissions(id);
  return { token, user: { id, email, display_name: displayName ?? null, role, permissions } satisfies AuthUser };
}

async function getUserPermissions(userId: string) {
  const result = await getPool().query<{ permission: string }>(
    "SELECT permission FROM user_permissions WHERE user_id = $1 ORDER BY permission",
    [userId],
  );
  return result.rows.map((row) => row.permission);
}

export function canManagePermission(user: AuthUser | null, permission: PermissionKey) {
  return user?.role === "admin" || (user?.role === "manager" && user.permissions.includes(permission));
}

export function canManageTable(user: AuthUser | null, table: string) {
  const permission = TABLE_PERMISSIONS[table];
  return !permission || canManagePermission(user, permission);
}

export function canUploadFiles(user: AuthUser | null) {
  return user?.role === "admin" || (
    user?.role === "manager" &&
    ["courses", "teachers", "documents", "doc_samples", "gallery", "banners", "blog"]
      .some((permission) => user.permissions.includes(permission))
  );
}

async function requireAdmin(request: Request) {
  const user = await getUserFromRequest(request);
  if (user?.role !== "admin") throw new Error("Доступ запрещён");
  return user;
}

function normalizePermissions(value: unknown) {
  const allowed = new Set<string>(PERMISSION_KEYS);
  return Array.isArray(value)
    ? [...new Set(value.filter((permission): permission is string => typeof permission === "string" && allowed.has(permission)))]
    : [];
}

type ManagedUserInput = {
  email?: string;
  display_name?: string;
  password?: string;
  role?: "admin" | "manager" | "user";
  permissions?: unknown;
  is_active?: boolean;
};

export async function listManagedUsers(request: Request) {
  await requireAdmin(request);
  const result = await getPool().query(
    `SELECT u.id, u.email, u.display_name, u.is_active, u.created_at,
            COALESCE(r.role, 'user') AS role,
            COALESCE(array_agg(p.permission) FILTER (WHERE p.permission IS NOT NULL), '{}')::text[] AS permissions
     FROM app_users u
     LEFT JOIN LATERAL (
       SELECT role FROM user_roles WHERE user_id = u.id
       ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'manager' THEN 2 ELSE 3 END LIMIT 1
     ) r ON true
     LEFT JOIN user_permissions p ON p.user_id = u.id
     GROUP BY u.id, u.email, u.display_name, u.is_active, u.created_at, r.role
     ORDER BY CASE r.role WHEN 'admin' THEN 1 WHEN 'manager' THEN 2 ELSE 3 END, lower(u.email)`,
  );
  return result.rows;
}

export async function createManagedUser(request: Request, input: ManagedUserInput) {
  await requireAdmin(request);
  const email = input.email?.trim().toLowerCase() ?? "";
  const password = input.password ?? "";
  if (!email || !email.includes("@")) throw new Error("Укажите корректный email");
  if (password.length < 8) throw new Error("Пароль должен быть не короче 8 символов");
  const role = input.role ?? "manager";
  const passwordHash = await bcrypt.hash(password, 12);
  const permissions = normalizePermissions(input.permissions);
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO app_users (email, password_hash, display_name, is_active)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [email, passwordHash, input.display_name?.trim() || null, input.is_active !== false],
    );
    await client.query("INSERT INTO user_roles (user_id, role) VALUES ($1, $2)", [inserted.rows[0].id, role]);
    for (const permission of permissions) {
      await client.query("INSERT INTO user_permissions (user_id, permission) VALUES ($1, $2)", [inserted.rows[0].id, permission]);
    }
    await client.query("COMMIT");
    return { id: inserted.rows[0].id };
  } catch (error) {
    await client.query("ROLLBACK");
    if (isUniqueViolation(error)) throw new Error("Пользователь с таким email уже существует");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateManagedUser(request: Request, id: string, input: ManagedUserInput) {
  const admin = await requireAdmin(request);
  const role = input.role ?? "manager";
  const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : null;
  if (input.password && input.password.length < 8) throw new Error("Пароль должен быть не короче 8 символов");
  const permissions = normalizePermissions(input.permissions);
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const current = await client.query<{ role: "admin" | "manager" | "user" }>(
      `SELECT role FROM user_roles WHERE user_id = $1 ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'manager' THEN 2 ELSE 3 END LIMIT 1`,
      [id],
    );
    if (!current.rows[0]) throw new Error("Пользователь не найден");
    const nextRole = admin.id === id ? "admin" : role;
    const values = [input.display_name?.trim() || null, admin.id === id ? true : input.is_active !== false, id];
    if (passwordHash) {
      await client.query("UPDATE app_users SET display_name = $1, is_active = $2, password_hash = $3 WHERE id = $4", [values[0], values[1], passwordHash, id]);
      if (admin.id !== id) await client.query("DELETE FROM app_sessions WHERE user_id = $1", [id]);
    } else {
      await client.query("UPDATE app_users SET display_name = $1, is_active = $2 WHERE id = $3", values);
    }
    await client.query("DELETE FROM user_roles WHERE user_id = $1", [id]);
    await client.query("INSERT INTO user_roles (user_id, role) VALUES ($1, $2)", [id, nextRole]);
    await client.query("DELETE FROM user_permissions WHERE user_id = $1", [id]);
    for (const permission of permissions) {
      await client.query("INSERT INTO user_permissions (user_id, permission) VALUES ($1, $2)", [id, permission]);
    }
    await client.query("COMMIT");
    return { id };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function requestPasswordReset(email: string, origin: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await getPool().query<{ id: string; email: string }>(
    "SELECT id, email FROM app_users WHERE lower(email) = $1 AND is_active = true LIMIT 1",
    [normalizedEmail],
  );
  if (!user.rows[0]) return { ok: true };

  const rawToken = randomBytes(32).toString("hex");
  await getPool().query("DELETE FROM password_reset_tokens WHERE user_id = $1", [user.rows[0].id]);
  await getPool().query(
    `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
     VALUES ($1, $2, now() + interval '1 hour')`,
    [hashToken(rawToken), user.rows[0].id],
  );

  const baseUrl = (process.env.APP_URL || origin).replace(/\/+$/, "");
  const resetUrl = `${baseUrl}/auth?reset=${encodeURIComponent(rawToken)}`;
  try {
    await sendPasswordResetEmail(user.rows[0].email, resetUrl);
  } catch (error) {
    await getPool().query("DELETE FROM password_reset_tokens WHERE token_hash = $1", [hashToken(rawToken)]);
    throw error;
  }
  return { ok: true };
}

export async function resetPassword(token: string, password: string) {
  if (password.length < 8) throw new Error("Пароль должен быть не короче 8 символов");
  const passwordHash = await bcrypt.hash(password, 12);
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const tokenResult = await client.query<{ user_id: string }>(
      `SELECT user_id FROM password_reset_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
       LIMIT 1`,
      [hashToken(token)],
    );
    if (!tokenResult.rows[0]) throw new Error("Ссылка недействительна или срок её действия истёк");
    const userId = tokenResult.rows[0].user_id;
    await client.query("UPDATE app_users SET password_hash = $1 WHERE id = $2 AND is_active = true", [passwordHash, userId]);
    await client.query("UPDATE password_reset_tokens SET used_at = now() WHERE token_hash = $1", [hashToken(token)]);
    await client.query("DELETE FROM app_sessions WHERE user_id = $1", [userId]);
    await client.query("COMMIT");
    return { ok: true };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function sendPasswordResetEmail(recipient: string, resetUrl: string) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) throw new Error("Почта для восстановления пароля не настроена");
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 465),
    secure: parseBoolean(process.env.SMTP_SECURE, true),
    auth: { user, pass },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM || user,
    to: recipient,
    subject: "Восстановление пароля — ЦПР Партнер",
    text: `Для создания нового пароля перейдите по ссылке:\n${resetUrl}\n\nСсылка действует 1 час. Если вы не запрашивали восстановление, проигнорируйте письмо.`,
    html: `<p>Для создания нового пароля перейдите по ссылке:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Ссылка действует 1 час. Если вы не запрашивали восстановление, проигнорируйте письмо.</p>`,
  });
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
  const canManage = canManageTable(user, input.table);
  if (input.action === "select" && !PUBLIC_TABLES.has(input.table) && !canManage) {
    throw new Error("Доступ запрещён");
  }
  if (ADMIN_ONLY_TABLES.has(input.table) && !canManage) {
    if (!(input.table === "applications" && input.action === "insert")) throw new Error("Доступ запрещён");
  }
  if (input.action !== "select" && !(input.table === "applications" && input.action === "insert") && !(input.table === "course_reviews" && input.action === "insert")) {
    if (!canManage) throw new Error("Доступ запрещён");
  }

  if (!canManage && input.table === "courses") {
    input.filters = [...(input.filters ?? []), { op: "eq", column: "published", value: true }];
  }
  if (!canManage && input.table === "blog_posts") {
    input.filters = [...(input.filters ?? []), { op: "eq", column: "published", value: true }];
  }
  if (!canManage && input.table === "teachers") {
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
  const orderBy = (input.orders ?? []).map((order) =>
    `${identifier(order.column)} ${order.ascending === false ? "DESC" : "ASC"}${order.nullsFirst === true ? " NULLS FIRST" : order.nullsFirst === false ? " NULLS LAST" : ""}`,
  );
  if (orderBy.length) sql += ` ORDER BY ${orderBy.join(", ")}`;
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
      const tuples = values.map((row) => `(${keys.map((key) => { params.push(prepareValue(input.table, key, row[key])); return `$${params.length}`; }).join(", ")})`);
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
        sql = `UPDATE ${identifier(input.table)} SET ${keys.map((key) => { params.push(prepareValue(input.table, key, payload[key])); return `${identifier(key)} = $${params.length}`; }).join(", ")}`;
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

function prepareValue(table: string, column: string, value: unknown) {
  if (value === null || value === undefined) return value;
  if (!JSONB_COLUMNS[table]?.has(column)) return value;
  return typeof value === "string" ? value : JSON.stringify(value);
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

function parseBoolean(value: string | undefined, defaultValue: boolean) {
  if (value == null) return defaultValue;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export { PUBLIC_TABLES };
