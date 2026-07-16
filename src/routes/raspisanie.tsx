import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { CallbackModal } from "@/components/site/CallbackModal";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/cpr-logo.png";
import { siteImages } from "@/lib/course-images";
import { publicScheduleQuery } from "@/lib/queries";

export const Route = createFileRoute("/raspisanie")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(publicScheduleQuery);
  },
  head: () => ({
    meta: [
      { title: "График обучения — ЦПР Партнер" },
      { name: "description", content: "График очной формы обучения ЦПР Партнер по кварталам: даты старта групп по всем программам." },
      { property: "og:title", content: "График обучения — ЦПР Партнер" },
      { property: "og:description", content: "Даты стартов групп по кварталам." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SchedulePage,
});

const Q_MONTHS: Record<number, [string, string, string]> = {
  1: ["январь", "февраль", "март"],
  2: ["апрель", "май", "июнь"],
  3: ["июль", "август", "сентябрь"],
  4: ["октябрь", "ноябрь", "декабрь"],
};

function SchedulePage() {
  const { data } = useSuspenseQuery(publicScheduleQuery);

  const cities = useMemo(() => Array.from(new Set(data.map((r) => r.city))), [data]);
  const [city, setCity] = useState(cities[0] ?? "Красноярск");

  const cityRows = data.filter((r) => r.city === city);
  const years = Array.from(new Set(cityRows.map((r) => r.year))).sort((a, b) => a - b);
  const [year, setYear] = useState<number>(years[0] ?? new Date().getFullYear());
  const yearRows = cityRows.filter((r) => r.year === year);
  const quarters = Array.from(new Set(yearRows.map((r) => r.quarter))).sort((a, b) => a - b);
  const [quarter, setQuarter] = useState<number>(quarters[0] ?? 1);
  const rows = yearRows.filter((r) => r.quarter === quarter);
  const months = Q_MONTHS[quarter] ?? Q_MONTHS[1];

  return (
    <SiteLayout>
      <section className="bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 mb-3">
                <CalendarDays className="h-3.5 w-3.5" /> Очная форма
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                График обучения
              </h1>
              <p className="mt-3 text-slate-600 max-w-2xl">
                Даты старта групп по кварталам. Заочные и дистанционные группы — ежедневно, уточняйте у менеджера.
              </p>
              <div className="mt-6">
                <CallbackModal
                  trigger={<Button className="rounded-full bg-gradient-teal shadow-soft">Записаться на курс</Button>}
                />
              </div>
            </div>
            <div className="relative hidden overflow-hidden rounded-3xl border border-border/60 bg-white shadow-card lg:block">
              <img src={siteImages.scheduleDesk} alt="" className="h-56 w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-4">
                <img src={logoAsset} alt="ЦПР Партнер" className="h-12 w-auto" width={115} height={56} />
                <div className="rounded-full bg-teal-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-soft">
                  Группы каждый месяц
                </div>
              </div>
            </div>
          </div>

          {cities.length > 1 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {cities.map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border transition ${
                    c === city ? "bg-primary text-white border-primary" : "bg-white text-slate-700 border-border hover:border-primary/50"
                  }`}
                >
                  <MapPin className="h-3.5 w-3.5" /> {c}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-4 items-center">
            {years.length > 1 && (
              <div className="flex gap-1 rounded-full bg-muted p-1">
                {years.map((y) => (
                  <button key={y} onClick={() => setYear(y)} className={`px-3 py-1 rounded-full text-sm font-semibold ${y === year ? "bg-white shadow-sm" : "text-muted-foreground"}`}>
                    {y}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1 rounded-full bg-muted p-1">
              {[1, 2, 3, 4].map((q) => {
                const enabled = quarters.includes(q);
                return (
                  <button
                    key={q}
                    disabled={!enabled}
                    onClick={() => setQuarter(q)}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${
                      q === quarter ? "bg-white shadow-sm text-slate-900" : enabled ? "text-slate-600 hover:text-slate-900" : "text-slate-300 cursor-not-allowed"
                    }`}
                  >
                    {toRoman(q)} квартал {year}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-border/60 bg-white shadow-soft">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="bg-primary text-white text-left">
                  <th className="p-4 font-bold w-1/2">Название программы</th>
                  <th className="p-4 font-bold" colSpan={3}>Сроки обучения</th>
                </tr>
                <tr className="bg-primary/90 text-white text-left text-xs uppercase tracking-wider">
                  <th className="px-4 pb-3"></th>
                  {months.map((m) => (
                    <th key={m} className="px-4 pb-3 font-semibold">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const cells = resolveCells(r, quarter);
                  return (
                    <tr key={r.id} className="border-t border-border/50 align-top">
                      <td className="p-4 font-semibold text-slate-900">{r.topic}</td>
                      <td className="p-4 text-slate-700 whitespace-pre-line">{cells[0] || "—"}</td>
                      <td className="p-4 text-slate-700 whitespace-pre-line">{cells[1] || "—"}</td>
                      <td className="p-4 text-slate-700 whitespace-pre-line">{cells[2] || "—"}</td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr><td colSpan={4} className="p-10 text-center text-muted-foreground">Расписание уточняется. Позвоните нам, чтобы согласовать удобную дату.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            * Даты могут корректироваться. Точный график согласовывается с группой перед стартом обучения.
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}

function toRoman(n: number) {
  return ["", "I", "II", "III", "IV"][n] ?? String(n);
}

// Map month number (1-12) to slot index within a quarter
function monthSlot(month: number, quarter: number): number {
  const base = (quarter - 1) * 3 + 1;
  const slot = month - base;
  return slot >= 0 && slot <= 2 ? slot : -1;
}

// Extract all month numbers referenced in a free-form dates string.
function extractMonths(text: string): number[] {
  const months: number[] = [];
  const nameMap: Record<string, number> = {
    январ: 1, феврал: 2, март: 3, апрел: 4, мая: 5, май: 5, июн: 6,
    июл: 7, август: 8, сентябр: 9, октябр: 10, ноябр: 11, декабр: 12,
  };
  const lower = text.toLowerCase();
  for (const [k, v] of Object.entries(nameMap)) {
    if (lower.includes(k)) months.push(v);
  }
  // Numeric dd.mm(.yyyy) or dd–dd.mm
  const re = /\b\d{1,2}(?:[–-]\d{1,2})?\.(\d{1,2})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const mm = parseInt(m[1], 10);
    if (mm >= 1 && mm <= 12) months.push(mm);
  }
  return Array.from(new Set(months));
}

type ScheduleRow = {
  month1_text: string | null;
  month2_text: string | null;
  month3_text: string | null;
  dates_text: string | null;
  time_text: string | null;
};

function resolveCells(r: ScheduleRow, quarter: number): [string, string, string] {
  const cells: [string, string, string] = [
    r.month1_text ?? "",
    r.month2_text ?? "",
    r.month3_text ?? "",
  ];
  if (cells.some(Boolean)) return cells;
  const dates = r.dates_text?.trim();
  if (!dates) return cells;
  const suffix = r.time_text ? `\n${r.time_text}` : "";
  const months = extractMonths(dates);
  const slots = months.map((m) => monthSlot(m, quarter)).filter((s) => s >= 0);
  if (slots.length === 0) {
    cells[0] = `${dates}${suffix}`;
    return cells;
  }
  for (const s of slots) cells[s] = `${dates}${suffix}`;
  return cells;
}
