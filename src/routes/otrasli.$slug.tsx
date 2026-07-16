import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { publishedCoursesQuery } from "@/lib/queries";
import { ArrowRight, ChevronLeft } from "lucide-react";

const INDUSTRIES: Record<string, { title: string; h1: string; desc: string; keywords: string[] }> = {
  stroitelstvo: {
    title: "Обучение по охране труда для строителей",
    h1: "Обучение для строительной отрасли",
    desc: "Программы для строительных компаний: охрана труда, работы на высоте, рабочие профессии, машинисты спецтехники. Удостоверения установленного образца.",
    keywords: ["высот", "охран", "строит", "монтаж", "электро", "пожар", "кран", "стропаль"],
  },
  energetika: {
    title: "Обучение персонала в энергетике",
    h1: "Курсы для энергетических компаний",
    desc: "Электробезопасность всех групп, тепловые установки, охрана труда — для предприятий энергетики и сетевых организаций.",
    keywords: ["электро", "электр", "тепл", "энерг", "ОТ"],
  },
  zhkh: {
    title: "Обучение сотрудников ЖКХ",
    h1: "Подготовка персонала ЖКХ",
    desc: "Охрана труда, рабочие профессии, газовое хозяйство, лифтовое хозяйство для управляющих компаний и предприятий ЖКХ.",
    keywords: ["ЖКХ", "газ", "лифт", "сантех", "рабочи", "охран"],
  },
  promyshlennost: {
    title: "Обучение для промышленных предприятий",
    h1: "Курсы для промышленных предприятий",
    desc: "Промышленная безопасность, охрана труда, рабочие профессии, погрузчики, сварщики, стропальщики.",
    keywords: ["промбезопас", "сварщ", "погруз", "стропаль", "рабочи"],
  },
};

export const Route = createFileRoute("/otrasli/$slug")({
  loader: async ({ context, params }) => {
    const ind = INDUSTRIES[params.slug];
    if (!ind) throw notFound();
    await context.queryClient.ensureQueryData(publishedCoursesQuery);
    return ind;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Отрасль — ЦПР Партнер" }] };
    return {
      meta: [
        { title: `${loaderData.title} — ЦПР Партнер` },
        { name: "description", content: loaderData.desc.slice(0, 159) },
        { property: "og:title", content: loaderData.title },
        { property: "og:url", content: `/otrasli/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/otrasli/${params.slug}` }],
    };
  },
  component: IndustryPage,
});

function IndustryPage() {
  const ind = Route.useLoaderData();
  const { data: courses } = useSuspenseQuery(publishedCoursesQuery);
  const matched = courses.filter((c) =>
    ind.keywords.some((kw: string) => c.title.toLowerCase().includes(kw.toLowerCase()))
  );

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
        <Link to="/otrasli" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Все отрасли
        </Link>
        <h1 className="mt-4 text-3xl md:text-5xl font-bold">{ind.h1}</h1>
        <p className="mt-4 max-w-3xl text-muted-foreground">{ind.desc}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {matched.map((c) => (
            <Link key={c.id} to="/courses/$slug" params={{ slug: c.slug }} className="rounded-2xl bg-card p-5 shadow-soft hover:shadow-card transition-shadow">
              <div className="font-semibold">{c.title}</div>
              {c.short_description && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{c.short_description}</p>}
              <div className="mt-3 flex items-center justify-between">
                {c.price && <span className="text-primary font-bold">{c.price} ₽</span>}
                <span className="inline-flex items-center gap-1 text-xs text-primary">Подробнее <ArrowRight className="h-3 w-3" /></span>
              </div>
            </Link>
          ))}
          {matched.length === 0 && <p className="text-muted-foreground">Подходящих курсов пока нет.</p>}
        </div>
      </section>
    </SiteLayout>
  );
}
