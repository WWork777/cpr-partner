import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { categoryImage } from "@/lib/course-images";
import { getDirectionSeo } from "@/data/direction-seo";
import { categoriesQuery, publishedCoursesQuery } from "@/lib/queries";

export const Route = createFileRoute("/napravleniya/")({
  head: () => ({
    meta: [
      { title: "Направления обучения — охрана труда, высота, электробезопасность | ЦПР Партнер" },
      {
        name: "description",
        content:
          "Направления обучения ЦПР Партнер: охрана труда, работы на высоте, первая помощь, электробезопасность, промбезопасность, пожарная безопасность и рабочие профессии.",
      },
      { property: "og:title", content: "Направления обучения — ЦПР Партнер" },
      { property: "og:url", content: "/napravleniya" },
    ],
    links: [{ rel: "canonical", href: "/napravleniya" }],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(publishedCoursesQuery),
    ]),
  component: DirectionsIndex,
});

function DirectionsIndex() {
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: courses } = useSuspenseQuery(publishedCoursesQuery);
  const counts = new Map<string, number>();

  for (const course of courses) {
    if (course.category_id) counts.set(course.category_id, (counts.get(course.category_id) ?? 0) + 1);
  }

  const items = categories.filter((category) => (counts.get(category.id) ?? 0) > 0);

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
          Выбирайте направление — внутри показаны только опубликованные курсы,
          привязанные к этому направлению в админке.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((direction, index) => {
            const seo = getDirectionSeo(direction.slug, direction.name, direction.description || direction.name);
            const total = counts.get(direction.id) ?? 0;

            return (
              <Link
                key={direction.slug}
                to="/napravleniya/$slug"
                params={{ slug: direction.slug }}
                className="group relative isolate flex min-h-[220px] flex-col overflow-hidden rounded-2xl p-6 text-white shadow-soft transition-transform hover:-translate-y-1 hover:shadow-card"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(8,20,35,0.16), rgba(8,20,35,0.82)), url(${categoryImage(direction.slug, index)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="inline-flex w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
                  {total} {pluralCourses(total)}
                </div>
                <div className="mt-auto text-lg font-bold transition-colors">
                  {direction.name}
                </div>
                <div className="mt-2 text-sm text-white/85 line-clamp-2">
                  {direction.description || seo.cardText}
                </div>
              </Link>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="mt-10 rounded-2xl bg-card p-8 text-center text-muted-foreground shadow-soft">
            Направления появятся здесь после публикации курсов в админке.
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

function pluralCourses(value: number) {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return "курс";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "курса";
  return "курсов";
}
