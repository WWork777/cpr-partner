import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Trash2, Star } from "lucide-react";
import { db } from "@/integrations/database/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  component: ReviewsAdmin,
});

function ReviewsAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: async () => {
      const { data, error } = await db
        .from("course_reviews")
        .select("*, courses(title, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function approve(id: string, value: boolean) {
    const { error } = await db.from("course_reviews").update({ is_approved: value }).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
  }

  async function remove(id: string) {
    if (!confirm("Удалить отзыв?")) return;
    const { error } = await db.from("course_reviews").delete().eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold">Отзывы по курсам</h1>
      <p className="mt-2 text-sm text-muted-foreground">Модерация отзывов от учеников. Только одобренные показываются на сайте.</p>

      <div className="mt-6 space-y-3">
        {(data ?? []).map((r) => (
          <article key={r.id} className={`rounded-2xl bg-card p-4 shadow-soft border ${r.is_approved ? "border-emerald-400/40" : "border-amber-400/40"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{r.author_name}{r.author_company && <span className="text-muted-foreground font-normal"> · {r.author_company}</span>}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Курс: {(r as { courses?: { title?: string } }).courses?.title ?? "—"} · {new Date(r.created_at).toLocaleString("ru-RU")}
                </div>
              </div>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                ))}
              </div>
            </div>
            <p className="mt-2 text-sm">{r.text}</p>
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" variant={r.is_approved ? "secondary" : "default"} onClick={() => approve(r.id, !r.is_approved)} className={r.is_approved ? "" : "bg-gradient-teal"}>
                <Check className="h-4 w-4" /> {r.is_approved ? "Снять с публикации" : "Одобрить"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(r.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </article>
        ))}
        {(data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Отзывов пока нет.</p>}
      </div>
    </div>
  );
}
