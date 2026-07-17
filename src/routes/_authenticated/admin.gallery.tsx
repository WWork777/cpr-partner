import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Save, ArrowUp, ArrowDown } from "lucide-react";
import { db } from "@/integrations/database/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { adminGalleryQuery } from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/gallery")({
  component: GalleryAdmin,
});

type Row = {
  id: string;
  image_url: string;
  alt: string | null;
  section: string;
  sort_order: number;
  is_published: boolean;
};

function GalleryAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery(adminGalleryQuery);
  const [draft, setDraft] = useState<Partial<Row> | null>(null);

  async function save(row: Partial<Row>) {
    if (!row.image_url?.trim()) return toast.error("Загрузите картинку");
    const payload = {
      image_url: row.image_url,
      alt: row.alt || null,
      section: row.section || "home",
      sort_order: row.sort_order ?? 0,
      is_published: row.is_published ?? true,
    };
    const { error } = row.id
      ? await db.from("gallery_images").update(payload).eq("id", row.id)
      : await db.from("gallery_images").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Сохранено");
    setDraft(null);
    qc.invalidateQueries({ queryKey: ["admin", "gallery"] });
    qc.invalidateQueries({ queryKey: ["gallery", "published"] });
  }

  async function remove(id: string) {
    if (!confirm("Удалить картинку?")) return;
    const { error } = await db.from("gallery_images").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "gallery"] });
    qc.invalidateQueries({ queryKey: ["gallery", "published"] });
  }

  async function move(id: string, dir: -1 | 1) {
    const row = data?.find((x) => x.id === id);
    if (!row) return;
    const next = row.sort_order + dir * 10;
    await db.from("gallery_images").update({ sort_order: next }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "gallery"] });
    qc.invalidateQueries({ queryKey: ["gallery", "published"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">Галерея</h1>
        <Button onClick={() => setDraft({ image_url: "", section: "home", sort_order: (data?.length ?? 0) * 10, is_published: true })} className="rounded-full bg-gradient-teal">
          <Plus className="h-4 w-4" /> Добавить
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Изображения для блока на главной и страницы «Галерея».</p>

      {draft && (
        <div className="mt-6 rounded-2xl bg-card p-5 shadow-card border border-primary/30 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <Label>Картинка *</Label>
              <ImageUpload value={draft.image_url ?? ""} onChange={(v) => setDraft({ ...draft, image_url: v })} />
            </div>
            <div className="lg:col-span-2">
              <Label>Подпись (alt)</Label>
              <Input value={draft.alt ?? ""} onChange={(e) => setDraft({ ...draft, alt: e.target.value })} />
            </div>
            <div>
              <Label>Раздел</Label>
              <Select value={draft.section ?? "home"} onValueChange={(v) => setDraft({ ...draft, section: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Главная + страница галереи</SelectItem>
                  <SelectItem value="page">Только страница галереи</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Порядок</Label>
              <Input type="number" value={draft.sort_order ?? 0} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={draft.is_published ?? true} onChange={(e) => setDraft({ ...draft, is_published: e.target.checked })} className="h-4 w-4 accent-primary" />
                Опубликовано
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => save(draft)} className="rounded-full bg-gradient-teal"><Save className="h-4 w-4" /> Сохранить</Button>
            <Button variant="outline" onClick={() => setDraft(null)} className="rounded-full">Отмена</Button>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {(data ?? []).map((g) => (
          <article key={g.id} className="rounded-2xl bg-card p-2 shadow-soft border border-border/40">
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              {g.image_url && <img src={g.image_url} alt={g.alt ?? ""} className="h-full w-full object-cover" />}
            </div>
            <div className="px-1 py-2">
              <div className="text-xs text-muted-foreground truncate">{g.alt || "—"}</div>
              <div className="mt-2 flex justify-between gap-1">
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => move(g.id, -1)}><ArrowUp className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => move(g.id, 1)}><ArrowDown className="h-3 w-3" /></Button>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setDraft(g)}>Ред.</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(g.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          </article>
        ))}
        {(data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Картинок пока нет.</p>}
      </div>
    </div>
  );
}
