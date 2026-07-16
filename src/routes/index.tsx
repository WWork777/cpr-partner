import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, Clock, MapPin, Wallet } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ApplicationForm } from "@/components/site/ApplicationForm";
import { HomeBanners } from "@/components/site/HomeBanners";
import { PartnersSection, ReviewsSection } from "@/components/site/PartnersAndReviews";
import { WhyUs } from "@/components/site/WhyUs";
import { NewsCarousel } from "@/components/site/NewsCarousel";
import { TeachersCarousel } from "@/components/site/TeachersCarousel";
import { CourseCalculator } from "@/components/site/CourseCalculator";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/cpr-logo.png";
import { categoryImage, courseImageWithFallback, siteImages } from "@/lib/course-images";
import { categoriesQuery, publishedCoursesQuery, publishedPostsQuery, teachersQuery } from "@/lib/queries";
import { COMPANY_CONTACTS } from "@/lib/company";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Учебный центр ЦПР Партнер — обучение, удостоверения, повышение квалификации" },
      {
        name: "description",
        content:
          "Обучение по охране труда, рабочим профессиям, электробезопасности, пожарной безопасности, работам на высоте. Удостоверения с занесением в ФИС ФРДО, профпереподготовка и повышение квалификации очно и дистанционно по всей России. Лицензия, аккредитации Минтруда, МЧС, Ростехнадзора.",
      },
      { name: "keywords", content: "учебный центр, обучение охране труда, удостоверение, повышение квалификации, профпереподготовка, рабочие профессии, электробезопасность, пожарно-технический минимум, работы на высоте, обучение дистанционно, Красноярск, Томск, Кемерово" },
      { property: "og:title", content: "ЦПР Партнер — обучение и удостоверения по 200+ программам" },
      {
        property: "og:description",
        content: "Лицензированный учебный центр: охрана труда, рабочие профессии, спецтехника. Удостоверения в ФИС ФРДО. Очно и дистанционно по РФ.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "ООО ЦПР «Партнёр»",
          alternateName: "ЦПР Партнер",
          url: "/",
          telephone: "+7-800-500-70-16",
          email: COMPANY_CONTACTS.email,
          address: {
            "@type": "PostalAddress",
            streetAddress: "ул. Кутузова, д. 1, стр. 37, оф. 2-10",
            addressLocality: "Красноярск",
            postalCode: "660049",
            addressCountry: "RU",
          },
          foundingDate: "2009",
          areaServed: "RU",
          sameAs: ["https://cpr-partner.ru"],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "Какие документы выдаёте по окончании обучения?", acceptedAnswer: { "@type": "Answer", text: "Удостоверение установленного образца, протокол проверки знаний и при необходимости диплом о профпереподготовке. Все документы вносятся в ФИС ФРДО." } },
            { "@type": "Question", name: "Можно ли пройти обучение дистанционно?", acceptedAnswer: { "@type": "Answer", text: "Да, большинство программ доступны полностью дистанционно — без отрыва от производства, по всей России." } },
            { "@type": "Question", name: "Сколько стоит обучение?", acceptedAnswer: { "@type": "Answer", text: "Стоимость зависит от программы и формата обучения. Для группы от 5 человек действуют скидки, возможна оплата по счёту для юр. лиц." } },
            { "@type": "Question", name: "Как быстро можно получить удостоверение?", acceptedAnswer: { "@type": "Answer", text: "Сроки зависят от программы — от 1 дня до нескольких недель. Группы стартуют ежедневно." } },
          ],
        }),
      },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(publishedCoursesQuery),
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(publishedPostsQuery),
      context.queryClient.ensureQueryData(teachersQuery),
    ]),

  component: HomePage,
});

