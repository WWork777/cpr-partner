import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { slugify } from "@/lib/slugify";


export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: CategoriesAdmin,
});

function CategoriesAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery(categoriesQuery);
  const [newCat, setNewCat] = useState({ slug: "", name: "" });

  async function create() {
    if (!newCat.slug || !newCat.name) return toast.error("Заполните slug и название");
    const { error } = await supabase.from("categories").insert({
      slug: newCat.slug,
      name: newCat.name,
      sort_order: (data?.length ?? 0) * 10 + 10,
    });
    if (error) return toast.error(error.message);
    toast.success("Создано");
    setNewCat({ slug: "", name: "" });
    qc.invalidateQueries({ queryKey: ["categories"] });
  }

  async function update(id: string, field: "slug" | "name", value: string) {
    const patch = field === "slug" ? { slug: value } : { name: value };
    const { error } = await supabase.from("categories").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["categories"] });
  }

  async function remove(id: string) {
    if (!confirm("Удалить категорию? Курсы в ней останутся без категории.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Удалено");
      qc.invalidateQueries({ queryKey: ["categories"] });
    }
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold">Категории</h1>
      <p className="mt-2 text-muted-foreground">Группировка курсов на сайте</p>

      <div className="mt-8 rounded-2xl bg-card shadow-soft p-5">
        <div className="text-sm font-semibold mb-3">Новая категория</div>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="slug (авто из названия)" value={newCat.slug} onChange={(e) => setNewCat({ ...newCat, slug: slugify(e.target.value) })} />
          <Input placeholder="Название" value={newCat.name} onChange={(e) => setNewCat({ name: e.target.value, slug: newCat.slug && newCat.slug !== slugify(newCat.name) ? newCat.slug : slugify(e.target.value) })} />

          <Button onClick={create} className="rounded-full bg-gradient-teal">
            <Plus className="h-4 w-4" /> Добавить
          </Button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-card shadow-soft divide-y divide-border">
        {(data ?? []).map((c) => (
          <div key={c.id} className="p-4 grid gap-2 sm:grid-cols-[1fr_2fr_auto] items-center">
            <EditableCell value={c.slug} onSave={(v) => update(c.id, "slug", v)} />
            <EditableCell value={c.name} onSave={(v) => update(c.id, "name", v)} />
            <Button variant="ghost" size="sm" onClick={() => remove(c.id)} className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditableCell({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  const dirty = v !== value;
  return (
    <div className="flex gap-2">
      <Input value={v} onChange={(e) => setV(e.target.value)} />
      {dirty && (
        <Button size="sm" onClick={() => onSave(v)} className="rounded-full">
          <Save className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
