import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { galleryQuery } from "@/lib/queries";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Галерея — ЦПР Партнер" },
      { name: "description", content: "Фотографии аудиторий, занятий и выпусков учебного центра ЦПР Партнер." },
    ],
    links: [{ rel: "canonical", href: "/gallery" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(galleryQuery),
  component: GalleryPage,
});

function GalleryPage() {
  const { data: items } = useSuspenseQuery(galleryQuery);
  const [active, setActive] = useState<string | null>(null);
  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <h1 className="text-3xl md:text-5xl font-bold">Галерея</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">Аудитории, практические занятия, выпуски.</p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setActive(g.image_url)}
              className="group aspect-square rounded-2xl overflow-hidden bg-muted relative"
            >
              <img src={g.image_url} alt={g.alt ?? ""} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
            </button>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground col-span-full">Фотографии скоро появятся.</p>}
        </div>
      </section>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setActive(null)}
        >
          <img src={active} alt="" className="max-h-full max-w-full rounded-xl shadow-card" />
        </div>
      )}
    </SiteLayout>
  );
}
