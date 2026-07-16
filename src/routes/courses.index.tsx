import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { categoryImage, courseImageWithFallback } from "@/lib/course-images";
import { categoriesQuery, publishedCoursesQuery } from "@/lib/queries";

const searchSchema = z.object({
  category: fallback(z.string(), "").default(""),
  sort: fallback(z.enum(["popular", "price_asc", "price_desc", "title"]), "popular").default("popular"),
  min: fallback(z.number().int().min(0).optional(), undefined),
  max: fallback(z.number().int().min(0).optional(), undefined),
});

type SearchVals = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/courses/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Каталог курсов: охрана труда, высота, электробезопасность | ЦПР Партнер" },
      {
        name: "description",
        content:
          "Все программы обучения ЦПР Партнер: охрана труда, работы на высоте, первая помощь, электробезопасность, промбезопасность, пожарная безопасность, спецтехника и рабочие профессии.",
      },
      {
        name: "keywords",
        content:
          "обучение по охране труда, работы на высоте обучение, обучение оказанию первой помощи, обучение по электробезопасности, курсы пожарной безопасности, промышленная безопасность обучение",
      },
      { property: "og:title", content: "Каталог курсов и программ обучения — ЦПР Партнер" },
      {
        property: "og:description",
        content: "Охрана труда, высота, первая помощь, электробезопасность, промбезопасность, пожарная безопасность и рабочие профессии.",
      },
      { property: "og:url", content: "/courses" },
    ],
    links: [{ rel: "canonical", href: "/courses" }],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(publishedCoursesQuery),
      context.queryClient.ensureQueryData(categoriesQuery),
    ]),
  component: CoursesPage,
});

