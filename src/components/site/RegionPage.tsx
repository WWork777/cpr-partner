import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MapPin, Phone, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ApplicationForm } from "@/components/site/ApplicationForm";
import { publishedCoursesQuery } from "@/lib/queries";

type Course = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
};

export function RegionPage({
  city,
  address,
  phone,
  filterCourses,
  titleOverride,
  intro,
}: {
  city: string;
  address: string;
  phone: string;
  filterCourses?: (c: Course) => boolean;
  titleOverride?: string;
  intro?: string;
}) {
  const { data } = useSuspenseQuery(publishedCoursesQuery);
  const courses = data as unknown as Course[];
  const filtered = filterCourses ? courses.filter(filterCourses) : courses;
  const top = filtered.slice(0, 9);
  const declinedCity =
    city === "Красноярск" ? "Красноярске" : city === "Томск" ? "Томске" : city === "Кемерово" ? "Кемерово" : city;
  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft text-primary px-3 py-1 text-xs font-semibold">
          <MapPin className="h-4 w-4" /> {city}
        </div>
        <h1 className="mt-3 text-3xl md:text-5xl font-bold">
          {titleOverride ?? `Учебный центр в ${declinedCity}`}
        </h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          {intro ??
            "Очное и дистанционное обучение по охране труда, рабочим профессиям и спецтехнике. Лицензия Минобрнауки, удостоверения установленного образца."}
        </p>
        <div className="mt-5 flex flex-wrap gap-4 text-sm">
          <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 font-semibold text-primary">
            <Phone className="h-4 w-4" /> {phone}
          </a>
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" /> {address}
          </span>
        </div>

        <div className="mt-8 rounded-2xl border border-primary/20 bg-primary-soft p-5 md:p-6">
          <h2 className="text-xl font-bold">Обучение на самоходную технику в {declinedCity}</h2>
          <p className="mt-2 max-w-3xl text-sm text-foreground/80">
            Подготовка трактористов-машинистов, водителей погрузчиков и машинистов экскаваторов:
            теория, практика, экзамен и документы для Гостехнадзора.
          </p>
          <Link
            to="/napravleniya/$slug"
            params={{ slug: "traktorist-mashinist" }}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            Подробнее о направлении <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <h2 className="mt-12 text-2xl font-bold">
          {filterCourses ? `Курсы — ${city}` : `Популярные курсы — ${city}`}
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {top.map((c) => (
            <Link
              key={c.id}
              to="/courses/$slug"
              params={{ slug: c.slug }}
              className="rounded-2xl bg-card p-5 shadow-soft hover:shadow-card transition-shadow"
            >
              <div className="font-semibold">{c.title}</div>
              {c.short_description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{c.short_description}</p>
              )}
              <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
                Подробнее <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
          {top.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full">
              Подходящих курсов пока нет — оставьте заявку, и мы подберём.
            </p>
          )}
        </div>

        <div className="mt-12 rounded-2xl bg-card p-6 shadow-soft max-w-2xl">
          <h2 className="text-xl font-bold">Оставьте заявку</h2>
          <p className="mt-1 text-sm text-muted-foreground">Перезвоним и подберём курс под ваши задачи.</p>
          <div className="mt-4">
            <ApplicationForm courseTitle={`Город: ${city}`} />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
