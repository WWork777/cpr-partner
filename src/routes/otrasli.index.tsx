import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Building2, Zap, Wrench, Factory, ArrowRight } from "lucide-react";

const items = [
  { slug: "stroitelstvo", title: "Строительство", icon: Building2, desc: "Высотные работы, охрана труда, спецтехника" },
  { slug: "energetika", title: "Энергетика", icon: Zap, desc: "Электробезопасность, тепловые установки" },
  { slug: "zhkh", title: "ЖКХ", icon: Wrench, desc: "Газ, лифты, сантехника, рабочие профессии" },
  { slug: "promyshlennost", title: "Промышленность", icon: Factory, desc: "Промбезопасность, сварщики, стропальщики" },
];

export const Route = createFileRoute("/otrasli/")({
  head: () => ({
    meta: [
      { title: "Обучение по отраслям — ЦПР Партнер" },
      { name: "description", content: "Программы обучения для строительства, энергетики, ЖКХ и промышленности. Подбор курсов под задачи отрасли." },
      { property: "og:title", content: "Отраслевые программы обучения" },
    ],
    links: [{ rel: "canonical", href: "/otrasli" }],
  }),
  component: () => (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
        <h1 className="text-3xl md:text-5xl font-bold">Обучение по отраслям</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">Подобрали курсы под специфику бизнеса. Корпоративные программы — со скидками от 10%.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {items.map((i) => {
            const Icon = i.icon;
            return (
              <Link key={i.slug} to="/otrasli/$slug" params={{ slug: i.slug }} className="rounded-2xl bg-card p-6 shadow-soft hover:shadow-card transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-teal text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="mt-4 font-bold">{i.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{i.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary font-semibold">Открыть <ArrowRight className="h-3 w-3" /></span>
              </Link>
            );
          })}
        </div>
      </section>
    </SiteLayout>
  ),
});
