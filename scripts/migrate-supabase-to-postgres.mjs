import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import pg from "pg";

const { Client } = pg;
const projectRoot = process.cwd();
let sourceUrl;
let sourceKey;
let sourceToken;
const uploadsRoot = path.resolve(projectRoot, process.env.UPLOADS_DIR || "uploads");
const migrationRoot = path.resolve(projectRoot, "migration-uploads");
const legacyAssetBase = process.env.LEGACY_ASSET_BASE || "https://id-preview--f6a1da5e-53de-47cb-b9c1-8823480742c1.lovable.app";
const tables = [
  ["categories", ["id"]],
  ["courses", ["id"]],
  ["applications", ["id"]],
  ["blog_posts", ["id"]],
  ["certificates", ["id"]],
  ["banners", ["id"]],
  ["promocodes", ["id"]],
  ["course_schedules", ["id"]],
  ["course_reviews", ["id"]],
  ["teachers", ["id"]],
  ["org_documents", ["id"]],
  ["gallery_images", ["id"]],
  ["document_samples", ["doc_type"]],
  ["public_schedule", ["id"]],
  ["user_roles", ["user_id", "role"]],
  ["app_settings", ["key"]],
  ["audit_log", ["id"]],
  ["course_teachers", ["course_id", "teacher_id"]],
];
const jsonColumns = new Set(["features", "steps", "faqs", "value", "diff", "sets"]);
const stats = { rows: 0, localized: 0, external: 0, missingFiles: [] };
const urlMap = new Map();

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

async function loadEnvFile() {
  if (process.env.DATABASE_URL) return;
  const envPath = path.join(projectRoot, ".env");
  const text = await fs.readFile(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^"|"$/g, "");
  }
}

async function fetchTable(table) {
  const result = [];
  for (let offset = 0; ; offset += 1000) {
    const query = new URLSearchParams({ select: "*", limit: "1000", offset: String(offset) });
    const response = await fetch(`${sourceUrl}/rest/v1/${table}?${query}`, {
      headers: { apikey: sourceKey, authorization: `Bearer ${sourceToken}` },
    });
    const body = await response.text();
    if (!response.ok) {
      if (response.status === 404 && table === "app_settings") return [];
      throw new Error(`${table}: Supabase ${response.status}: ${body.slice(0, 300)}`);
    }
    const rows = JSON.parse(body);
    result.push(...rows);
    if (rows.length < 1000) return result;
  }
}

async function buildAssetIndex() {
  const index = new Map();
  const entries = await fs.readdir(path.join(projectRoot, "src/assets"), { recursive: true, withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || entry.name.endsWith(".json")) continue;
    const absolute = path.join(entry.parentPath, entry.name);
    if (!index.has(entry.name)) index.set(entry.name, absolute);
  }
  return index;
}

