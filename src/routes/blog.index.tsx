import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { publishedPostsQuery } from "@/lib/queries";

export const Route = createFileRoute("/blog/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(publishedPostsQuery),
  head: () => ({
    meta: [
      { title: "Блог об охране труда, электробезопасности и обучении | ЦПР Партнер" },
      {
        name: "description",
        content:
          "Статьи о законодательстве, обучении персонала, удостоверениях, изменениях в нормативах. Учебный центр ЦПР Партнер.",
      },
      { property: "og:title", content: "Блог — ЦПР Партнер" },
      { property: "og:description", content: "Статьи об охране труда, обучении и нормативных требованиях." },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Не удалось загрузить блог</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Не найдено</h1>
      </div>
    </SiteLayout>
  ),
  component: BlogIndex,
});

function BlogIndex() {
  const { data } = useSuspenseQuery(publishedPostsQuery);
  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        <h1 className="text-3xl md:text-5xl font-bold">Блог</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Разбираем нормативку, делимся опытом обучения и отвечаем на частые вопросы.
        </p>

        {data.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Скоро здесь появятся первые статьи.
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((p) => (
              <Link
                key={p.id}
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="group rounded-2xl bg-card shadow-soft overflow-hidden hover:shadow-card transition-shadow"
              >
                {p.cover_url && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={p.cover_url}
                      alt={p.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-5">
                  {p.published_at && (
                    <div className="text-xs text-muted-foreground">
                      {new Date(p.published_at).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  )}
                  <div className="mt-2 font-semibold leading-snug group-hover:text-primary transition-colors">
                    {p.title}
                  </div>
                  {p.excerpt && (
                    <div className="mt-2 text-sm text-muted-foreground line-clamp-3">{p.excerpt}</div>
                  )}
                  {p.tags && p.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-[11px] rounded-full bg-primary-soft text-primary px-2 py-0.5">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
