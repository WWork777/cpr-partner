import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ApplicationForm } from "@/components/site/ApplicationForm";
import { categoryImage, courseImageWithFallback } from "@/lib/course-images";
import { getDirectionSeo } from "@/data/direction-seo";
import { categoryBySlugQuery, publishedCoursesByCategoryQuery } from "@/lib/queries";

type Query = { q: string; v: number; t: string };
type Direction = { id: string; slug: string; name: string; description?: string | null };

export const Route = createFileRoute("/napravleniya/$slug")({
  loader: async ({ params, context }) => {
    const direction = await context.queryClient.ensureQueryData(categoryBySlugQuery(params.slug));
    if (!direction) throw notFound();
    await context.queryClient.ensureQueryData(publishedCoursesByCategoryQuery(direction.id));
    return direction;
  },
  head: ({ params, loaderData }) => {
    const direction = loaderData as Direction | undefined;
    if (!direction) return { meta: [{ title: "Направление — ЦПР Партнер" }] };

    const seo = getDirectionSeo(params.slug, direction.name, direction.description || direction.name);
    const title = seo.title;
    const desc = direction.description || seo.description;
    const url = `/napravleniya/${params.slug}`;
    const faqs = defaultFaqs(direction.name);

    return {
      meta: [
        { title },
        { name: "description", content: desc.slice(0, 159) },
        { name: "keywords", content: `${direction.name}, обучение ${direction.name.toLowerCase()}, курсы ${direction.name.toLowerCase()}` },
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
                text: `${direction.description || seo.lead} По окончании выдаём документы установленного образца. Доступно очное обучение, выездной формат и дистанционные программы по всей России.`,
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

function defaultFaqs(name: string): Query[] {
  const lower = name.toLowerCase();
  return [
    { q: `как проходит обучение по направлению ${lower}`, v: 0, t: "СЧ" },
    { q: `какие документы выдаются после обучения ${lower}`, v: 0, t: "СЧ" },
    { q: `можно ли пройти обучение ${lower} дистанционно`, v: 0, t: "СЧ" },
    { q: `сколько стоит обучение ${lower}`, v: 0, t: "СЧ" },
  ];
}

function DirectionPage() {
  const direction = Route.useLoaderData() as Direction;
  const seo = getDirectionSeo(direction.slug, direction.name, direction.description || direction.name);
  const { data: courses } = useSuspenseQuery(publishedCoursesByCategoryQuery(direction.id));
  const faqs = defaultFaqs(direction.name);
  const studyCities = "Красноярске и Томске";

  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-teal opacity-10" />
        <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20">
          <div className="text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Главная</Link> /{" "}
            <Link to="/napravleniya" className="hover:text-primary">Направления</Link> / {direction.name}
          </div>
          <h1 className="mt-3 text-3xl md:text-5xl font-bold leading-tight max-w-3xl">
            {seo.h1}
          </h1>
          <p className="mt-4 max-w-2xl text-base md:text-lg text-foreground/80">
            {direction.description || seo.lead} Лицензия на образовательную деятельность,
            документы установленного образца и занесение сведений в реестр ФИС ФРДО.
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
              search={{ category: direction.slug }}
              className="inline-flex items-center justify-center rounded-full border border-border bg-background hover:bg-muted h-12 px-6 text-base font-semibold"
            >
              Все курсы направления
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 lg:px-8 mt-14">
        <h2 className="text-2xl md:text-3xl font-bold">{seo.coursesH2}</h2>
        {courses.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                to="/courses/$slug"
                params={{ slug: course.slug }}
                className="group rounded-2xl bg-card overflow-hidden shadow-soft hover:shadow-card transition-shadow flex flex-col"
              >
                <div
                  className="aspect-[16/9] bg-muted bg-cover bg-center"
                  style={{ backgroundImage: courseImageWithFallback(course.image_url, categoryImage(direction.slug)) }}
                />
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  {course.short_description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {course.short_description}
                    </p>
                  )}
                  <div className="mt-auto pt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{course.duration || "—"}</span>
                    <span className="font-semibold text-primary">
                      {course.price ? `${Number(course.price).toLocaleString("ru-RU")} ₽` : "По запросу"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-card p-8 text-center text-muted-foreground shadow-soft">
            В этом направлении пока нет опубликованных курсов.
          </div>
        )}
      </section>

      <section className="mx-auto max-w-4xl px-4 lg:px-8 mt-16">
        <h2 className="text-2xl md:text-3xl font-bold">{seo.contentH2}</h2>
        <div className="mt-5 space-y-4 text-base text-foreground/85 leading-relaxed">
          <p>
            На странице направления «{direction.name}» показаны только опубликованные курсы,
            привязанные к этому направлению в админке. Чтобы убрать программу с сайта,
            снимите публикацию курса или перенесите его в другое направление.
          </p>
          <p>
            Обучение доступно очно в собственных учебных классах в {studyCities},
            выездом на территорию заказчика и дистанционно на платформе{" "}
            <a href="http://online.cpr-partner.ru/" className="text-primary hover:underline" target="_blank" rel="noreferrer">
              online.cpr-partner.ru
            </a>
            . По итогам — итоговая аттестация и выдача удостоверения установленного образца.
          </p>
        </div>
      </section>

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
                  {direction.description || seo.lead} По окончании выдаём документы установленного образца.
                  Доступно очное обучение в {studyCities}, выездом и дистанционно — по всей России.
                  Стоимость и сроки уточняйте по телефону{" "}
                  <a href="tel:+78005007016" className="text-primary">8 (800) 500-70-16</a>.
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section id="zayavka" className="mx-auto max-w-7xl px-4 lg:px-8 mt-20">
        <ApplicationForm courseTitle={direction.name} />
      </section>
    </SiteLayout>
  );
}
