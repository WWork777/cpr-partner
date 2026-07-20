import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Save, ShieldCheck, UserRound } from "lucide-react";
import { db } from "@/integrations/database/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DEFAULT_MANAGER_PERMISSIONS, PERMISSION_KEYS, PERMISSION_LABELS, type PermissionKey } from "@/lib/permissions";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersPage,
});

type Role = "admin" | "manager" | "user";

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  role: Role;
  permissions: string[];
  is_active: boolean;
  created_at: string;
};

type Draft = {
  id?: string;
  email: string;
  display_name: string;
  password: string;
  role: Role;
  permissions: PermissionKey[];
  is_active: boolean;
};

const emptyDraft: Draft = {
  email: "",
  display_name: "",
  password: "",
  role: "manager",
  permissions: [...DEFAULT_MANAGER_PERMISSIONS],
  is_active: true,
};

function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await db.admin.listUsers();
      if (error) return toast.error(error.message);
      setUsers((data ?? []) as UserRow[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось загрузить пользователей");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function startEdit(user: UserRow) {
    setDraft({
      id: user.id,
      email: user.email,
      display_name: user.display_name ?? "",
      password: "",
      role: user.role,
      permissions: PERMISSION_KEYS.filter((key) => user.permissions.includes(key)),
      is_active: user.is_active,
    });
  }

  function togglePermission(permission: PermissionKey) {
    setDraft((current) => {
      if (!current) return current;
      const permissions = current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission];
      return { ...current, permissions };
    });
  }

  async function save() {
    if (!draft) return;
    if (!draft.email.trim() || !draft.email.includes("@")) return toast.error("Укажите корректный email");
    if (!draft.id && draft.password.length < 8) return toast.error("Пароль должен быть не короче 8 символов");
    if (draft.id && draft.password && draft.password.length < 8) return toast.error("Пароль должен быть не короче 8 символов");
    setSaving(true);
    try {
      const payload = {
        email: draft.email.trim(),
        display_name: draft.display_name.trim(),
        password: draft.password || undefined,
        role: draft.role,
        permissions: draft.permissions,
        is_active: draft.is_active,
      };
      const result = draft.id
        ? await db.admin.updateUser(draft.id, payload)
        : await db.admin.createUser(payload);
      if (result.error) return toast.error(result.error.message);
      toast.success(draft.id ? "Пользователь изменён" : "Пользователь создан");
      setDraft(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить пользователя");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Пользователи</h1>
          <p className="mt-2 text-sm text-muted-foreground">Создавайте менеджеров и задавайте им доступ к разделам админки.</p>
        </div>
        <Button onClick={() => setDraft({ ...emptyDraft, permissions: [...emptyDraft.permissions] })} className="rounded-full bg-gradient-teal">
          <Plus className="h-4 w-4" /> Добавить пользователя
        </Button>
      </div>

      {draft && (
        <section className="mt-6 rounded-2xl border border-primary/30 bg-card p-5 shadow-card">
          <div className="flex items-center gap-2">
            {draft.role === "admin" ? <ShieldCheck className="h-5 w-5 text-primary" /> : <UserRound className="h-5 w-5 text-primary" />}
            <h2 className="font-bold">{draft.id ? "Изменение пользователя" : "Новый пользователь"}</h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <Label>Email / логин *</Label>
              <Input value={draft.email} disabled={!!draft.id} onChange={(e) => setDraft({ ...draft, email: e.target.value })} type="email" />
            </div>
            <div>
              <Label>Имя сотрудника</Label>
              <Input value={draft.display_name} onChange={(e) => setDraft({ ...draft, display_name: e.target.value })} placeholder="Например, Елена" />
            </div>
            <div>
              <Label>{draft.id ? "Новый пароль (необязательно)" : "Пароль *"}</Label>
              <Input value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} type="password" minLength={8} placeholder="Минимум 8 символов" />
            </div>
            <div>
              <Label>Роль</Label>
              <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as Role })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="manager">Менеджер</option>
                <option value="user">Пользователь</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
          </div>

          <div className="mt-5">
            <Label>Права доступа</Label>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {PERMISSION_KEYS.map((permission) => (
                <label key={permission} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${draft.role === "admin" ? "opacity-50" : ""}`}>
                  <input type="checkbox" checked={draft.role === "admin" || draft.permissions.includes(permission)} disabled={draft.role === "admin"} onChange={() => togglePermission(permission)} className="h-4 w-4 accent-primary" />
                  {PERMISSION_LABELS[permission]}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Администратор имеет полный доступ. У менеджера работают только отмеченные разделы.</p>
          </div>

          <label className="mt-5 inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} className="h-4 w-4 accent-primary" />
            Пользователь активен
          </label>

          <div className="mt-5 flex gap-2">
            <Button onClick={save} disabled={saving} className="rounded-full bg-gradient-teal"><Save className="h-4 w-4" /> {saving ? "Сохраняем…" : "Сохранить"}</Button>
            <Button variant="outline" onClick={() => setDraft(null)} className="rounded-full">Отмена</Button>
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-3">
        {loading && <p className="text-sm text-muted-foreground">Загрузка…</p>}
        {!loading && users.map((user) => (
          <article key={user.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border/40 bg-card p-4 shadow-soft">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${user.is_active ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"}`}>
              {user.role === "admin" ? <ShieldCheck className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">{user.display_name || user.email}</div>
              <div className="text-sm text-muted-foreground truncate">{user.email}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {user.role === "admin" ? "Администратор" : user.role === "manager" ? "Менеджер" : "Пользователь"} · {user.is_active ? "активен" : "отключён"}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => startEdit(user)}>Изменить</Button>
          </article>
        ))}
        {!loading && users.length === 0 && <p className="text-sm text-muted-foreground">Пользователей пока нет.</p>}
      </div>
    </div>
  );
}
