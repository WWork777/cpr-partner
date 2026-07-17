import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { executeTableRequest, getUserFromRequest, login, logout, signup } from "./local-db.server";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function handleLocalApi(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname === "/api/db" && request.method === "POST") {
    try {
      const result = await executeTableRequest(request, await request.json());
      return json({ data: result, error: null });
    } catch (error) {
      console.error("Database API error", error);
      return json({ data: null, error: { message: error instanceof Error ? error.message : "Database request failed" } }, 400);
    }
  }

  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    const body = await request.json() as { email?: string; password?: string };
    const result = await login(body.email ?? "", body.password ?? "");
    return result.error ? json({ data: null, error: { message: result.error } }, 401) : json({ data: result, error: null });
  }
  if (url.pathname === "/api/auth/signup" && request.method === "POST") {
    const body = await request.json() as { email?: string; password?: string };
    try {
      const result = await signup(body.email ?? "", body.password ?? "");
      return result.error ? json({ data: null, error: { message: result.error } }, 400) : json({ data: result, error: null });
    } catch (error) {
      return json({ data: null, error: { message: error instanceof Error ? error.message : "Registration failed" } }, 400);
    }
  }
  if (url.pathname === "/api/auth/session" && request.method === "GET") {
    return json({ data: { user: await getUserFromRequest(request) }, error: null });
  }
  if (url.pathname === "/api/auth/logout" && request.method === "POST") {
    await logout(request);
    return json({ data: null, error: null });
  }
  if (url.pathname === "/api/auth/has-role" && request.method === "POST") {
    const body = await request.json() as { userId?: string; role?: string };
    const user = await getUserFromRequest(request);
    return json({ data: !!user && user.id === body.userId && user.role === body.role, error: null });
  }
  if (url.pathname === "/api/storage" && request.method === "POST") {
    const user = await getUserFromRequest(request);
    if (user?.role !== "admin") return json({ data: null, error: { message: "Доступ запрещён" } }, 401);
    try {
      const form = await request.formData();
      const file = form.get("file");
      const requestedPath = String(form.get("path") ?? "");
      if (!(file instanceof File) || !requestedPath) return json({ data: null, error: { message: "Файл не передан" } }, 400);
      const safePath = requestedPath.replace(/[^a-zA-Z0-9._/-]/g, "_").replace(/^\/+/, "");
      if (safePath.includes("..")) return json({ data: null, error: { message: "Некорректный путь" } }, 400);
      const root = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
      const target = path.join(root, safePath);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, Buffer.from(await file.arrayBuffer()), { flag: "wx" });
      return json({ data: { path: safePath }, error: null });
    } catch (error) {
      return json({ data: null, error: { message: error instanceof Error ? error.message : "Не удалось сохранить файл" } }, 400);
    }
  }
  return null;
}

export async function serveUpload(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/uploads/") || request.method !== "GET") return null;
  const relative = decodeURIComponent(url.pathname.slice("/uploads/".length));
  if (!relative || relative.includes("..")) return new Response("Not found", { status: 404 });
  const root = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");
  try {
    const body = await readFile(path.join(root, relative));
    const ext = path.extname(relative).toLowerCase();
    const contentType = ({ ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".pdf": "application/pdf" } as Record<string, string>)[ext] || "application/octet-stream";
    return new Response(body, { headers: { "content-type": contentType, "cache-control": "public, max-age=31536000, immutable" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
