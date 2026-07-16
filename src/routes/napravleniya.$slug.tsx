import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ApplicationForm } from "@/components/site/ApplicationForm";
import { supabase } from "@/integrations/supabase/client";
import { categoryImage, courseImageWithFallback } from "@/lib/course-images";
import directions from "@/data/directions.json";
import { DIRECTION_TO_CATEGORIES } from "@/data/directions-map";
import { getDirectionSeo } from "@/data/direction-seo";

type Query = { q: string; v: number; t: string };
type Dir = { slug: string; name: string; total: number; top: string; queries: Query[] };

const all = directions as Dir[];
const bySlug = new Map(all.map((d) => [d.slug, d]));

const directionCoursesQuery = (slug: string) =>
  queryOptions({
    queryKey: ["direction", slug, "courses"],
    queryFn: async () => {
      const catSlugs = DIRECTION_TO_CATEGORIES[slug] ?? [];
      if (catSlugs.length === 0) return [];
      const { data: cats } = await supabase
        .from("categories")
        .select("id")
        .in("slug", catSlugs);
      const ids = (cats ?? []).map((c) => c.id);
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("courses")
        .select("id, slug, title, short_description, price, duration, image_url")
        .in("category_id", ids)
        .eq("published", true)
        .order("sort_order")
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
  });

export const Route = createFileRoute("/napravleniya/$slug")({
  loader: async ({ params, context }) => {
    const dir = bySlug.get(params.slug);
    if (!dir) throw notFound();
    await context.queryClient.ensureQueryData(directionCoursesQuery(params.slug));
    return dir;
  },
  head: ({ params, loaderData }) => {
    const dir = loaderData ?? bySlug.get(params.slug);
    if (!dir) return { meta: [{ title: "Направление — ЦПР Партнер" }] };
    const seo = getDirectionSeo(params.slug, dir.name, dir.top);
    const title = seo.title;
    const desc = seo.description;
    const url = `/napravleniya/${params.slug}`;
    const faqs = pickFaqQueries(dir).slice(0, 8);
    return {
      meta: [
        { title },
        { name: "description", content: desc.slice(0, 159) },
        { name: "keywords", content: dir.queries.slice(0, 15).map((q) => q.q).join(", ") },
        { property: "og:title", content: title },
        { property: "og:description", content: desc.slice(0, 159) },
        { property: "og:url", content: url },
        { property: "og:type", content: "website" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((q) => ({
              "@type": "Question",
              name: capitalize(q.q) + "?",
              acceptedAnswer: {
                "@type": "Answer",
                text: `${seo.lead} По окончании выдаём документы установленного образца. Доступно очное обучение, выездной формат и дистанционные программы по всей России.`,
              },
            })),
          }),
        },
      ],
    };
  },
  component: DirectionPage,
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Направление не найдено</h1>
        <Link to="/napravleniya" className="mt-6 inline-block text-primary hover:underline">
          ← Все направления
        </Link>
      </div>
    </SiteLayout>
  ),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Не удалось загрузить страницу</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </SiteLayout>
  ),
});

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function pickFaqQueries(dir: Dir): Query[] {
  // Prefer "как / что / когда / нужно / периодичность / сроки / порядок / стоимость" mid-frequency
  const re = /^(как|что|когда|сколько|нужно|обязательно|где|кто|почему|периодичность|сроки|порядок|стоимость|цена|программа)/i;
  const matched = dir.queries.filter((q) => re.test(q.q));
  const fallback = dir.queries.filter((q) => q.t === "СЧ" || q.t === "НЧ");
  const seen = new Set<string>();
  return [...matched, ...fallback].filter((q) => {
    if (seen.has(q.q)) return false;
    seen.add(q.q);
    return true;
  });
}

