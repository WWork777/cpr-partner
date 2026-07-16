import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ExternalLink,
  Eye,
  EyeOff,
  Plus,
  Pencil,
  RefreshCw,
  Search,
  Trash2,
  Copy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminCoursesQuery, categoriesQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { categoryImage, courseImageWithFallback } from "@/lib/course-images";

export const Route = createFileRoute("/_authenticated/admin/courses/")({
  component: CoursesAdmin,
});

function CoursesAdmin() {
  const qc = useQueryClient();
  const { data, error, isLoading, refetch, isFetching } = useQuery(adminCoursesQuery);
  const { data: cats } = useQuery(categoriesQuery);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkCat, setBulkCat] = useState<string>("");
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [publicationFilter, setPublicationFilter] = useState("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter((course) => {
      if (categoryFilter !== "all" && course.category_id !== categoryFilter) return false;
      if (publicationFilter === "published" && !course.published) return false;
      if (publicationFilter === "draft" && course.published) return false;
      if (!needle) return true;
      return `${course.title} ${course.slug} ${course.categories?.name ?? ""}`
        .toLowerCase()
        .includes(needle);
    });
  }, [data, q, categoryFilter, publicationFilter]);

  const ids = useMemo(() => filtered.map((c) => c.id), [filtered]);
  const allChecked = ids.length > 0 && ids.every((id) => selected.has(id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(ids));
  }

  async function bulkPublish(value: boolean) {
    if (selected.size === 0) return;
    const { error } = await supabase
      .from("courses")
      .update({ published: value })
      .in("id", [...selected]);
    if (error) return toast.error(error.message);
    toast.success(value ? "Опубликовано" : "Снято с публикации");
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["admin", "courses"] });
  }
  async function bulkSetCategory() {
    if (selected.size === 0 || !bulkCat) return;
    const { error } = await supabase
      .from("courses")
      .update({ category_id: bulkCat })
      .in("id", [...selected]);
    if (error) return toast.error(error.message);
    toast.success("Категория обновлена");
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["admin", "courses"] });
  }

  async function togglePublished(id: string, value: boolean) {
    const { error } = await supabase.from("courses").update({ published: value }).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin", "courses"] });
  }

  async function remove(id: string) {
    if (!confirm("Удалить курс?")) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Удалено");
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
    }
  }

  async function duplicate(id: string) {
    const { data: src, error: e1 } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (e1 || !src) return toast.error(e1?.message ?? "Не найдено");
    const {
      id: _omit,
      created_at: _c,
      updated_at: _u,
      ...rest
    } = src as Record<string, unknown> & { id: string; created_at?: string; updated_at?: string };
    const copy = {
      ...rest,
      title: `${src.title} (копия)`,
      slug: `${src.slug}-copy-${Math.random().toString(36).slice(2, 6)}`,
      published: false,
    };
    const { error } = await supabase.from("courses").insert(copy);
    if (error) toast.error(error.message);
    else {
      toast.success("Курс продублирован");
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Курсы</h1>
          <p className="mt-2 text-muted-foreground">
            {data?.length ?? 0} программ · показано {filtered.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Обновить список"
            aria-label="Обновить список"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
          <Button asChild className="rounded-full bg-gradient-teal">
            <Link to="/admin/courses/$id" params={{ id: "new" }}>
              <Plus className="h-4 w-4" /> Новый курс
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по названию, slug или категории"
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Все категории" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            {(cats ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={publicationFilter} onValueChange={setPublicationFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Все курсы" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все курсы</SelectItem>
            <SelectItem value="published">Опубликованные</SelectItem>
            <SelectItem value="draft">Черновики</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selected.size > 0 && (
        <div className="mt-6 sticky top-2 z-10 flex flex-wrap items-center gap-3 rounded-2xl bg-primary text-primary-foreground px-4 py-3 shadow-card">
          <div className="text-sm font-semibold">Выбрано: {selected.size}</div>
          <Button size="sm" variant="secondary" onClick={() => bulkPublish(true)}>
            Опубликовать
          </Button>
          <Button size="sm" variant="secondary" onClick={() => bulkPublish(false)}>
            Снять
          </Button>
          <div className="flex items-center gap-2">
            <Select value={bulkCat} onValueChange={setBulkCat}>
              <SelectTrigger className="h-9 w-[200px] bg-background text-foreground">
                <SelectValue placeholder="Сменить категорию…" />
              </SelectTrigger>
              <SelectContent>
                {(cats ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="secondary" onClick={bulkSetCategory}>
              Применить
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-primary-foreground"
            onClick={() => setSelected(new Set())}
          >
            Сбросить
          </Button>
        </div>
      )}

      <div className="mt-6 rounded-2xl bg-card shadow-soft overflow-hidden">
        {error && (
          <div className="p-5 border-b border-border text-sm text-destructive">
            Не удалось загрузить каталог: {error.message}
          </div>
        )}
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Загрузка…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {(data?.length ?? 0) === 0 ? "Курсов пока нет" : "По фильтрам ничего не найдено"}
          </div>
        ) : (
          <div className="divide-y divide-border">
            <div className="p-3 flex items-center gap-3 bg-muted/40 text-xs">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-muted-foreground">Выбрать все ({ids.length})</span>
            </div>
            {filtered.map((c) => (
              <div key={c.id} className="p-4 flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggle(c.id)}
                  className="h-4 w-4 accent-primary shrink-0"
                />
                <div
                  className="h-14 w-20 rounded-lg bg-muted bg-cover bg-center shrink-0"
                  style={{
                    backgroundImage: courseImageWithFallback(
                      c.image_url,
                      categoryImage(c.categories?.slug),
                    ),
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{c.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">
                    {c.categories?.name ?? "Без категории"} · /{c.slug}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to="/courses/$slug"
                    params={{ slug: c.slug }}
                    target="_blank"
                    className="hidden sm:inline-flex text-muted-foreground hover:text-primary"
                    title="Открыть на сайте"
                    aria-label={`Открыть курс «${c.title}» на сайте`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <span
                    className={`inline-flex items-center gap-1 text-xs ${c.published ? "text-success" : "text-muted-foreground"}`}
                  >
                    {c.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    <span className="hidden sm:inline">{c.published ? "Опубл." : "Черновик"}</span>
                  </span>
                </div>
                <label className="hidden md:flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                  <input
                    type="checkbox"
                    checked={c.published}
                    onChange={(e) => togglePublished(c.id, e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  На сайте
                </label>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin/courses/$id" params={{ id: c.id }}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => duplicate(c.id)}
                  title="Дублировать"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(c.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