async function localizeUrl(value, folder, rowId, assetIndex) {
  if (typeof value !== "string" || !value) return value;
  if (value.startsWith("/uploads/")) return value;
  if (urlMap.has(value)) return urlMap.get(value);

  const sourcePath = value.startsWith("/")
    ? value.split("?")[0]
    : new URL(value).pathname;
  const fileName = path.basename(sourcePath);
  const signedFile = await findMigrationFile(folder, rowId);
  const sourceFile = signedFile || assetIndex.get(fileName);

  const suffix = folder === "audit" ? `-${crypto.createHash("sha1").update(value).digest("hex").slice(0, 10)}` : "";
  const assetName = `${rowId}${suffix}-${fileName}`;
  const relative = path.join("migrated", folder, assetName);
  const target = path.join(uploadsRoot, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  if (sourceFile) {
    await fs.copyFile(sourceFile, target);
  } else if (sourcePath.startsWith("/__l5e/")) {
    const response = await fetch(`${legacyAssetBase}${sourcePath}`);
    if (!response.ok) {
      stats.missingFiles.push(`${folder}/${rowId}: ${value}`);
      return value;
    }
    await fs.writeFile(target, Buffer.from(await response.arrayBuffer()));
  } else if (value.includes("supabase.co")) {
    const response = await fetch(value);
    if (!response.ok) {
      stats.missingFiles.push(`${folder}/${rowId}: ${value}`);
      return value;
    }
    await fs.writeFile(target, Buffer.from(await response.arrayBuffer()));
  } else {
    if (value.startsWith("http")) stats.external += 1;
    return value;
  }
  stats.localized += 1;
  const localUrl = `/uploads/${relative.split(path.sep).join("/")}`;
  urlMap.set(value, localUrl);
  return localUrl;
}

async function localizeNested(value, folder, rowId, assetIndex) {
  if (Array.isArray(value)) return Promise.all(value.map((item) => localizeNested(item, folder, rowId, assetIndex)));
  if (value && typeof value === "object") {
    const result = {};
    for (const [key, item] of Object.entries(value)) result[key] = await localizeNested(item, folder, rowId, assetIndex);
    return result;
  }
  if (typeof value === "string" && (value.startsWith("/__l5e/") || value.includes("supabase.co"))) {
    return localizeUrl(value, folder, rowId, assetIndex);
  }
  return value;
}

async function findMigrationFile(folder, rowId) {
  const directory = path.join(migrationRoot, folder);
  let names;
  try {
    names = await fs.readdir(directory);
  } catch {
    return null;
  }
  const name = names.find((candidate) => candidate.startsWith(`${rowId}.`));
  return name ? path.join(directory, name) : null;
}

async function localizeRow(table, row, assetIndex) {
  const result = { ...row };
  const fields = {
    courses: ["image_url", "document_sample_url"],
    teachers: ["photo_url"],
    blog_posts: ["cover_url"],
    gallery_images: ["image_url"],
    document_samples: ["file_url", "preview_url"],
  }[table] || [];
  for (const field of fields) {
    if (result[field]) result[field] = await localizeUrl(result[field], table, result.id || result.doc_type, assetIndex);
  }
  if (table === "audit_log" && result.diff) result.diff = await localizeNested(result.diff, "audit", result.id, assetIndex);
  return result;
}

async function getTargetColumns(client, table) {
  const result = await client.query(
    "select column_name from information_schema.columns where table_schema = 'public' and table_name = $1",
    [table],
  );
  return new Set(result.rows.map((row) => row.column_name));
}

async function upsertRows(client, table, keys, rows, columns) {
  for (const row of rows) {
    const values = Object.entries(row).filter(([column]) => columns.has(column));
    if (!values.length) continue;
    const names = values.map(([column]) => column);
    const params = values.map(([, value]) => value);
    const placeholders = params.map((_, index) => `$${index + 1}`);
    const updates = names.filter((column) => !keys.includes(column));
    const updateSql = updates.length
      ? updates.map((column) => `${quoteIdentifier(column)} = excluded.${quoteIdentifier(column)}`).join(", ")
      : `${quoteIdentifier(keys[0])} = excluded.${quoteIdentifier(keys[0])}`;
    const prepared = params.map((value, index) => jsonColumns.has(names[index]) && value != null ? JSON.stringify(value) : value);
    await client.query(
      `insert into ${quoteIdentifier(table)} (${names.map(quoteIdentifier).join(", ")}) values (${placeholders.join(", ")}) on conflict (${keys.map(quoteIdentifier).join(", ")}) do update set ${updateSql}`,
      prepared,
    );
    stats.rows += 1;
  }
}

await loadEnvFile();
sourceUrl = process.env.SUPABASE_URL;
sourceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
if (!sourceUrl || !sourceKey || !process.env.DATABASE_URL) {
  throw new Error("Нужны SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY/SERVICE_ROLE_KEY и DATABASE_URL");
}
sourceToken = process.env.SUPABASE_ACCESS_TOKEN || sourceKey;
if (process.env.SUPABASE_EMAIL && process.env.SUPABASE_PASSWORD) {
  const response = await fetch(`${sourceUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: sourceKey, "content-type": "application/json" },
    body: JSON.stringify({ email: process.env.SUPABASE_EMAIL, password: process.env.SUPABASE_PASSWORD }),
  });
  const body = await response.json();
  if (!response.ok || !body.access_token) throw new Error(`Не удалось войти в старый Supabase: ${body.error_description || body.message || response.status}`);
  sourceToken = body.access_token;
}
const client = new Client({ connectionString: process.env.DATABASE_URL });
const assetIndex = await buildAssetIndex();
const sourceRowsByTable = new Map();
await client.connect();
try {
  await client.query("begin");
  const roleTarget = process.env.MIGRATE_ROLE_TO_EMAIL
    ? (await client.query("select id from app_users where lower(email) = lower($1)", [process.env.MIGRATE_ROLE_TO_EMAIL])).rows[0]?.id
    : undefined;
  for (const [table, keys] of tables) {
    const sourceRows = await fetchTable(table);
    sourceRowsByTable.set(table, sourceRows);
    if (table === "course_schedules") {
      const sourceCourses = sourceRowsByTable.get("courses") || [];
      const courseIds = new Set(sourceCourses.map((course) => course.id));
      const missingCourseIds = [...new Set(sourceRows.map((schedule) => schedule.course_id).filter((id) => !courseIds.has(id)))];
      if (missingCourseIds.length) {
        const placeholders = missingCourseIds.map((id) => ({
          id,
          slug: `archived-${id}`,
          title: `Архивный курс ${id.slice(0, 8)}`,
          description: "Карточка курса отсутствовала в старой базе, но поток сохранён из расписания.",
          published: false,
        }));
        await upsertRows(client, "courses", ["id"], placeholders, await getTargetColumns(client, "courses"));
        console.warn(`Созданы скрытые карточки для ${missingCourseIds.length} курсов, на которые ссылалось старое расписание`);
      }
    }
    const localizedRows = [];
    for (const row of sourceRows) {
      const localized = await localizeRow(table, row, assetIndex);
      if (table === "user_roles" && roleTarget) localized.user_id = roleTarget;
      localizedRows.push(localized);
    }
    if (table === "user_roles" && !roleTarget) {
      console.warn("Роль старого Supabase не перенесена: MIGRATE_ROLE_TO_EMAIL не найден в локальных app_users");
      continue;
    }
    await upsertRows(client, table, keys, localizedRows, await getTargetColumns(client, table));
    console.log(`${table}: ${sourceRows.length}`);
  }
  await client.query("commit");
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}

console.log(`Перенесено строк: ${stats.rows}`);
console.log(`Локализовано файлов: ${stats.localized}`);
console.log(`Внешних ссылок оставлено: ${stats.external}`);
if (stats.missingFiles.length) {
  console.warn("Не найдены файлы Supabase:");
  for (const item of stats.missingFiles) console.warn(item);
}
