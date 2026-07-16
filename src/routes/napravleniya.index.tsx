import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { categoryImage } from "@/lib/course-images";
import { getDirectionSeo } from "@/data/direction-seo";
import directions from "@/data/directions.json";

type Dir = { slug: string; name: string; total: number; top: string };

export const Route = createFileRoute("/napravleniya/")({
  head: () => ({
    meta: [
      { title: "Направления обучения — охрана труда, высота, электробезопасность | ЦПР Партнер" },
      {
        name: "description",
        content:
          "17 SEO-направлений обучения: охрана труда, работы на высоте, первая помощь, электробезопасность, промбезопасность, пожарная безопасность и рабочие профессии.",
      },
      { property: "og:title", content: "Направления обучения — ЦПР Партнер" },
      { property: "og:url", content: "/napravleniya" },
    ],
    links: [{ rel: "canonical", href: "/napravleniya" }],
  }),
  component: DirectionsIndex,
});

function DirectionsIndex() {
  const items = directions as Dir[];
  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Главная</Link> / Направления
        </div>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold">
          Направления обучения и курсы ЦПР Партнер
        </h1>
        <p className="mt-3 max-w-2xl text-base md:text-lg text-foreground/80">
          Выбирайте направление — внутри собраны программы для рабочих,
          специалистов и руководителей. Очно в Красноярске и Томске,
          дистанционно — по всей России.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((d, index) => {
            const seo = getDirectionSeo(d.slug, d.name, d.top);
            return (
              <Link
                key={d.slug}
                to="/napravleniya/$slug"
                params={{ slug: d.slug }}
                className="group relative isolate flex min-h-[220px] flex-col overflow-hidden rounded-2xl p-6 text-white shadow-soft transition-transform hover:-translate-y-1 hover:shadow-card"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(8,20,35,0.16), rgba(8,20,35,0.82)), url(${categoryImage(d.slug, index)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="mt-auto text-lg font-bold transition-colors">
                  {seo.cardTitle}
                </div>
                <div className="mt-2 text-sm text-white/85 line-clamp-2">
                  {seo.cardText}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </SiteLayout>
  );
}