function DirectionPage() {
  const { slug } = Route.useParams();
  const dir = bySlug.get(slug)!;
  const seo = getDirectionSeo(slug, dir.name, dir.top);
  const { data: courses } = useSuspenseQuery(directionCoursesQuery(slug));
  const faqs = pickFaqQueries(dir).slice(0, 8);
  const midQueries = dir.queries.filter((q) => q.t === "СЧ").slice(0, 12);

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-teal opacity-10" />
        <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20">
          <div className="text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Главная</Link> /{" "}
            <Link to="/napravleniya" className="hover:text-primary">Направления</Link> / {seo.cardTitle}
          </div>
          <h1 className="mt-3 text-3xl md:text-5xl font-bold leading-tight max-w-3xl">
            {seo.h1}
          </h1>
          <p className="mt-4 max-w-2xl text-base md:text-lg text-foreground/80">
            {seo.lead} Лицензия на образовательную деятельность, документы установленного
            образца и занесение сведений в реестр ФИС ФРДО.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#zayavka"
              className="inline-flex items-center justify-center rounded-full bg-gradient-teal hover:opacity-90 h-12 px-6 text-base font-semibold text-primary-foreground shadow-soft"
            >
              Записаться на обучение
            </a>
            <Link
              to="/courses"
              className="inline-flex items-center justify-center rounded-full border border-border bg-background hover:bg-muted h-12 px-6 text-base font-semibold"
            >
              Все программы
            </Link>
          </div>
        </div>
      </section>

      {/* Courses */}
      {courses.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 lg:px-8 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold">{seo.coursesH2}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <Link
                key={c.id}
                to="/courses/$slug"
                params={{ slug: c.slug }}
                className="group rounded-2xl bg-card overflow-hidden shadow-soft hover:shadow-card transition-shadow flex flex-col"
              >
                <div
                  className="aspect-[16/9] bg-muted bg-cover bg-center"
                  style={{ backgroundImage: courseImageWithFallback(c.image_url, categoryImage(slug)) }}
                />
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors">
                    {c.title}
                  </h3>
                  {c.short_description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {c.short_description}
                    </p>
                  )}
                  <div className="mt-auto pt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{c.duration || "—"}</span>
                    <span className="font-semibold text-primary">
                      {c.price ? `${Number(c.price).toLocaleString("ru-RU")} ₽` : "По запросу"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Topical text — mid-frequency keywords woven in */}
      {midQueries.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 lg:px-8 mt-16">
          <h2 className="text-2xl md:text-3xl font-bold">{seo.contentH2}</h2>
          <div className="mt-5 space-y-4 text-base text-foreground/85 leading-relaxed">
            <p>
              На курсах по направлению «{seo.cardTitle}» мы охватываем ключевые темы:{" "}
              {midQueries.slice(0, 6).map((q) => q.q).join(", ")} и другие практические вопросы.
              Программа выстроена так, чтобы слушатель сразу мог применять знания на рабочем месте.
            </p>
            <p>
              Обучение доступно очно в собственных учебных классах в Красноярске и Томске,
              выездом на территорию заказчика и дистанционно на платформе{" "}
              <a href="http://online.cpr-partner.ru/" className="text-primary hover:underline" target="_blank" rel="noreferrer">
                online.cpr-partner.ru
              </a>
              . По итогам — итоговая аттестация и выдача удостоверения установленного образца.
            </p>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 lg:px-8 mt-16">
          <h2 className="text-2xl md:text-3xl font-bold">{seo.faqH2}</h2>
          <div className="mt-6 divide-y divide-border rounded-2xl bg-card shadow-soft">
            {faqs.map((q, i) => (
              <details key={i} className="group p-5">
                <summary className="cursor-pointer list-none font-semibold flex items-center justify-between gap-4">
                  <span>{capitalize(q.q)}?</span>
                  <span className="text-primary text-xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-sm text-foreground/80 leading-relaxed">
                  {seo.lead} По окончании выдаём документы установленного образца.
                  Доступно очное обучение в Красноярске и Томске, выездом и дистанционно — по всей России.
                  Стоимость и сроки уточняйте по телефону{" "}
                  <a href="tel:+78005007016" className="text-primary">8 (800) 500-70-16</a>.
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Application */}
      <section id="zayavka" className="mx-auto max-w-7xl px-4 lg:px-8 mt-20">
        <ApplicationForm courseTitle={dir.name} />
      </section>
    </SiteLayout>
  );
}
