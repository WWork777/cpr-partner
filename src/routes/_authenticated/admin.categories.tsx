import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ExternalLink, Plus, Save, Trash2 } from "lucide-react";
import { db } from "@/integrations/database/client";
import { adminCoursesQuery, categoriesQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { slugify } from "@/lib/slugify";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: CategoriesAdmin,
});

type EditableField = "slug" | "name" | "description" | "sort_order";

function CategoriesAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery(categoriesQuery);
  const { data: courses } = useQuery(adminCoursesQuery);
  const [newDirection, setNewDirection] = useState({ slug: "", name: "", description: "" });

  const courseCounts = useMemo(() => {
    const counts = new Map<string, { total: number; published: number }>();
    for (const course of courses ?? []) {
      if (!course.category_id) continue;
      const prev = counts.get(course.category_id) ?? { total: 0, published: 0 };
      counts.set(course.category_id, {
        total: prev.total + 1,
        published: prev.published + (course.published ? 1 : 0),
      });
    }
    return counts;
  }, [courses]);

  async function create() {
    const slug = newDirection.slug.trim();
    const name = newDirection.name.trim();
    if (!slug || !name) return toast.error("Заполните slug и название направления");

    const { error } = await db.from("categories").insert({
      slug,
      name,
      description: newDirection.description.trim() || null,
      sort_order: (data?.length ?? 0) * 10 + 10,
    });
    if (error) return toast.error(error.message);
    toast.success("Направление создано");
    setNewDirection({ slug: "", name: "", description: "" });
    qc.invalidateQueries({ queryKey: ["categories"] });
  }

  async function update(id: string, field: EditableField, value: string) {
    const patch =
      field === "sort_order"
        ? { sort_order: Number(value) || 0 }
        : { [field]: field === "description" ? value.trim() || null : value.trim() };

    const { error } = await db.from("categories").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Направление обновлено");
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["courses", "published"] });
    }
  }

  async function remove(id: string) {
    if (!confirm("Удалить направление? Курсы в нём останутся без направления и пропадут из /napravleniya.")) return;
    const { error } = await db.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Направление удалено");
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      qc.invalidateQueries({ queryKey: ["courses", "published"] });
    }
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold">Направления</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Это верхний уровень каталога. Карточки на странице /napravleniya берутся отсюда,
        а внутри показываются опубликованные курсы, привязанные к направлению.
      </p>

      <div className="mt-8 rounded-2xl bg-card shadow-soft p-5">
        <div className="text-sm font-semibold mb-3">Новое направление</div>
        <div className="grid gap-2 lg:grid-cols-[1fr_1fr_auto]">
          <Input
            placeholder="slug (URL)"
            value={newDirection.slug}
            onChange={(e) => setNewDirection({ ...newDirection, slug: slugify(e.target.value) })}
          />
          <Input
            placeholder="Название направления"
            value={newDirection.name}
            onChange={(e) =>
              setNewDirection({
                ...newDirection,
                name: e.target.value,
                slug:
                  newDirection.slug && newDirection.slug !== slugify(newDirection.name)
                    ? newDirection.slug
                    : slugify(e.target.value),
              })
            }
          />
          <Button onClick={create} className="rounded-full bg-gradient-teal">
            <Plus className="h-4 w-4" /> Добавить
          </Button>
        </div>
        <Textarea
          className="mt-2"
          placeholder="Описание направления для карточки и страницы"
          value={newDirection.description}
          onChange={(e) => setNewDirection({ ...newDirection, description: e.target.value })}
        />
      </div>

      <div className="mt-6 rounded-2xl bg-card shadow-soft divide-y divide-border">
        {(data ?? []).map((direction) => {
          const counts = courseCounts.get(direction.id) ?? { total: 0, published: 0 };

          return (
            <div key={direction.id} className="p-4">
              <div className="grid gap-3 lg:grid-cols-[160px_minmax(0,1fr)_110px_auto] lg:items-start">
                <EditableCell value={direction.slug} onSave={(v) => update(direction.id, "slug", v)} />
                <div className="grid gap-2">
                  <EditableCell value={direction.name} onSave={(v) => update(direction.id, "name", v)} />
                  <EditableTextArea
                    value={direction.description ?? ""}
                    placeholder="Описание направления"
                    onSave={(v) => update(direction.id, "description", v)}
                  />
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      Курсов: {counts.total}, на сайте: {counts.published}
                    </span>
                    <Link
                      to="/courses"
                      search={{ category: direction.slug }}
                      className="hover:text-primary"
                    >
                      Курсы направления
                    </Link>
                    <Link
                      to="/admin/courses/$id"
                      params={{ id: "new" }}
                      search={{ categoryId: direction.id }}
                      className="hover:text-primary"
                    >
                      Добавить курс
                    </Link>
                    {counts.published > 0 && (
                      <Link
                        to="/napravleniya/$slug"
                        params={{ slug: direction.slug }}
                        target="_blank"
                        className="inline-flex items-center gap-1 hover:text-primary"
                      >
                        Открыть на сайте <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
                <EditableCell
                  type="number"
                  value={String(direction.sort_order ?? 0)}
                  onSave={(v) => update(direction.id, "sort_order", v)}
                />
                <Button variant="ghost" size="sm" onClick={() => remove(direction.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EditableCell({
  value,
  type = "text",
  onSave,
}: {
  value: string;
  type?: "text" | "number";
  onSave: (v: string) => void;
}) {
  const [v, setV] = useState(value);
  const dirty = v !== value;

  return (
    <div className="flex gap-2">
      <Input type={type} value={v} onChange={(e) => setV(e.target.value)} />
      {dirty && (
        <Button size="sm" onClick={() => onSave(v)} className="rounded-full">
          <Save className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function EditableTextArea({
  value,
  placeholder,
  onSave,
}: {
  value: string;
  placeholder: string;
  onSave: (v: string) => void;
}) {
  const [v, setV] = useState(value);
  const dirty = v !== value;

  return (
    <div className="flex gap-2">
      <Textarea value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} />
      {dirty && (
        <Button size="sm" onClick={() => onSave(v)} className="rounded-full">
          <Save className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
