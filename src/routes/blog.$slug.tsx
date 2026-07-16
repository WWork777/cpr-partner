import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { postBySlugQuery } from "@/lib/queries";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ context, params }) => {
    const post = await context.queryClient.ensureQueryData(postBySlugQuery(params.slug));
    if (!post) throw notFound();
    return post;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Статья — ЦПР Партнер" }] };
    const p = loaderData;
    const url = `/blog/${params.slug}`;
    const title = p.meta_title || `${p.title} | ЦПР Партнер`;
    const desc = p.meta_description || p.excerpt || p.title;
    return {
      meta: [
        { title: title.slice(0, 70) },
        { name: "description", content: desc.slice(0, 159) },
        { property: "og:title", content: p.title },
        { property: "og:description", content: desc.slice(0, 159) },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        ...(p.cover_url
          ? [
              { property: "og:image", content: p.cover_url },
              { name: "twitter:image", content: p.cover_url },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: p.title,
            description: desc,
            datePublished: p.published_at ?? p.created_at,
            dateModified: p.updated_at,
            author: { "@type": "Organization", name: "ЦПР Партнер" },
            publisher: {
              "@type": "Organization",
              name: "ЦПР Партнер",
              sameAs: "https://cpr-partner.ru",
            },
            ...(p.cover_url ? { image: p.cover_url } : {}),
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Статья не найдена</h1>
        <Link to="/blog" className="mt-6 inline-block text-primary hover:underline">
          ← Все статьи
        </Link>
      </div>
    </SiteLayout>
  ),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Не удалось загрузить статью</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </SiteLayout>
  ),
  component: PostPage,
});

function PostPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(postBySlugQuery(slug));
  if (!data) return null;

  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-10 lg:px-8 lg:py-14">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" /> Все статьи
        </Link>
        {data.published_at && (
          <div className="mt-6 text-sm text-muted-foreground">
            {new Date(data.published_at).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        )}
        <h1 className="mt-2 text-3xl md:text-5xl font-bold leading-tight">{data.title}</h1>
        {data.excerpt && (
          <p className="mt-4 text-lg text-muted-foreground">{data.excerpt}</p>
        )}
        {data.cover_url && (
          <img
            src={data.cover_url}
            alt={data.title}
            className="mt-8 w-full rounded-2xl shadow-card"
          />
        )}
        <div className="prose prose-lg max-w-none mt-8 whitespace-pre-line text-foreground/90 leading-relaxed">
          {data.content}
        </div>
        {data.tags && data.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {data.tags.map((t) => (
              <span key={t} className="text-xs rounded-full bg-primary-soft text-primary px-3 py-1">
                #{t}
              </span>
            ))}
          </div>
        )}
      </article>
    </SiteLayout>
  );
}
