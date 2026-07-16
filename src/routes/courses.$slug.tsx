import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { Check, Award, ChevronRight, Phone } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ApplicationForm } from "@/components/site/ApplicationForm";
import { CourseSchedule } from "@/components/site/CourseSchedule";
import { RichDescription } from "@/components/site/RichDescription";
import {
  courseBySlugQuery,
  publishedCoursesQuery,
  documentSamplesQuery,
  type CourseFeature,
  type CourseStep,
  type CourseFaq,
} from "@/lib/queries";
import { getDocType } from "@/lib/doc-type";
import { categoryImage, courseImageWithFallback } from "@/lib/course-images";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/courses/$slug")({
  loader: async ({ context, params }) => {
    const course = await context.queryClient.ensureQueryData(courseBySlugQuery(params.slug));
    if (!course) throw notFound();
    return course;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Курс — ЦПР Партнер" }] };
    const c = loaderData as typeof loaderData & { meta_title?: string | null; meta_description?: string | null };
    const url = `/courses/${params.slug}`;
    const cityTxt = c.city ? `в ${c.city}` : "";
    const priceTxt = c.price ? `от ${Number(c.price).toLocaleString("ru-RU")} ₽` : "цена по запросу";
    const title =
      c.meta_title?.trim() ||
      `${c.title} — обучение ${cityTxt}, ${priceTxt} | ЦПР Партнер`;
    const desc =
      c.meta_description?.trim() ||
      c.short_description ||
      `${c.title}: программа, стоимость ${priceTxt}, сроки обучения, удостоверение установленного образца с занесением в ФИС ФРДО.`;
    return {
      meta: [
        { title: title.slice(0, 70) },
        { name: "description", content: desc.slice(0, 159) },
        { property: "og:title", content: c.title },
        { property: "og:description", content: desc.slice(0, 159) },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        ...(c.image_url
          ? [
              { property: "og:image", content: c.image_url },
              { name: "twitter:image", content: c.image_url },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: (() => {
        const faqs = ((c as { faqs?: unknown }).faqs as { question: string; answer: string }[]) ?? [];
        const scripts: { type: string; children: string }[] = [
          {
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Course",
              name: c.title,
              description: desc,
              provider: { "@type": "Organization", name: "ЦПР Партнер", sameAs: "https://cpr-partner.ru" },
              ...(c.image_url ? { image: c.image_url } : {}),
              ...(c.price
                ? { offers: { "@type": "Offer", price: Number(c.price), priceCurrency: "RUB", category: "Paid" } }
                : {}),
            }),
          },
        ];
        if (faqs.length) {
          scripts.push({
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.question,
                acceptedAnswer: { "@type": "Answer", text: f.answer },
              })),
            }),
          });
        }
        return scripts;
      })(),
    };
  },
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Курс не найден</h1>
        <p className="mt-2 text-muted-foreground">Возможно, он был снят с публикации.</p>
        <Link to="/courses" className="mt-6 inline-block text-primary hover:underline">← Все курсы</Link>
      </div>
    </SiteLayout>
  ),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Не удалось загрузить курс</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </SiteLayout>
  ),
  component: CoursePage,
});

type RelatedCourse = {
  id: string;
  slug: string;
  title: string;
  image_url: string | null;
  price: number | null;
  category_id: string | null;
};

const STAT_DUPES = /^(объ[её]м|формат|срок|стоимост|цена|старт|продолжительност|длительност)/i;

function cleanDescription(text: string, title: string): string {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const titleLower = title.toLowerCase();
  return lines
    .filter((l) => {
      const low = l.toLowerCase();
      // remove leading "Приглашаем..." sentence that repeats the title
      if (low.startsWith("приглашаем") && titleLower && low.includes(titleLower.slice(0, 30).toLowerCase())) return false;
      // remove single-line meta facts already shown in hero stats
      if (l.length < 120 && STAT_DUPES.test(l) && /[:—-]/.test(l)) return false;
      return true;
    })
    .join("\n\n");
}

