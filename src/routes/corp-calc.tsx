import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Calculator, Users, Check, ChevronsUpDown, BadgePercent } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { publishedCoursesQuery } from "@/lib/queries";
import { ApplicationForm } from "@/components/site/ApplicationForm";

export const Route = createFileRoute("/corp-calc")({
  head: () => ({
    meta: [
      { title: "Калькулятор стоимости корпоративного обучения — ЦПР Партнер" },
      { name: "description", content: "Рассчитайте стоимость обучения группы сотрудников онлайн. Скидки от 10% при группах от 5 человек." },
      { property: "og:title", content: "Корпоративное обучение — калькулятор" },
    ],
    links: [{ rel: "canonical", href: "/corp-calc" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(publishedCoursesQuery),
  component: CalcPage,
});

function tierDiscount(n: number) {
  if (n >= 30) return 0.2;
  if (n >= 15) return 0.15;
  if (n >= 5) return 0.1;
  return 0;
}

function CalcPage() {
  const { data: courses } = useSuspenseQuery(publishedCoursesQuery);
  const [courseId, setCourseId] = useState<string>(courses[0]?.id ?? "");
  const [count, setCount] = useState<number>(10);
  const [open, setOpen] = useState(false);

  const course = courses.find((c) => c.id === courseId);
  const base = Number(course?.price ?? 0);
  const total = base * count;
  const discount = tierDiscount(count);
  const final = total * (1 - discount);
  const saved = total - final;

  const summary = useMemo(
    () => (course ? `Корп.обучение «${course.title}» на ${count} чел.: ${Math.round(final).toLocaleString("ru-RU")} ₽${discount ? ` (скидка ${Math.round(discount * 100)}%)` : ""}` : ""),
    [course, count, final, discount],
  );

  const tiers = [
    { from: 5, pct: 10 },
    { from: 15, pct: 15 },
    { from: 30, pct: 20 },
  ];

  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft text-primary px-3 py-1 text-xs font-semibold">
          <Calculator className="h-4 w-4" /> Калькулятор
        </div>
        <h1 className="mt-3 text-3xl md:text-4xl font-bold">Корпоративное обучение под ключ</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Подсчитайте стоимость обучения группы сотрудников. Чем больше группа — тем выше скидка.
          Заключаем договор с организацией, акты, закрывающие документы.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-card p-6 shadow-soft">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Курс</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between h-auto min-h-10 py-2 text-left font-normal"
                    >
                      <span className="truncate whitespace-normal line-clamp-2 text-sm">
                        {course ? course.title : "Выберите курс…"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-0" align="start">
                    <Command
                      filter={(value, search) => {
                        const c = courses.find((x) => x.id === value);
                        if (!c) return 0;
                        return c.title.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
                      }}
                    >
                      <CommandInput placeholder="Поиск курса…" />
                      <CommandList className="max-h-72">
                        <CommandEmpty>Ничего не найдено</CommandEmpty>
                        <CommandGroup>
                          {courses.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.id}
                              onSelect={(v) => { setCourseId(v); setOpen(false); }}
                              className="items-start gap-2"
                            >
                              <Check className={cn("mt-1 h-4 w-4 shrink-0", courseId === c.id ? "opacity-100" : "opacity-0")} />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm leading-snug">{c.title}</div>
                                {c.price ? (
                                  <div className="text-xs text-muted-foreground mt-0.5">{Number(c.price).toLocaleString("ru-RU")} ₽ / чел.</div>
                                ) : null}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {course?.price ? (
                  <div className="text-xs text-muted-foreground">Стоимость за участника: {Number(course.price).toLocaleString("ru-RU")} ₽</div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> Сотрудников</Label>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="icon" onClick={() => setCount((n) => Math.max(1, n - 1))}>−</Button>
                  <Input type="number" min={1} max={500} value={count} onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))} className="text-center" />
                  <Button type="button" variant="outline" size="icon" onClick={() => setCount((n) => Math.min(500, n + 1))}>+</Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {tiers.map((t) => {
                  const active = count >= t.from;
                  return (
                    <div key={t.from} className={cn("rounded-lg border px-2 py-2 text-center text-xs", active ? "border-primary bg-primary-soft text-primary font-semibold" : "border-border text-muted-foreground")}>
                      <BadgePercent className="mx-auto h-3.5 w-3.5 mb-1" />
                      от {t.from} чел.<br />−{t.pct}%
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-primary-soft p-4">
              <div className="flex items-baseline justify-between">
                <div className="text-xs text-muted-foreground">Без скидки</div>
                <div className={cn("text-sm", discount > 0 && "line-through text-muted-foreground")}>{total.toLocaleString("ru-RU")} ₽</div>
              </div>
              {discount > 0 && (
                <div className="flex items-baseline justify-between mt-1">
                  <div className="text-xs text-emerald-700 dark:text-emerald-400">Экономия −{Math.round(discount * 100)}%</div>
                  <div className="text-sm text-emerald-700 dark:text-emerald-400">−{Math.round(saved).toLocaleString("ru-RU")} ₽</div>
                </div>
              )}
              <div className="mt-3 border-t border-primary/10 pt-3">
                <div className="text-xs text-muted-foreground">Итого</div>
                <div className="text-3xl font-bold text-primary">{Math.round(final).toLocaleString("ru-RU")} ₽</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card p-6 shadow-soft">
            <h2 className="font-bold">Заявка на расчёт</h2>
            <p className="mt-1 text-sm text-muted-foreground">Менеджер свяжется в течение часа.</p>
            <div className="mt-4">
              <ApplicationForm
                courseId={course?.id}
                courseTitle={course ? `Корп.обучение: ${course.title} (${count} чел.)` : undefined}
                variant="compact"
              />
            </div>
            {summary && (
              <div className="mt-3 text-xs text-muted-foreground">{summary}</div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
