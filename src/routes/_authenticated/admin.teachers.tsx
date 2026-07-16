import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { adminTeachersQuery } from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/teachers")({
  component: TeachersAdmin,
});

type Row = {
  id: string;
  full_name: string;
  position: string | null;
  bio: string | null;
  credentials: string | null;
  photo_url: string | null;
  sort_order: number;
  is_published: boolean;
};

function TeachersAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery(adminTeachersQuery);
  const [draft, setDraft] = useState<Partial<Row> | null>(null);

  async function save(row: Partial<Row>) {
    if (!row.full_name?.trim()) return toast.error("Имя обязательно");
    const payload = {
      full_name: row.full_name.trim(),
      position: row.position || null,
      bio: row.bio || null,
      credentials: row.credentials || null,
      photo_url: row.photo_url || null,
      sort_order: row.sort_order ?? 0,
      is_published: row.is_published ?? true,
    };
    const { error } = row.id
      ? await supabase.from("teachers").update(payload).eq("id", row.id)
      : await supabase.from("teachers").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Сохранено");
    setDraft(null);
    qc.invalidateQueries({ queryKey: ["admin", "teachers"] });
    qc.invalidateQueries({ queryKey: ["teachers", "published"] });
  }

  async function remove(id: string) {
    if (!confirm("Удалить преподавателя?")) return;
    const { error } = await supabase.from("teachers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "teachers"] });
    qc.invalidateQueries({ queryKey: ["teachers", "published"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">Преподаватели</h1>
        <Button onClick={() => setDraft({ full_name: "", sort_order: (data?.length ?? 0) * 10, is_published: true })} className="rounded-full bg-gradient-teal">
          <Plus className="h-4 w-4" /> Добавить
        </Button>
      </div>

      {draft && <Editor row={draft as Row} onChange={setDraft} onSave={() => save(draft)} onCancel={() => setDraft(null)} />}

      <div className="mt-6 grid gap-3">
        {(data ?? []).map((t) => (
          <article key={t.id} className="rounded-2xl bg-card p-4 shadow-soft border border-border/40 flex gap-4">
            {t.photo_url ? (
              <img src={t.photo_url} alt={t.full_name} className="h-20 w-20 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="h-20 w-20 rounded-xl bg-muted shrink-0" />
            )}
            <div className="flex-1">
              <div className="font-semibold">{t.full_name}</div>
              {t.position && <div className="text-sm text-muted-foreground">{t.position}</div>}
              {t.credentials && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.credentials}</div>}
            </div>
            <div className="flex flex-col gap-2">
              <Button size="sm" variant="outline" onClick={() => setDraft(t)}>Изменить</Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(t.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </article>
        ))}
        {(data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Пока никого нет.</p>}
      </div>
    </div>
  );
}

function Editor({ row, onChange, onSave, onCancel }: { row: Row; onChange: (r: Partial<Row>) => void; onSave: () => void; onCancel: () => void }) {
  return (
    <div className="mt-6 rounded-2xl bg-card p-5 shadow-card border border-primary/30 space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <Label>ФИО *</Label>
          <Input value={row.full_name} onChange={(e) => onChange({ ...row, full_name: e.target.value })} />
        </div>
        <div>
          <Label>Должность</Label>
          <Input value={row.position ?? ""} onChange={(e) => onChange({ ...row, position: e.target.value })} placeholder="Преподаватель охраны труда" />
        </div>
        <div className="lg:col-span-2">
          <Label>Регалии / опыт</Label>
          <Textarea value={row.credentials ?? ""} onChange={(e) => onChange({ ...row, credentials: e.target.value })} rows={2} />
        </div>
        <div className="lg:col-span-2">
          <Label>Био</Label>
          <Textarea value={row.bio ?? ""} onChange={(e) => onChange({ ...row, bio: e.target.value })} rows={4} />
        </div>
        <div className="lg:col-span-2">
          <Label>Фото</Label>
          <ImageUpload value={row.photo_url ?? ""} onChange={(v) => onChange({ ...row, photo_url: v })} />
        </div>
        <div>
          <Label>Порядок</Label>
          <Input type="number" value={row.sort_order} onChange={(e) => onChange({ ...row, sort_order: Number(e.target.value) })} />
        </div>
        <div className="flex items-end">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={row.is_published} onChange={(e) => onChange({ ...row, is_published: e.target.checked })} className="h-4 w-4 accent-primary" />
            Опубликован
          </label>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={onSave} className="rounded-full bg-gradient-teal"><Save className="h-4 w-4" /> Сохранить</Button>
        <Button variant="outline" onClick={onCancel} className="rounded-full">Отмена</Button>
      </div>
    </div>
  );
}
