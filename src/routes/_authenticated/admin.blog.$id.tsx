import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { db } from "@/integrations/database/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/ImageUpload";

export const Route = createFileRoute("/_authenticated/admin/blog/$id")({
  component: EditPost,
});

type Form = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_url: string;
  tags: string;
  meta_title: string;
  meta_description: string;
  published: boolean;
};

const empty: Form = {
  slug: "", title: "", excerpt: "", content: "", cover_url: "",
  tags: "", meta_title: "", meta_description: "", published: false,
};

function slugify(s: string) {
  const map: Record<string, string> = {
    а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya"
  };
  return s.toLowerCase().split("").map((c) => map[c] ?? c).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

function EditPost() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(empty);
  const [loading, setLoading] = useState(!isNew);
  const [autoSlug, setAutoSlug] = useState(isNew);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data, error } = await db.from("blog_posts").select("*").eq("id", id).maybeSingle();
      if (error || !data) {
        toast.error(error?.message ?? "Статья не найдена");
        return;
      }
      setForm({
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt ?? "",
        content: data.content ?? "",
        cover_url: data.cover_url ?? "",
        tags: (data.tags ?? []).join(", "),
        meta_title: data.meta_title ?? "",
        meta_description: data.meta_description ?? "",
        published: data.published,
      });
      setLoading(false);
    })();
  }, [id, isNew]);

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Введите заголовок");
    if (!form.slug.trim()) return toast.error("Введите slug");
    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      excerpt: form.excerpt || null,
      content: form.content,
      cover_url: form.cover_url || null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
      published: form.published,
      published_at: form.published ? new Date().toISOString() : null,
    };
    if (isNew) {
      const { data, error } = await db.from("blog_posts").insert(payload).select("id").single();
      if (error) return toast.error(error.message);
      toast.success("Статья создана");
      qc.invalidateQueries({ queryKey: ["admin", "blog"] });
      qc.invalidateQueries({ queryKey: ["blog", "published"] });
      navigate({ to: "/admin/blog/$id", params: { id: data.id } });
    } else {
      const { error } = await db.from("blog_posts").update(payload).eq("id", id);
      if (error) return toast.error(error.message);
      toast.success("Сохранено");
      qc.invalidateQueries({ queryKey: ["admin", "blog"] });
      qc.invalidateQueries({ queryKey: ["blog", "published"] });
      qc.invalidateQueries({ queryKey: ["blog", "post", form.slug] });
    }
  }

  if (loading) return <div className="text-muted-foreground">Загрузка…</div>;

  return (
    <div>
      <Link to="/admin/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-4 w-4" /> К списку
      </Link>
      <h1 className="mt-2 text-2xl md:text-3xl font-bold">
        {isNew ? "Новая статья" : "Редактирование статьи"}
      </h1>

      <form onSubmit={save} className="mt-8 grid gap-5">
        <div>
          <Label className="mb-1.5 block">Заголовок *</Label>
          <Input
            value={form.title}
            onChange={(e) => {
              const t = e.target.value;
              set("title", t);
              if (autoSlug) set("slug", slugify(t));
            }}
            required
          />
        </div>
        <div>
          <Label className="mb-1.5 block">Slug (URL) *</Label>
          <Input
            value={form.slug}
            onChange={(e) => { setAutoSlug(false); set("slug", e.target.value); }}
            required
          />
          <div className="text-xs text-muted-foreground mt-1">/blog/{form.slug || "..."}</div>
        </div>
        <div>
          <Label className="mb-1.5 block">Обложка</Label>
          <ImageUpload value={form.cover_url} onChange={(v) => set("cover_url", v)} />
        </div>
        <div>
          <Label className="mb-1.5 block">Краткое описание</Label>
          <Textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={2} />
        </div>
        <div>
          <Label className="mb-1.5 block">Текст статьи</Label>
          <Textarea value={form.content} onChange={(e) => set("content", e.target.value)} rows={18} className="font-mono text-sm" />
          <div className="text-xs text-muted-foreground mt-1">Поддерживаются переносы строк</div>
        </div>
        <div>
          <Label className="mb-1.5 block">Теги</Label>
          <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="охрана труда, электробезопасность" />
          <div className="text-xs text-muted-foreground mt-1">Через запятую</div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="mb-1.5 block">SEO title</Label>
            <Input value={form.meta_title} onChange={(e) => set("meta_title", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">SEO description</Label>
            <Input value={form.meta_description} onChange={(e) => set("meta_description", e.target.value)} />
          </div>
        </div>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => set("published", e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Опубликовать
        </label>

        <div className="flex gap-3 pt-4 border-t border-border/60">
          <Button type="submit" className="rounded-full bg-gradient-teal">Сохранить</Button>
          <Button asChild type="button" variant="outline" className="rounded-full">
            <Link to="/admin/blog">Отмена</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