function HomePage() {
  const { data: courses } = useSuspenseQuery(publishedCoursesQuery);
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const featured = courses[0];
  const popular = courses.slice(0, 6);

  return (
    <SiteLayout>
      <HomeBanners />
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pt-8 pb-12 lg:px-8">
        <div
          className="relative overflow-hidden rounded-3xl shadow-card min-h-[420px] md:min-h-[520px] flex flex-col justify-end"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(8,20,35,0.88) 0%, rgba(8,20,35,0.62) 55%, rgba(8,20,35,0.24) 100%), url(${siteImages.machineryTraining})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="p-6 md:p-12 lg:p-16 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/95 px-4 py-1.5 text-sm font-semibold text-white shadow-md ring-1 ring-teal-300/60 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              Ежедневный набор в группы
            </div>

            <h1 className="mt-4 text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.05] tracking-tight [text-shadow:0_2px_16px_rgba(0,0,0,0.5)]">
              Учебный центр <br /> <span className="text-white">ЦПР Партнер</span>
            </h1>
            <p className="mt-4 text-white text-base md:text-lg max-w-xl [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
              Аккредитация Гостехнадзора. Права на спецтехнику, охрана труда, рабочие специальности —
              быстро, удобно и 100% легально.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full bg-gradient-teal hover:opacity-90 h-12 px-6 text-base">
                <Link to="/courses">
                  Все курсы <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {featured && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full h-12 px-6 text-base border-white/40 bg-white/10 backdrop-blur text-white hover:bg-white/20 hover:text-white"
                >
                  <Link to="/courses/$slug" params={{ slug: featured.slug }}>
                    Записаться на курс
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="px-6 pb-6 md:px-12 md:pb-10 lg:px-16 lg:pb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <StatPill icon={<CalendarDays className="h-4 w-4" />} label="Старт" value="Ежедневно" />
              <StatPill icon={<Clock className="h-4 w-4" />} label="Длительность" value="от 16 часов" />
              <StatPill icon={<MapPin className="h-4 w-4" />} label="Формат" value="Очно, дистанционно" />
              <StatPill icon={<Wallet className="h-4 w-4" />} label="Стоимость" value="от 500 ₽" />
            </div>
          </div>
        </div>
      </section>


      {/* Trust counters */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8 -mt-2 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { v: "17+ лет", l: "на рынке доп. образования" },
            { v: "50 000+", l: "выданных удостоверений" },
            { v: "200+", l: "программ обучения" },
            { v: "ФИС ФРДО", l: "все документы в реестре" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl bg-card p-5 shadow-soft text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">{s.v}</div>
              <div className="mt-1 text-xs md:text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Calculator */}
      <CourseCalculator className="mt-16" />

      {/* Schedule teaser */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8 mt-16">
        <div className="grid overflow-hidden rounded-3xl bg-slate-900 text-white shadow-card lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="p-6 md:p-10 lg:p-12">
            <img src={logoAsset} alt="ЦПР Партнер" className="h-14 w-auto rounded-md bg-white/95 p-1.5" width={115} height={56} />
            <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-200">
              <CalendarDays className="h-3.5 w-3.5" /> Расписание групп
            </div>
            <h2 className="mt-4 max-w-2xl text-2xl font-bold md:text-4xl">
              Очные группы по кварталам, дистанционные потоки — ежедневно
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
              Проверьте ближайшие даты по охране труда, электробезопасности, промбезопасности,
              рабочим профессиям и спецтехнике. Менеджер поможет подобрать удобный поток.
            </p>
            <Button asChild size="lg" className="mt-6 rounded-full bg-gradient-teal hover:opacity-90">
              <Link to="/raspisanie">
                Смотреть расписание <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div
            className="min-h-[280px] bg-cover bg-center lg:min-h-full"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(15,23,42,0.25), rgba(15,23,42,0)), url(${siteImages.scheduleDesk})`,
            }}
          />
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8 mt-16">


        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-bold">Направления обучения</h2>
          <Link to="/napravleniya" className="text-sm font-semibold text-primary hover:underline whitespace-nowrap">
            Все направления →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
          {categories.slice(0, 8).map((c, i) => (
            <Link
              key={c.id}
              to="/courses"
              search={{ category: c.slug }}
              className="group relative isolate flex h-full min-h-[230px] flex-col overflow-hidden rounded-2xl p-6 text-white shadow-card transition-transform hover:-translate-y-1"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(9,20,35,0.18), rgba(9,20,35,0.82)), url(${categoryImage(c.slug, i)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <span className="absolute inset-0 -z-10 bg-teal-900/10 transition-colors group-hover:bg-teal-900/0" />
              <div className="text-xs font-semibold tracking-wider opacity-80">0{i + 1}</div>
              <div className="mt-3 text-lg font-bold leading-tight">{c.name}</div>
              {c.description && (
                <div className="mt-2 text-sm text-white/85 line-clamp-3">{c.description}</div>
              )}
              <div className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-medium">
                Смотреть курсы <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular courses */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8 mt-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl md:text-3xl font-bold">Популярные курсы</h2>
          <Link to="/courses" className="text-sm font-semibold text-primary hover:underline">
            Все курсы →
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {popular.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
          {popular.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
              Курсы скоро появятся.
            </div>
          )}
        </div>
      </section>

      {/* Why us */}
      <WhyUs className="mt-20" />


      <PartnersSection />
      <ReviewsSection />

      <TeachersCarousel />

      <NewsCarousel />


      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 lg:px-8 mt-20">
        <h2 className="text-2xl md:text-3xl font-bold text-center">Частые вопросы об обучении</h2>
        <div className="mt-8 space-y-3">
          {[
            { q: "Что за центр ЦПР «Партнёр» и какие у вас лицензии?", a: "ЦПР «Партнёр» — лицензированный учебный центр дополнительного профессионального образования, работаем с 2009 года. Обучаем по программам охраны труда, ПТМ, электробезопасности, работ на высоте, промбезопасности и более чем 100 рабочим профессиям — от стропальщика и оператора котельной до водителя погрузчика и машиниста крана." },
            { q: "Какие документы выдаёте по окончании обучения?", a: "Удостоверение установленного образца, протокол проверки знаний, при необходимости — диплом о профпереподготовке или свидетельство о присвоении рабочей профессии. Все документы вносятся в государственный реестр ФИС ФРДО и принимаются Ростехнадзором, Минтрудом, МЧС, ГИТ и заказчиками по 44-ФЗ и 223-ФЗ." },
            { q: "Можно ли пройти курс дистанционно?", a: "Да. Обучение проходит очно в классах в Красноярске, Томске и Кемерово, либо полностью дистанционно — через личный кабинет с видеолекциями, тренажёрами и итоговым тестированием. Учитесь из любого города России без отрыва от работы." },
            { q: "Сколько действует удостоверение и нужно ли его продлевать?", a: "Срок действия зависит от программы: охрана труда — 3 года, электробезопасность и работы на высоте — 1 год, рабочие профессии — бессрочно. Мы напомним о продлении заранее." },
            { q: "Как организовать корпоративное обучение сотрудников?", a: "Оставьте заявку — менеджер подберёт программы под ваши задачи и подготовит КП. Доступна оплата по счёту для юрлиц, договор и полный пакет закрывающих документов, рассрочка и скидки при обучении от 5 человек." },
            { q: "Работаете ли с другими регионами кроме Красноярска?", a: "Да, обучаем по всей России: филиалы в Красноярске, Томске и Кемерово, дистанционные программы доступны из любого города." },
            { q: "Можно ли получить или продлить удостоверение, повышение квалификации?", a: "Да. Если нужно пройти повышение квалификации, получить или продлить удостоверение, провести обучение по охране труда или организовать проверку знаний комиссии предприятия — оставьте заявку, и менеджер подберёт оптимальную программу под ваши задачи." },
          ].map((f) => (
            <details key={f.q} className="group rounded-2xl bg-card shadow-soft px-5 py-4 open:shadow-card">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-semibold">
                {f.q}
                <span className="text-primary group-open:rotate-45 transition-transform text-xl leading-none">+</span>
              </summary>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>





      {/* Application */}
      <section className="mx-auto max-w-7xl px-4 lg:px-8 mt-20">
        <ApplicationForm />
      </section>

    </SiteLayout>
  );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/95 backdrop-blur px-4 py-3 shadow-soft">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 text-base font-bold text-foreground">{value}</div>
    </div>
  );
}

type Course = NonNullable<Awaited<ReturnType<NonNullable<typeof publishedCoursesQuery.queryFn>>>>[number];

function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      to="/courses/$slug"
      params={{ slug: course.slug }}
      className="group block rounded-2xl bg-card shadow-soft overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-card"
    >
      <div
        className="aspect-[16/10] bg-muted bg-cover bg-center"
        style={{
          backgroundImage: courseImageWithFallback(course.image_url, categoryImage(course.categories?.slug)),
        }}
      />
      <div className="p-5">
        {course.categories?.name && (
          <div className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
            {course.categories.name}
          </div>
        )}
        <div className="mt-2 font-bold text-lg leading-snug group-hover:text-primary line-clamp-2">
          {course.title}
        </div>
        {course.short_description && (
          <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {course.short_description}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-lg font-bold text-foreground">
            {course.price ? `${Number(course.price).toLocaleString("ru-RU")} ₽` : "По запросу"}
          </div>
          <div className="text-sm text-muted-foreground">{course.duration}</div>
        </div>
      </div>
    </Link>
  );
}
