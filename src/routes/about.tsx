import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "О компании — учебный центр ЦПР Партнер" },
      {
        name: "description",
        content:
          "Учебный центр ЦПР «Партнёр» с 2009 года: лицензия на образовательную деятельность, аккредитации Минтруда, МЧС, Гостехнадзора, собственный трактородром и полигон для работ на высоте.",
      },
      { property: "og:title", content: "О компании — ЦПР Партнер" },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

const POINTS = [
  "Аккредитация Гостехнадзора и Министерства образования",
  "Собственный учебный класс и трактородром в центре города",
  "Опытные преподаватели — практики с многолетним стажем",
  "Гибкие форматы: очно, дистанционно, корпоративные группы",
  "Помощь с трудоустройством и сотрудничество с работодателями",
];

function AboutPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
        <div className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Главная</Link> / О компании
        </div>
        <h1 className="mt-2 text-3xl md:text-5xl font-bold">О ЦПР Партнер</h1>
        <p className="mt-6 text-lg leading-relaxed text-foreground/85">
          Центр профессионального развития «Партнер» — это аккредитованный учебный центр, который
          помогает специалистам получать официальные удостоверения и повышать квалификацию более 10
          лет. Мы обучаем как новичков, так и опытных сотрудников, готовим к экзаменам в Гостехнадзоре
          и сопровождаем выпускников при трудоустройстве.
        </p>
        <div className="mt-10 rounded-3xl bg-card p-6 md:p-10 shadow-card">
          <div className="text-xl font-bold">Что вы получаете, обучаясь у нас</div>
          <ul className="mt-6 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                  <Check className="h-4 w-4" />
                </span>
                <span className="text-foreground/85">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </SiteLayout>
  );
}