function CoursePage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(courseBySlugQuery(slug));
  const allCourses = useQuery(publishedCoursesQuery);
  const samples = useQuery(documentSamplesQuery);
  if (!data) return null;

  const features = (((data.features as unknown as Array<Record<string, string>>) ?? [])
    .map((f) => ({ title: f.title ?? f.label ?? "", text: f.text ?? f.value ?? "" }))
    .filter((f) => f.title || f.text)
    .filter((f) => !STAT_DUPES.test(f.title))) as CourseFeature[];
  const steps = ((data.steps as unknown as CourseStep[]) ?? []).filter((s) => s.title || s.text);
  const faqs = (((data as { faqs?: unknown }).faqs as CourseFaq[]) ?? []).filter((f) => f.question || f.answer);
  const doc = getDocType(data as { document_type?: string | null; duration?: string | null });
  const docDesc = (data as { document_description?: string | null }).document_description?.trim() || "";
  const sampleFallback = doc ? (samples.data ?? []).find((s) => s.doc_type === doc.type) : null;
  const docImage = data.document_sample_url || sampleFallback?.preview_url || "";
  const docFile = data.document_sample_url || sampleFallback?.file_url || "";
  const hasDocBlock = Boolean(docImage || docFile || docDesc || doc);
  const related = ((allCourses.data as RelatedCourse[] | undefined) ?? [])
    .filter((c) => c.id !== data.id && c.category_id === data.category_id)
    .slice(0, 3);

  const priceLabel = data.price
    ? `${Number(data.price).toLocaleString("ru-RU")} ₽`
    : data.price_note || "По запросу";

  const stats: { label: string; value: string }[] = [];
  if (data.start_date) stats.push({ label: "Старт", value: data.start_date });
  if (data.duration) stats.push({ label: "Срок", value: data.duration });
  const fmt = [data.format, data.city].filter(Boolean).join(" • ");
  if (fmt) stats.push({ label: "Формат", value: fmt });
  stats.push({ label: "Цена", value: priceLabel });

  return (
    <SiteLayout>
      <div className="bg-slate-50/50">
        <nav aria-label="breadcrumb" className="mx-auto max-w-7xl px-4 pt-8 lg:px-8">
          <ol className="flex flex-wrap items-center text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            <li><Link to="/" className="hover:text-teal-600 transition-colors">Главная</Link></li>
            <li className="mx-3 opacity-30">/</li>
            <li><Link to="/courses" className="hover:text-teal-600 transition-colors">Курсы</Link></li>
            {data.categories?.name && (
              <>
                <li className="mx-3 opacity-30">/</li>
                <li className="text-teal-600">{data.categories.name}</li>
              </>
            )}
          </ol>
        </nav>

        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-8 space-y-14">
              {/* HERO */}
              <section className="relative overflow-hidden rounded-[40px] bg-slate-900 text-white min-h-[520px] md:min-h-[580px] flex flex-col justify-end p-8 md:p-14 border border-slate-800">
                <div
                  className="absolute inset-0 z-0 bg-cover bg-center opacity-55"
                  style={{
                    backgroundImage: courseImageWithFallback(data.image_url, categoryImage(data.categories?.slug)),
                  }}
                />
                <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-slate-900/30" />

                <div className="relative z-10">
                  <div className="flex flex-wrap gap-2 mb-8">
                    <HeroBadge>Лицензия Минобр</HeroBadge>
                    <HeroBadge>ФИС ФРДО</HeroBadge>
                    <span className="px-4 py-1.5 bg-teal-500/20 border border-teal-500/40 text-teal-300 rounded-full text-[10px] font-extrabold tracking-widest uppercase">
                      Набор открыт
                    </span>
                  </div>

                  <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
                    {data.title}
                  </h1>

                  {data.short_description && (
                    <p className="mt-6 text-slate-300 text-base md:text-xl leading-relaxed max-w-2xl font-light line-clamp-3">
                      {shortenLead(data.short_description)}
                    </p>
                  )}

                  <div className={`mt-10 grid gap-3 ${stats.length === 4 ? "grid-cols-2 md:grid-cols-4" : stats.length === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2"}`}>
                    {stats.map((s) => (
                      <Stat key={s.label} label={s.label} value={s.value} />
                    ))}
                  </div>
                </div>
              </section>

              {data.description && (
                <SectionBlock title="О курсе">
                  <RichDescription text={cleanDescription(data.description, data.title)} />
                </SectionBlock>
              )}

              {(data.program_theory || data.program_practice) && (
                <SectionBlock title="Программа обучения">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {data.program_theory && (
                      <ProgramCard title="Теоретическая часть" body={cleanTrainingText(data.program_theory)} tone="teal" />
                    )}
                    {data.program_practice && (
                      <ProgramCard title="Практическая часть" body={cleanTrainingText(data.program_practice)} tone="dark" />
                    )}
                  </div>
                </SectionBlock>
              )}

              {steps.length > 0 && (
                <SectionBlock title="Как проходит обучение">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {steps.map((s, i) => (
                      <div key={i} className="rounded-3xl bg-white p-6 border border-slate-100 shadow-sm">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white font-black text-sm">
                          {String(i + 1).padStart(2, "0")}
                        </div>
                        <div className="mt-4 font-bold text-slate-900">{s.title}</div>
                        {s.text && <div className="mt-1.5 text-sm text-slate-500 leading-relaxed">{s.text}</div>}
                      </div>
                    ))}
                  </div>
                </SectionBlock>
              )}

              {features.length > 0 && (
                <SectionBlock title="Преимущества курса">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {features.map((f, i) => (
                      <div
                        key={i}
                        className={`p-6 rounded-3xl border ${i % 2 === 0 ? "bg-teal-50 border-teal-100" : "bg-slate-100 border-slate-200"}`}
                      >
                        <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center text-white ${i % 2 === 0 ? "bg-teal-500" : "bg-slate-900"}`}>
                          <Check className="w-5 h-5" />
                        </div>
                        {f.title && <p className="font-bold text-slate-900">{f.title}</p>}
                        {f.text && <p className="text-sm text-slate-500 mt-1 leading-relaxed">{f.text}</p>}
                      </div>
                    ))}
                  </div>
                </SectionBlock>
              )}

              {hasDocBlock && (
                <SectionBlock title="Документ об окончании">
                  <div className="rounded-3xl bg-white p-6 md:p-8 border border-slate-100 shadow-sm">
                    <div className="grid gap-8 md:grid-cols-[minmax(0,280px)_1fr] items-center">
                      {docImage ? (
                        <a
                          href={docFile || docImage}
                          target="_blank"
                          rel="noreferrer"
                          className="block w-full rounded-2xl overflow-hidden bg-slate-50 ring-1 ring-slate-200 hover:shadow-lg transition-shadow"
                        >
                          <img
                            src={docImage}
                            alt={`Образец: ${doc?.label ?? "документ об обучении"}`}
                            className="w-full h-auto object-cover"
                          />
                        </a>
                      ) : (
                        <div className="flex aspect-[4/3] w-full rounded-2xl bg-teal-50 items-center justify-center text-teal-600 ring-1 ring-teal-100">
                          <Award className="h-24 w-24" strokeWidth={1.2} />
                        </div>
                      )}
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
                          <Award className="h-3.5 w-3.5" /> По итогам обучения
                        </div>
                        <h3 className="mt-3 text-2xl font-extrabold text-slate-900 tracking-tight">
                          {doc?.label ?? "Документ установленного образца"}
                        </h3>
                        <p className="mt-3 text-slate-600 whitespace-pre-line leading-relaxed">
                          {docDesc || "Документ установленного образца на бланке учебного центра. Сведения вносятся в ФИС ФРДО — подлинность можно проверить онлайн."}
                        </p>
                        <Link
                          to="/verify"
                          className="mt-5 inline-flex items-center gap-1 rounded-full bg-slate-900 hover:bg-slate-800 transition-colors text-white h-10 px-5 text-sm font-bold"
                        >
                          Проверить документ <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </SectionBlock>
              )}

              <section id="schedule" className="scroll-mt-24">
                <CourseSchedule courseId={data.id} />
              </section>

              {faqs.length > 0 && (
                <SectionBlock title="Частые вопросы">
                  <Accordion type="single" collapsible>
                    {faqs.map((f, i) => (
                      <AccordionItem
                        key={i}
                        value={`faq-${i}`}
                        className="rounded-2xl bg-white shadow-sm mb-3 px-5 border border-slate-100"
                      >
                        <AccordionTrigger className="text-left font-bold text-slate-900 hover:no-underline">
                          {f.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-slate-600 whitespace-pre-line leading-relaxed">
                          {f.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </SectionBlock>
              )}

              <section id="application" className="scroll-mt-24">
                <SectionBlock title="Оставить заявку">
                  <ApplicationForm courseId={data.id} courseTitle={data.title} />
                </SectionBlock>
              </section>
            </div>

            {/* Sticky lead card */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24">
              <div className="bg-white rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-200/60 overflow-hidden">
                <div className="bg-teal-600 p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-teal-300 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-100">
                        Заявка за 30 секунд
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl md:text-5xl font-black tracking-tighter">{priceLabel}</span>
                    </div>
                    {data.price && (
                      <p className="text-teal-100/80 text-xs font-bold mt-1 uppercase tracking-wider">
                        За одного слушателя
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-8 space-y-7">
                  <ul className="space-y-4">
                    <LeadLi>Перезвоним в течение 15 минут</LeadLi>
                    <LeadLi>Подберём ближайшую группу</LeadLi>
                    <LeadLi>Скидка от 5 человек до 15%</LeadLi>
                    <LeadLi>Оплата от юр. лица по счёту</LeadLi>
                  </ul>

                  <div className="space-y-3">
                    <a
                      href="#application"
                      className="block w-full text-center bg-teal-600 hover:bg-teal-700 text-white font-black py-5 rounded-2xl transition-all active:scale-[0.98] shadow-[0_20px_40px_-10px_rgba(13,148,136,0.3)] text-base"
                    >
                      Записаться на курс
                    </a>
                    <a
                      href="tel:+73912000000"
                      className="flex items-center justify-center gap-3 w-full bg-slate-50 hover:bg-slate-100 text-slate-900 font-extrabold py-4 rounded-2xl border border-slate-200 transition-all"
                    >
                      <Phone className="w-4 h-4 opacity-60" /> Позвонить менеджеру
                    </a>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {related.length > 0 && (
            <div className="mt-16">
              <SectionBlock title="Похожие курсы">
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {related.map((c) => (
                    <Link
                      key={c.id}
                      to="/courses/$slug"
                      params={{ slug: c.slug }}
                      className="group rounded-3xl overflow-hidden bg-white border border-slate-100 shadow-sm hover:shadow-lg transition-shadow"
                    >
                      <div
                        className="aspect-[16/10] bg-cover bg-center"
                        style={{ backgroundImage: courseImageWithFallback(c.image_url, categoryImage(data.categories?.slug)) }}
                      />
                      <div className="p-5">
                        <div className="font-bold leading-tight text-slate-900 group-hover:text-teal-600 line-clamp-2 transition-colors">
                          {c.title}
                        </div>
                        {c.price && (
                          <div className="mt-2 text-sm font-black text-teal-600">
                            {Number(c.price).toLocaleString("ru-RU")} ₽
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </SectionBlock>
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

function shortenLead(text: string, max = 180): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const firstSentence = clean.match(/^.+?[.!?](\s|$)/)?.[0]?.trim();
  if (firstSentence && firstSentence.length <= max) return firstSentence;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

function cleanTrainingText(text: string): string {
  return text
    .replace(/\bсмсмчм\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
      <div className="md:col-span-4">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">{title}</h2>
        <div className="w-12 h-1 bg-teal-500 mt-4 rounded-full" />
      </div>
      <div className="md:col-span-8">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 md:p-5 rounded-2xl transition-all hover:bg-white/10">
      <p className="text-[10px] text-teal-400 uppercase font-black tracking-widest mb-2">{label}</p>
      <p className="text-base md:text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function ProgramCard({ title, body, tone }: { title: string; body: string; tone: "teal" | "dark" }) {
  const isTeal = tone === "teal";
  return (
    <div
      className={`rounded-3xl p-6 md:p-8 border ${isTeal ? "bg-teal-50 border-teal-100" : "bg-slate-900 border-slate-800 text-white"}`}
    >
      <div className={`text-xs font-black uppercase tracking-widest mb-3 ${isTeal ? "text-teal-600" : "text-teal-400"}`}>
        {isTeal ? "Теория" : "Практика"}
      </div>
      <div className={`text-xl font-extrabold ${isTeal ? "text-slate-900" : "text-white"}`}>{title}</div>
      <div className={`mt-3 text-sm whitespace-pre-line leading-relaxed ${isTeal ? "text-slate-600" : "text-slate-300"}`}>
        {body}
      </div>
    </div>
  );
}

function HeroBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-4 py-1.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-[10px] font-extrabold tracking-widest uppercase">
      {children}
    </span>
  );
}

function LeadLi({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-4 group">
      <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0 group-hover:scale-110 transition-transform">
        <Check className="w-3.5 h-3.5" strokeWidth={3} />
      </div>
      <span className="text-sm text-slate-700 font-semibold">{children}</span>
    </li>
  );
}
