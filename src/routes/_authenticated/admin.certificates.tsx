import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { db } from "@/integrations/database/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const certsQuery = queryOptions({
  queryKey: ["admin", "certificates"],
  queryFn: async () => {
    const { data, error } = await db
      .from("certificates")
      .select("*")
      .order("issued_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/_authenticated/admin/certificates")({
  component: CertsAdmin,
});

type Form = {
  id: string | null;
  number: string;
  full_name: string;
  course_title: string;
  issued_at: string;
  valid_until: string;
  registry_no: string;
};

const empty: Form = {
  id: null,
  number: "",
  full_name: "",
  course_title: "",
  issued_at: new Date().toISOString().slice(0, 10),
  valid_until: "",
  registry_no: "",
};

function CertsAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(certsQuery);
  const [form, setForm] = useState<Form | null>(null);
  const [q, setQ] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const payload = {
      number: form.number.trim(),
      full_name: form.full_name.trim(),
      course_title: form.course_title.trim(),
      issued_at: form.issued_at,
      valid_until: form.valid_until || null,
      registry_no: form.registry_no || null,
    };
    const res = form.id
      ? await db.from("certificates").update(payload).eq("id", form.id)
      : await db.from("certificates").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Сохранено");
    setForm(null);
    qc.invalidateQueries({ queryKey: ["admin", "certificates"] });
  }

  async function remove(id: string) {
    if (!confirm("Удалить удостоверение?")) return;
    const { error } = await db.from("certificates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "certificates"] });
  }

  const filtered = (data ?? []).filter((c) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (
      c.number.toLowerCase().includes(s) ||
      c.full_name.toLowerCase().includes(s) ||
      c.course_title.toLowerCase().includes(s)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Реестр удостоверений</h1>
          <p className="mt-2 text-muted-foreground">
            Документы, доступные для проверки на /verify
          </p>
        </div>
        <Button onClick={() => setForm(empty)} className="rounded-full bg-gradient-teal">
          <Plus className="h-4 w-4" /> Добавить
        </Button>
      </div>

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Поиск по номеру / ФИО / программе"
        className="mt-6 max-w-md"
      />

      <div className="mt-4 rounded-2xl bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Загрузка…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Записей нет</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((c) => (
              <div key={c.id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm">{c.number}</div>
                  <div className="text-sm mt-0.5">
                    <b>{c.full_name}</b> · {c.course_title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Выдано: {new Date(c.issued_at).toLocaleDateString("ru-RU")}
                    {c.valid_until && ` · действует до ${new Date(c.valid_until).toLocaleDateString("ru-RU")}`}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setForm({
                      id: c.id,
                      number: c.number,
                      full_name: c.full_name,
                      course_title: c.course_title,
                      issued_at: c.issued_at,
                      valid_until: c.valid_until ?? "",
                      registry_no: c.registry_no ?? "",
                    })
                  }
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => remove(c.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {form && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={save}
            className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-card space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {form.id ? "Редактирование" : "Новое удостоверение"}
              </h2>
              <button type="button" onClick={() => setForm(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <FieldF label="Номер документа" required>
                <Input
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  required
                />
              </FieldF>
              <FieldF label="Реестровый номер">
                <Input
                  value={form.registry_no}
                  onChange={(e) => setForm({ ...form, registry_no: e.target.value })}
                />
              </FieldF>
              <FieldF label="ФИО" required className="sm:col-span-2">
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                />
              </FieldF>
              <FieldF label="Программа / курс" required className="sm:col-span-2">
                <Input
                  value={form.course_title}
                  onChange={(e) => setForm({ ...form, course_title: e.target.value })}
                  required
                />
              </FieldF>
              <FieldF label="Дата выдачи" required>
                <Input
                  type="date"
                  value={form.issued_at}
                  onChange={(e) => setForm({ ...form, issued_at: e.target.value })}
                  required
                />
              </FieldF>
              <FieldF label="Действует до">
                <Input
                  type="date"
                  value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                />
              </FieldF>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="rounded-full bg-gradient-teal">
                Сохранить
              </Button>
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setForm(null)}>
                Отмена
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function FieldF({
  label,
  children,
  required,
  className,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
