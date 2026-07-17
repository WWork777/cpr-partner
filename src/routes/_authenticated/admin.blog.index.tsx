import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { adminPostsQuery } from "@/lib/queries";
import { db } from "@/integrations/database/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/blog/")({
  component: AdminBlogList,
});

function AdminBlogList() {
  const { data, isLoading } = useQuery(adminPostsQuery);
  const qc = useQueryClient();

  async function remove(id: string, title: string) {
    if (!confirm(`Удалить статью «${title}»?`)) return;
    const { error } = await db.from("blog_posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Удалено");
    qc.invalidateQueries({ queryKey: ["admin", "blog"] });
    qc.invalidateQueries({ queryKey: ["blog", "published"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Блог</h1>
        <Button asChild className="rounded-full bg-gradient-teal">
          <Link to="/admin/blog/$id" params={{ id: "new" }}>
            <Plus className="h-4 w-4" /> Новая статья
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-8 text-muted-foreground">Загрузка…</div>
      ) : (data ?? []).length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Пока нет статей. Создайте первую.
        </div>
      ) : (
        <div className="mt-6 rounded-2xl bg-card shadow-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Заголовок</th>
                <th className="text-left px-4 py-3 w-32">Статус</th>
                <th className="text-left px-4 py-3 w-40">Обновлено</th>
                <th className="w-32"></th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((p) => (
                <tr key={p.id} className="border-t border-border/60">
                  <td className="px-4 py-3">
                    <Link to="/admin/blog/$id" params={{ id: p.id }} className="font-medium hover:text-primary">
                      {p.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">/{p.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    {p.published ? (
                      <span className="text-xs rounded-full bg-success/15 text-success px-2 py-1">Опубликовано</span>
                    ) : (
                      <span className="text-xs rounded-full bg-muted px-2 py-1">Черновик</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(p.updated_at).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/admin/blog/$id" params={{ id: p.id }}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(p.id, p.title)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
