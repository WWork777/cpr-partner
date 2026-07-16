import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Calculator, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApplicationForm } from "@/components/site/ApplicationForm";
import { categoriesQuery, publishedCoursesQuery } from "@/lib/queries";


const FORMATS = ["Очно", "Дистанционно", "Очно + дистанционно"] as const;

function discountFor(people: number) {
  if (people >= 10) return 0.15;
  if (people >= 5) return 0.1;
  return 0;
}

export function CourseCalculator({ className = "" }: { className?: string }) {
  const { data: categories = [] } = useQuery(categoriesQuery);
  const { data: courses = [] } = useQuery(publishedCoursesQuery);

  const [categorySlug, setCategorySlug] = useState<string>("");
  const [courseId, setCourseId] = useState<string>("");
  const [format, setFormat] = useState<(typeof FORMATS)[number]>("Дистанционно");
  const [people, setPeople] = useState<number>(1);
  const [open, setOpen] = useState(false);


  const filteredCourses = useMemo(
    () => courses.filter((c: any) => !categorySlug || c.categories?.slug === categorySlug),
    [courses, categorySlug],
  );

  const selected = useMemo(
    () => filteredCourses.find((c: any) => c.id === courseId) ?? null,
    [filteredCourses, courseId],
  );

  const price = selected?.price ? Number(selected.price) : 0;
  const discount = discountFor(people);
  const subtotal = price * people;
  const total = Math.round(subtotal * (1 - discount));
  const saved = subtotal - total;

  return (
    <section
      className={`mx-auto max-w-5xl px-4 lg:px-8 ${className}`}
      aria-labelledby="calc-title"
    >
      <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 shadow-card overflow-hidden">
        <div className="grid md:grid-cols-[1.2fr_1fr]">
          {/* Form */}
          <div className="p-5 sm:p-6 md:p-10 min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
              <Calculator className="h-3.5 w-3.5" /> Калькулятор стоимости
            </div>
            <h2 id="calc-title" className="mt-3 text-2xl md:text-3xl font-bold">
              Рассчитайте стоимость обучения за минуту
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Данные курсов и цен берутся из нашей системы и всегда актуальны.
            </p>

            <div className="mt-6 grid gap-4">
              <Field label="Направление">
                <select
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                  value={categorySlug}
                  onChange={(e) => {
                    setCategorySlug(e.target.value);
                    setCourseId("");
                  }}
                >
                  <option value="">Все направления</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Курс">
                <select
                  className="w-full max-w-full truncate rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                >
                  <option value="">— выберите курс —</option>
                  {filteredCourses.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                      {c.price ? ` — ${Number(c.price).toLocaleString("ru-RU")} ₽` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Формат">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {FORMATS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f)}
                      className={`rounded-xl border px-2 py-2 text-xs font-medium leading-tight transition-colors ${
                        format === f
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background hover:border-primary/50"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label={`Количество сотрудников: ${people}`}>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={people}
                    onChange={(e) => setPeople(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  От 5 человек — скидка 10%, от 10 — 15%
                </div>
              </Field>
            </div>
          </div>

          {/* Result */}
          <div className="bg-foreground text-background p-5 sm:p-6 md:p-10 flex flex-col min-w-0">
            <div className="text-xs uppercase tracking-wider opacity-70">Итого к оплате</div>
            <div className="mt-2 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight break-words">
              {selected ? `${total.toLocaleString("ru-RU")} ₽` : "—"}
            </div>
            {selected && (
              <div className="mt-1 text-sm opacity-80">
                {price.toLocaleString("ru-RU")} ₽ × {people}
                {discount > 0 && (
                  <>
                    {" "}— скидка {Math.round(discount * 100)}% (
                    −{saved.toLocaleString("ru-RU")} ₽)
                  </>
                )}
              </div>
            )}

            <div className="mt-6 space-y-2 text-sm opacity-90">
              <Row k="Курс" v={selected?.title ?? "не выбран"} />
              <Row k="Формат" v={format} />
              <Row k="Документ" v={selected?.document_type || "Удостоверение"} />
              <Row k="Срок" v={selected?.duration || "по программе"} />
            </div>

            <div className="mt-auto pt-6 flex flex-col gap-2">
              <Button
                disabled={!selected}
                onClick={() => setOpen(true)}
                className="rounded-full bg-gradient-teal hover:opacity-90"
              >
                Оставить заявку <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Link
                to="/corp-calc"
                className="text-center text-xs underline opacity-80 hover:opacity-100"
              >
                Нужно обучить весь штат? Корпоративный расчёт →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Заявка на обучение</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="rounded-xl bg-muted/50 p-3 text-sm">
              <div className="font-semibold line-clamp-2">{selected.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {format} · {people} чел. · итого {total.toLocaleString("ru-RU")} ₽
              </div>
            </div>
          )}
          <ApplicationForm
            variant="compact"
            courseId={selected?.id}
            courseTitle={selected?.title}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </section>

  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-semibold text-foreground/80">{label}</div>
      {children}
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-background/10 pb-1.5">
      <span className="opacity-70">{k}</span>
      <span className="font-medium text-right line-clamp-2">{v}</span>
    </div>
  );
}
