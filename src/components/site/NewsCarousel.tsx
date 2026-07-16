import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays } from "lucide-react";
import { publishedPostsQuery } from "@/lib/queries";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

function formatDate(d?: string | null) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function NewsCarousel() {
  const { data } = useSuspenseQuery(publishedPostsQuery);
  const items = data.slice(0, 9);
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 lg:px-8 mt-20">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Новости и статьи</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Изменения в нормативке, разборы и анонсы курсов
          </p>
        </div>
        <Link
          to="/blog"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Все новости <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <Carousel opts={{ align: "start", loop: false }}>
        <CarouselContent className="-ml-4">
          {items.map((p) => (
            <CarouselItem
              key={p.id}
              className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
            >
              <Link
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="group block h-full overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:shadow-card"
              >
                <div
                  className="aspect-[16/9] w-full bg-muted bg-cover bg-center"
                  style={
                    p.cover_url
                      ? { backgroundImage: `url(${p.cover_url})` }
                      : undefined
                  }
                />
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(p.published_at)}
                  </div>
                  <h3 className="mt-2 font-semibold leading-snug line-clamp-2 group-hover:text-primary">
                    {p.title}
                  </h3>
                  {p.excerpt && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                      {p.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>

      <div className="sm:hidden mt-4 text-center">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          Все новости <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
