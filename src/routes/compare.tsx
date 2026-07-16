import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { X, ChevronLeft, Check } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { courseImageWithFallback } from "@/lib/course-images";
import { removeFromCompare, useCompare, clearCompare } from "@/lib/compare-store";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Сравнение курсов — ЦПР Партнер" },
      { name: "description", content: "Сравните выбранные курсы по цене, формату и длительности." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const ids = useCompare();
  const { data } = useQuery({
    queryKey: ["compare", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, slug, title, short_description, price, duration, format, image_url")
        .in("id", ids);
      if (error) throw error;
      return data ?? [];
    },
  });

  const courses = (data ?? []).slice().sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <Link to="/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> К каталогу
        </Link>
        <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-3xl md:text-4xl font-bold">Сравнение курсов</h1>
          {ids.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearCompare} className="rounded-full">Очистить</Button>
          )}
        </div>

        {ids.length === 0 ? (
          <p className="mt-10 text-muted-foreground">
            Список пуст. Откройте <Link to="/courses" className="text-primary underline">каталог</Link> и добавьте курсы в сравнение.
          </p>
        ) : (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm bg-card rounded-2xl shadow-soft overflow-hidden">
              <thead>
                <tr>
                  <th className="p-4 text-left bg-muted/50 w-40">Параметр</th>
                  {courses.map((c) => (
                    <th key={c.id} className="p-4 text-left bg-muted/30 align-top min-w-[200px]">
                      <button onClick={() => removeFromCompare(c.id)} className="float-right text-muted-foreground hover:text-destructive" aria-label="Убрать">
                        <X className="h-4 w-4" />
                      </button>
                      <div
                        className="h-24 w-full rounded-lg bg-muted bg-cover bg-center mb-2"
                        style={{ backgroundImage: courseImageWithFallback(c.image_url) }}
                      />
                      <Link to="/courses/$slug" params={{ slug: c.slug }} className="font-bold hover:text-primary">{c.title}</Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <Row label="Цена" cells={courses.map((c) => (c.price != null ? `${c.price} ₽` : "—"))} />
                <Row label="Длительность" cells={courses.map((c) => c.duration ?? "—")} />
                <Row label="Формат" cells={courses.map((c) => c.format ?? "—")} />
                <Row label="Кратко" cells={courses.map((c) => c.short_description ?? "—")} />
                <tr>
                  <td className="p-4 bg-muted/40 font-medium">Заявка</td>
                  {courses.map((c) => (
                    <td key={c.id} className="p-4">
                      <Button asChild size="sm" className="rounded-full bg-gradient-teal">
                        <Link to="/courses/$slug" params={{ slug: c.slug }}><Check className="h-4 w-4" /> Записаться</Link>
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

function Row({ label, cells }: { label: string; cells: (string | number | null | undefined)[] }) {
  return (
    <tr className="border-t border-border">
      <td className="p-4 bg-muted/40 font-medium">{label}</td>
      {cells.map((v, i) => <td key={i} className="p-4 align-top">{v || "—"}</td>)}
    </tr>
  );
}
