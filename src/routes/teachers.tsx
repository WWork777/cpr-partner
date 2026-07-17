import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { TeacherPhoto } from "@/components/site/TeacherPhoto";
import { teachersQuery } from "@/lib/queries";

export const Route = createFileRoute("/teachers")({
  head: () => ({
    meta: [
      { title: "Преподаватели — ЦПР Партнер" },
      { name: "description", content: "Преподавательский состав учебного центра ЦПР Партнер: эксперты по охране труда, электробезопасности, рабочим профессиям." },
    ],
    links: [{ rel: "canonical", href: "/teachers" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(teachersQuery),
  component: TeachersPage,
});

function TeachersPage() {
  const { data: teachers } = useSuspenseQuery(teachersQuery);
  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <h1 className="text-3xl md:text-5xl font-bold">Преподавательский состав</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl">
          Эксперты-практики с многолетним опытом в охране труда, промышленной и электробезопасности.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teachers.map((t) => (
              <article key={t.id} className="rounded-2xl bg-card p-5 shadow-soft border border-border/40">
                <div className="flex items-start gap-4">
                  <TeacherPhoto
                    src={t.photo_url}
                    alt={t.full_name}
                    className="h-24 w-24 rounded-2xl object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold leading-tight">{t.full_name}</div>
                    {t.position && <div className="text-sm text-muted-foreground mt-1">{t.position}</div>}
                  </div>
                </div>
                {t.credentials && <p className="mt-4 text-sm text-muted-foreground">{t.credentials}</p>}
                {t.bio && <p className="mt-3 text-sm">{t.bio}</p>}
              </article>
            ))}
          {teachers.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full">Информация скоро появится.</p>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