function CoursesPage() {
  const { data: courses } = useSuspenseQuery(publishedCoursesQuery);
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { category, sort, min, max } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of courses) {
      const slug = c.categories?.slug;
      if (slug) map.set(slug, (map.get(slug) ?? 0) + 1);
    }
    return map;
  }, [courses]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = courses.filter((c) => {
      if (category && c.categories?.slug !== category) return false;
      if (needle && !`${c.title} ${c.short_description ?? ""}`.toLowerCase().includes(needle)) return false;
      const price = c.price ? Number(c.price) : null;
      if (min != null && (price == null || price < min)) return false;
      if (max != null && (price == null || price > max)) return false;
      return true;
    });
    const sorted = [...list];
    if (sort === "price_asc") sorted.sort((a, b) => (Number(a.price ?? Infinity)) - (Number(b.price ?? Infinity)));
    else if (sort === "price_desc") sorted.sort((a, b) => (Number(b.price ?? -Infinity)) - (Number(a.price ?? -Infinity)));
    else if (sort === "title") sorted.sort((a, b) => a.title.localeCompare(b.title, "ru"));
    return sorted;
  }, [courses, category, q, min, max, sort]);

  const activeFiltersCount = (category ? 1 : 0) + (min != null ? 1 : 0) + (max != null ? 1 : 0);

  const resetFilters = () =>
    navigate({ search: { category: "", sort, min: undefined, max: undefined } });

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 pt-8 pb-4 lg:px-8">
        <div className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Главная</Link> / Все курсы
        </div>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold">Каталог курсов и программ обучения</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Выберите направление, изучите программу и оставьте заявку. Менеджер свяжется с вами и подберёт удобный формат обучения.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <FilterPanel
              categories={categories}
              counts={counts}
              category={category}
              min={min}
              max={max}
              activeFiltersCount={activeFiltersCount}
              onCategory={(slug) => navigate({ search: (p: SearchVals) => ({ ...p, category: slug }) })}
              onPrice={(newMin, newMax) => navigate({ search: (p: SearchVals) => ({ ...p, min: newMin, max: newMax }) })}
              onReset={resetFilters}
            />
          </aside>

          {/* Main */}
          <div className="min-w-0">
            <div className="rounded-2xl bg-card shadow-soft p-3 md:p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Поиск по названию"
                  className="pl-9 h-11"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => navigate({ search: (p: SearchVals) => ({ ...p, sort: e.target.value as typeof sort }) })}
                className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                aria-label="Сортировка"
              >
                <option value="popular">Сначала популярные</option>
                <option value="price_asc">Цена: по возрастанию</option>
                <option value="price_desc">Цена: по убыванию</option>
                <option value="title">По названию</option>
              </select>
              <Button
                variant="outline"
                className="lg:hidden h-11"
                onClick={() => setMobileOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Фильтры{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ""}
              </Button>
            </div>

            <div className="mt-3 text-sm text-muted-foreground">
              Найдено: {filtered.length}
            </div>

            <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c) => (
                <Link
                  key={c.id}
                  to="/courses/$slug"
                  params={{ slug: c.slug }}
                  className="group block rounded-2xl bg-card shadow-soft overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-card"
                >
                  <div
                    className="aspect-[16/10] bg-muted bg-cover bg-center"
                    style={{
                      backgroundImage: courseImageWithFallback(c.image_url, categoryImage(c.categories?.slug)),
                    }}
                  />
                  <div className="p-5">
                    {c.categories?.name && (
                      <div className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                        {c.categories.name}
                      </div>
                    )}
                    <div className="mt-2 font-bold text-lg leading-snug group-hover:text-primary line-clamp-2">
                      {c.title}
                    </div>
                    {c.short_description && (
                      <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {c.short_description}
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-lg font-bold">
                        {c.price ? `${Number(c.price).toLocaleString("ru-RU")} ₽` : "По запросу"}
                      </div>
                      <div className="text-sm text-muted-foreground">{c.duration}</div>
                    </div>
                  </div>
                </Link>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
                  По вашему запросу ничего не найдено.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute left-0 top-0 h-full w-[88%] max-w-sm bg-background shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div className="font-semibold">Фильтры</div>
              <button onClick={() => setMobileOpen(false)} aria-label="Закрыть" className="p-1 rounded hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <FilterPanel
                categories={categories}
                counts={counts}
                category={category}
                min={min}
                max={max}
                activeFiltersCount={activeFiltersCount}
                onCategory={(slug) => navigate({ search: (p: SearchVals) => ({ ...p, category: slug }) })}
                onPrice={(newMin, newMax) => navigate({ search: (p: SearchVals) => ({ ...p, min: newMin, max: newMax }) })}
                onReset={resetFilters}
              />
              <Button className="w-full mt-4" onClick={() => setMobileOpen(false)}>
                Показать результаты
              </Button>
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}

function FilterPanel({
  categories,
  counts,
  category,
  min,
  max,
  activeFiltersCount,
  onCategory,
  onPrice,
  onReset,
}: {
  categories: { id: string; slug: string; name: string }[];
  counts: Map<string, number>;
  category: string;
  min: number | undefined;
  max: number | undefined;
  activeFiltersCount: number;
  onCategory: (slug: string) => void;
  onPrice: (min: number | undefined, max: number | undefined) => void;
  onReset: () => void;
}) {
  const [localMin, setLocalMin] = useState(min?.toString() ?? "");
  const [localMax, setLocalMax] = useState(max?.toString() ?? "");

  const applyPrice = () => {
    const a = localMin === "" ? undefined : Math.max(0, parseInt(localMin, 10) || 0);
    const b = localMax === "" ? undefined : Math.max(0, parseInt(localMax, 10) || 0);
    onPrice(a, b);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Направления</h2>
          {activeFiltersCount > 0 && (
            <button onClick={onReset} className="text-xs text-primary hover:underline">
              Сбросить
            </button>
          )}
        </div>
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={() => onCategory("")}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                !category ? "bg-primary-soft text-primary font-medium" : "hover:bg-muted text-foreground/80"
              }`}
            >
              <span>Все курсы</span>
              <span className="text-xs text-muted-foreground">{Array.from(counts.values()).reduce((a, b) => a + b, 0)}</span>
            </button>
          </li>
          {categories.map((c) => {
            const active = category === c.slug;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onCategory(c.slug)}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-left transition-colors ${
                    active ? "bg-primary-soft text-primary font-medium" : "hover:bg-muted text-foreground/80"
                  }`}
                >
                  <span className="line-clamp-2">{c.name}</span>
                  <span className="ml-2 shrink-0 text-xs text-muted-foreground">{counts.get(c.slug) ?? 0}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Цена, ₽</h2>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="от"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            className="h-10"
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="до"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            onBlur={applyPrice}
            onKeyDown={(e) => e.key === "Enter" && applyPrice()}
            className="h-10"
          />
        </div>
        <Button variant="outline" size="sm" className="mt-2 w-full" onClick={applyPrice}>
          Применить
        </Button>
      </div>
    </div>
  );
}
