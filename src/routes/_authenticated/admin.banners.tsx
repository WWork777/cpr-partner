import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { db } from "@/integrations/database/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/ImageUpload";

export const Route = createFileRoute("/_authenticated/admin/banners")({
  component: BannersAdmin,
});

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  cta_label: string | null;
  sort_order: number;
  is_active: boolean;
  placement: string | null;
  badge: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

const emptyDraft = {
  title: "",
  subtitle: "",
  image_url: "",
  link_url: "",
  cta_label: "Подробнее",
  sort_order: 0,
  placement: "home" as "home" | "popup",
  badge: "",
  starts_at: "",
  ends_at: "",
};

function BannersAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: async () => {
      const { data, error } = await db.from("banners").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Banner[];
    },
  });

  const [draft, setDraft] = useState(emptyDraft);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) return;
    const payload: any = { ...draft, is_active: true };
    payload.starts_at = draft.starts_at ? new Date(draft.starts_at).toISOString() : null;
    payload.ends_at = draft.ends_at ? new Date(draft.ends_at).toISOString() : null;
    payload.badge = draft.badge || null;
    const { error } = await (db.from("banners") as any).insert(payload);
    if (error) return toast.error(error.message);
    setDraft(emptyDraft);
    qc.invalidateQueries({ queryKey: ["admin", "banners"] });
    toast.success("Сохранено");
  }

  async function update(id: string, patch: Record<string, any>) {
    const { error } = await (db.from("banners") as any).update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else {
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      qc.invalidateQueries({ queryKey: ["banners", "active"] });
      qc.invalidateQueries({ queryKey: ["banners", "popup"] });
    }
  }

  async function remove(id: string) {
    if (!confirm("Удалить?")) return;
    const { error } = await db.from("banners").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      qc.invalidateQueries({ queryKey: ["admin", "banners"] });
      qc.invalidateQueries({ queryKey: ["banners", "active"] });
      qc.invalidateQueries({ queryKey: ["banners", "popup"] });
      toast.success("Удалено");
    }
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold">Баннеры и акции</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        «На главной» — карточки в сетке. «Попап-акция» — модальное окно на всём сайте (по одному активному за раз).
      </p>

      <form onSubmit={add} className="mt-6 grid gap-3 rounded-2xl bg-card p-5 shadow-soft md:grid-cols-2">
        <div>
          <Label>Тип размещения</Label>
          <select
            value={draft.placement}
            onChange={(e) => setDraft({ ...draft, placement: e.target.value as "home" | "popup" })}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="home">На главной (карточка)</option>
            <option value="popup">Попап-акция (модалка)</option>
          </select>
        </div>
        <div>
          <Label>Бейдж (например «−20%»)</Label>
          <Input value={draft.badge} onChange={(e) => setDraft({ ...draft, badge: e.target.value })} placeholder="Скидка 20%" />
        </div>
        <div>
          <Label>Заголовок</Label>
          <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </div>
        <div>
          <Label>CTA-кнопка</Label>
          <Input value={draft.cta_label} onChange={(e) => setDraft({ ...draft, cta_label: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Label>Подзаголовок / описание акции</Label>
          <Textarea rows={2} value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Label>Картинка</Label>
          <ImageUpload value={draft.image_url} onChange={(url) => setDraft({ ...draft, image_url: url })} />
        </div>
        <div>
          <Label>Ссылка</Label>
          <Input value={draft.link_url} onChange={(e) => setDraft({ ...draft, link_url: e.target.value })} placeholder="/courses/..." />
        </div>
        <div>
          <Label>Порядок</Label>
          <Input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
        </div>
        <div>
          <Label>Старт акции</Label>
          <Input type="datetime-local" value={draft.starts_at} onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })} />
        </div>
        <div>
          <Label>Окончание акции</Label>
          <Input type="datetime-local" value={draft.ends_at} onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" className="rounded-full bg-gradient-teal">
            <Plus className="h-4 w-4" /> Добавить
          </Button>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {(data ?? []).map((b) => (
          <div key={b.id} className="rounded-2xl bg-card p-4 shadow-soft grid gap-3 md:grid-cols-[220px_1fr_auto]">
            <ImageUpload value={b.image_url ?? ""} onChange={(url) => update(b.id, { image_url: url })} />
            <div className="grid gap-2 md:grid-cols-2">
              <select
                defaultValue={b.placement ?? "home"}
                onChange={(e) => update(b.id, { placement: e.target.value })}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="home">На главной</option>
                <option value="popup">Попап-акция</option>
              </select>
              <Input defaultValue={b.badge ?? ""} onBlur={(e) => update(b.id, { badge: e.target.value || null })} placeholder="Бейдж (-20%)" />
              <Input defaultValue={b.title} onBlur={(e) => update(b.id, { title: e.target.value })} placeholder="Заголовок" />
              <Input defaultValue={b.cta_label ?? ""} onBlur={(e) => update(b.id, { cta_label: e.target.value })} placeholder="CTA" />
              <Input defaultValue={b.link_url ?? ""} onBlur={(e) => update(b.id, { link_url: e.target.value })} placeholder="Ссылка" />
              <Input defaultValue={b.subtitle ?? ""} onBlur={(e) => update(b.id, { subtitle: e.target.value })} placeholder="Подзаголовок" />
              <Input
                type="datetime-local"
                defaultValue={b.starts_at ? b.starts_at.slice(0, 16) : ""}
                onBlur={(e) => update(b.id, { starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
              <Input
                type="datetime-local"
                defaultValue={b.ends_at ? b.ends_at.slice(0, 16) : ""}
                onBlur={(e) => update(b.id, { ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            </div>
            <div className="flex flex-col items-end gap-2">
              <label className="text-xs inline-flex items-center gap-2">
                <input type="checkbox" defaultChecked={b.is_active} onChange={(e) => update(b.id, { is_active: e.target.checked })} className="h-4 w-4 accent-primary" />
                Активен
              </label>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(b.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {(data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Пусто.</p>}
      </div>
    </div>
  );
}
