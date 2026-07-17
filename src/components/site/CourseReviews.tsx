import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Star } from "lucide-react";
import { db } from "@/integrations/database/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function CourseReviews({ courseId }: { courseId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data } = useQuery({
    queryKey: ["course-reviews", courseId],
    queryFn: async () => {
      const { data, error } = await db
        .from("course_reviews")
        .select("*")
        .eq("course_id", courseId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return toast.error("Заполните имя и текст");
    setSubmitting(true);
    const { error } = await db.from("course_reviews").insert({
      course_id: courseId,
      author_name: name.trim().slice(0, 100),
      author_company: company.trim().slice(0, 100) || null,
      rating,
      text: text.trim().slice(0, 2000),
      is_approved: false,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Спасибо! Отзыв отправлен на модерацию");
    setName("");
    setCompany("");
    setText("");
    setRating(5);
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["course-reviews", courseId] });
  }

  return (
    <section className="mt-8 rounded-2xl bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Отзывы о курсе</h2>
        <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)} className="rounded-full">
          {open ? "Скрыть" : "Оставить отзыв"}
        </Button>
      </div>

      {open && (
        <form onSubmit={submit} className="mt-5 grid gap-3 rounded-xl border border-border/60 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Ваше имя" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
            <Input placeholder="Организация (необязательно)" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={100} />
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} звёзд`}>
                <Star className={`h-6 w-6 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <Textarea placeholder="Поделитесь впечатлением" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} rows={4} required />
          <Button type="submit" disabled={submitting} className="rounded-full bg-gradient-teal w-fit">
            {submitting ? "Отправляем…" : "Отправить отзыв"}
          </Button>
        </form>
      )}

      {data && data.length > 0 ? (
        <div className="mt-5 space-y-4">
          {data.map((r) => (
            <article key={r.id} className="rounded-xl border border-border/60 p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">
                  {r.author_name}
                  {r.author_company && <span className="text-muted-foreground font-normal"> · {r.author_company}</span>}
                </div>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-sm text-foreground/90">{r.text}</p>
              <div className="mt-1 text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString("ru-RU")}
              </div>
            </article>
          ))}
        </div>
      ) : (
        !open && <p className="mt-4 text-sm text-muted-foreground">Пока отзывов нет. Будьте первым!</p>
      )}
    </section>
  );
}
