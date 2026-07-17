import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { TeacherPhoto } from "@/components/site/TeacherPhoto";
import { teachersQuery } from "@/lib/queries";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function TeachersCarousel() {
  const { data } = useSuspenseQuery(teachersQuery);
  const items = data.slice(0, 12);
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 lg:px-8 mt-20">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Наши преподаватели</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Практикующие эксперты с многолетним опытом в отрасли
          </p>
        </div>
        <Link
          to="/teachers"
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Все преподаватели <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <Carousel opts={{ align: "start", loop: false }}>
        <CarouselContent className="-ml-4">
          {items.map((t) => (
              <CarouselItem
                key={t.id}
                className="pl-4 basis-[80%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
              >
                <article className="group h-full overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:shadow-card">
                  <div className="aspect-[3/4] w-full bg-muted bg-cover bg-center relative">
                    <TeacherPhoto
                      src={t.photo_url}
                      alt={t.full_name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold leading-snug line-clamp-2 group-hover:text-primary">
                      {t.full_name}
                    </h3>
                    {t.position && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {t.position}
                      </p>
                    )}
                    {t.credentials && (
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-3">
                        {t.credentials}
                      </p>
                    )}
                  </div>
                </article>
              </CarouselItem>
            ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>

      <div className="sm:hidden mt-4 text-center">
        <Link
          to="/teachers"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          Все преподаватели <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
