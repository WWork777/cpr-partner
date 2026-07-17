import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useMemo } from "react";
import { Plus, Trash2, Save, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { db } from "@/integrations/database/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminScheduleQuery } from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/site-schedule")({
  component: SiteScheduleAdmin,
});

type Row = {
  id?: string;
  city: string;
  year: number;
  quarter: number;
  topic: string;
  sets: string[];
  dates_text?: string | null;
  time_text?: string | null;
  month1_text: string | null;
  month2_text: string | null;
  month3_text: string | null;
  sort_order: number;
  is_published: boolean;
};

type SortMode = "order" | "alpha" | "date" | "published";

const MIN_SET_COUNT = 3;

function SiteScheduleAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery(adminScheduleQuery);
  const [draft, setDraft] = useState<Partial<Row> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<number | "all">("all");
  const [filterQuarter, setFilterQuarter] = useState<number | "all">("all");
  const [sortMode, setSortMode] = useState<SortMode>("order");

  const cities = useMemo(() => Array.from(new Set((data ?? []).map((r) => r.city))), [data]);
  const years = useMemo(() => Array.from(new Set((data ?? []).map((r) => r.year))).sort(), [data]);

  const filtered = useMemo(() => (data ?? []).filter((r) =>
    (filterCity === "all" || r.city === filterCity) &&
    (filterYear === "all" || r.year === filterYear) &&
    (filterQuarter === "all" || r.quarter === filterQuarter),
  ), [data, filterCity, filterYear, filterQuarter]);

  const shown = useMemo(() => [...filtered].sort((a, b) => {
    if (sortMode === "alpha") {
      const byTopic = a.topic.localeCompare(b.topic, "ru", { sensitivity: "base" });
      if (byTopic !== 0) return byTopic;
    }
    if (sortMode === "date") {
      const aDate = getLaunchDate(a);
      const bDate = getLaunchDate(b);
      if (aDate === null && bDate !== null) return 1;
      if (aDate !== null && bDate === null) return -1;
      if (aDate !== null && bDate !== null && aDate !== bDate) return aDate - bDate;
    }
    if (sortMode === "published" && a.is_published !== b.is_published) {
      return a.is_published ? -1 : 1;
    }
    return a.sort_order - b.sort_order || a.topic.localeCompare(b.topic, "ru", { sensitivity: "base" });
  }), [filtered, sortMode]);

  async function save(row: Partial<Row>) {
    if (!row.topic?.trim()) return toast.error("Название программы обязательно");
    const payload = {
      city: row.city?.trim() || "Красноярск",
      year: Number(row.year ?? new Date().getFullYear()),
      quarter: Number(row.quarter ?? 1),
      topic: row.topic.trim(),
      sets: getSets(row).map((value) => value.trim()),
      month1_text: row.month1_text || null,
      month2_text: row.month2_text || null,
      month3_text: row.month3_text || null,
      sort_order: row.sort_order ?? 0,
      is_published: row.is_published ?? true,
    };
    const { error } = row.id
      ? await db.from("public_schedule").update(payload).eq("id", row.id)
      : await db.from("public_schedule").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Сохранено");
    setDraft(null);
    qc.invalidateQueries({ queryKey: ["admin", "public_schedule"] });
    qc.invalidateQueries({ queryKey: ["public_schedule"] });
  }

  async function remove(id: string) {
    if (!confirm("Удалить строку расписания?")) return;
    const { error } = await db.from("public_schedule").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "public_schedule"] });
    qc.invalidateQueries({ queryKey: ["public_schedule"] });
  }

  async function importXlsx(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const arr = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as unknown[][];
      const currentYear = new Date().getFullYear();
      let currentCity = "Красноярск";
      let currentQuarter = 1;
      let currentYearVal = currentYear;
      const payload: Omit<Row, "id">[] = [];
      let sort = 10;
      for (const row of arr) {
        const cells = row.map((c) => (c == null ? "" : String(c).trim()));
        const filled = cells.filter((c) => c !== "");
        if (filled.length === 0) continue;
        const joined = filled.join(" ").toLowerCase();
        // Detect city header (single cell)
        if (filled.length === 1) {
          // Try quarter header: "I квартал 2026 года" / "III квартал 2026"
          const qm = joined.match(/\b(i{1,3}v?|iv)\b.*кварта.*?(\d{4})?/i);
          if (qm) {
            currentQuarter = romanToInt(qm[1]) || currentQuarter;
            if (qm[2]) currentYearVal = Number(qm[2]);
            continue;
          }
          if (/^набор\s+\d+/i.test(joined)) continue;
          currentCity = filled[0];
          continue;
        }
        // Skip header row
        if (joined.startsWith("название") || joined.includes("сроки обучения") || joined.includes("набор 1")) continue;
        const topic = cells[0];
        if (!topic) continue;
        const sets = cells.slice(1);
        while (sets.length < MIN_SET_COUNT) sets.push("");
        payload.push({
          city: currentCity,
          year: currentYearVal,
          quarter: currentQuarter,
          topic,
          sets,
          month1_text: null,
          month2_text: null,
          month3_text: null,
          sort_order: (sort += 10),
          is_published: true,
        });
      }
      if (!payload.length) return toast.error("Не распознано ни одной строки");
      const { error } = await db.from("public_schedule").insert(payload);
      if (error) return toast.error(error.message);
      toast.success(`Импортировано: ${payload.length}`);
      qc.invalidateQueries({ queryKey: ["admin", "public_schedule"] });
      qc.invalidateQueries({ queryKey: ["public_schedule"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const draftSets = getSets(draft);
  const maxSets = Math.max(MIN_SET_COUNT, ...shown.map((row) => getSets(row).length));

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">График обучения</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Матрица «программа × наборы» — отображается на странице <code>/raspisanie</code>.
          </p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={importXlsx} className="hidden" />
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="rounded-full">
            <Upload className="h-4 w-4 mr-1" /> Импорт Excel
          </Button>
          <Button
            onClick={() => setDraft({ city: cities[0] ?? "Красноярск", year: new Date().getFullYear(), quarter: 1, topic: "", sets: Array(MIN_SET_COUNT).fill(""), sort_order: (data?.length ?? 0) * 10 + 10, is_published: true })}
            className="rounded-full bg-gradient-teal"
          >
            <Plus className="h-4 w-4" /> Добавить программу
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 items-center">
        <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
          <option value="all">Все города</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={String(filterYear)} onChange={(e) => setFilterYear(e.target.value === "all" ? "all" : Number(e.target.value))} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
          <option value="all">Все годы</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={String(filterQuarter)} onChange={(e) => setFilterQuarter(e.target.value === "all" ? "all" : Number(e.target.value))} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
          <option value="all">Все кварталы</option>
          {[1, 2, 3, 4].map((q) => <option key={q} value={q}>{["I","II","III","IV"][q-1]} квартал</option>)}
        </select>
        <select aria-label="Сортировка расписания" value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
          <option value="order">Сортировка: по порядку</option>
          <option value="alpha">Сортировка: по алфавиту</option>
          <option value="date">Сортировка: по дате запуска</option>
          <option value="published">Сортировка: опубликованные сначала</option>
        </select>
      </div>

      {draft && (
        <div className="mt-6 rounded-2xl bg-card p-5 shadow-card border border-primary/30 grid gap-3 md:grid-cols-6">
          <div className="md:col-span-2"><Label>Город</Label><Input value={draft.city ?? ""} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></div>
          <div><Label>Год</Label><Input type="number" value={draft.year ?? new Date().getFullYear()} onChange={(e) => setDraft({ ...draft, year: Number(e.target.value) })} /></div>
          <div>
            <Label>Квартал</Label>
            <select value={draft.quarter ?? 1} onChange={(e) => setDraft({ ...draft, quarter: Number(e.target.value) })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {[1,2,3,4].map((q) => <option key={q} value={q}>{["I","II","III","IV"][q-1]} квартал</option>)}
            </select>
          </div>
          <div className="md:col-span-2"><Label>Порядок</Label><Input type="number" value={draft.sort_order ?? 0} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} /></div>
          <div className="md:col-span-6"><Label>Название программы *</Label><Input value={draft.topic ?? ""} onChange={(e) => setDraft({ ...draft, topic: e.target.value })} /></div>
          <div className="md:col-span-6 grid gap-3 md:grid-cols-6">
            {draftSets.map((value, index) => (
              <div key={index} className="md:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Набор {index + 1}</Label>
                  {index >= MIN_SET_COUNT && (
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, sets: draftSets.filter((_, setIndex) => setIndex !== index) })}
                      className="text-xs text-destructive hover:underline"
                    >
                      Удалить
                    </button>
                  )}
                </div>
                <Input
                  value={value}
                  onChange={(e) => setDraft({ ...draft, sets: draftSets.map((setValue, setIndex) => setIndex === index ? e.target.value : setValue) })}
                  placeholder="Дата или условия набора"
                />
              </div>
            ))}
            <div className="md:col-span-6">
              <Button type="button" variant="outline" onClick={() => setDraft({ ...draft, sets: [...draftSets, ""] })} className="rounded-full">
                <Plus className="h-4 w-4" /> Добавить набор
              </Button>
            </div>
          </div>
          <div className="md:col-span-6 flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.is_published ?? true} onChange={(e) => setDraft({ ...draft, is_published: e.target.checked })} className="h-4 w-4 accent-primary" />
              Опубликовано
            </label>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setDraft(null)} className="rounded-full">Отмена</Button>
              <Button onClick={() => save(draft)} className="rounded-full bg-gradient-teal"><Save className="h-4 w-4" /> Сохранить</Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl bg-card shadow-soft overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left p-3">Город</th>
              <th className="text-left p-3">Год</th>
              <th className="text-left p-3">Кв.</th>
              <th className="text-left p-3">Программа</th>
              {Array.from({ length: maxSets }, (_, index) => <th key={index} className="text-left p-3">Набор {index + 1}</th>)}
              <th className="text-left p-3">Публ.</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3">{r.city}</td>
                <td className="p-3">{r.year}</td>
                <td className="p-3">{["I","II","III","IV"][r.quarter-1]}</td>
                <td className="p-3 font-medium">{r.topic}</td>
                {Array.from({ length: maxSets }, (_, index) => <td key={index} className="p-3">{getSets(r)[index] || "—"}</td>)}
                <td className="p-3">{r.is_published ? "✓" : "—"}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  <Button size="sm" variant="outline" onClick={() => setDraft(r)}>Изменить</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={maxSets + 6} className="p-6 text-center text-muted-foreground">Строк пока нет</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function romanToInt(s: string): number {
  const m: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4 };
  return m[s.toLowerCase()] ?? 0;
}

function getSets(row: Partial<Row> | null | undefined): string[] {
  if (Array.isArray(row?.sets) && row.sets.length > 0) return row.sets;
  const legacy = [row?.month1_text ?? "", row?.month2_text ?? "", row?.month3_text ?? ""];
  return legacy.some(Boolean) ? legacy : Array(MIN_SET_COUNT).fill("");
}

const RU_MONTHS: Record<string, number> = {
  январ: 1,
  феврал: 2,
  март: 3,
  апрел: 4,
  май: 5,
  мая: 5,
  июн: 6,
  июл: 7,
  август: 8,
  сентябр: 9,
  октябр: 10,
  ноябр: 11,
  декабр: 12,
};

function getLaunchDate(row: Partial<Row>): number | null {
  const text = getSets(row).find((value) => value.trim())?.toLowerCase() ?? "";
  if (!text) return null;

  const numeric = text.match(/(?:^|[^\d])(\d{1,2})(?:[–-]\d{1,2})?[./](\d{1,2})(?:[./](\d{2,4}))?/);
  if (numeric) {
    const numericYear = numeric[3] ? Number(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3]) : Number(row.year ?? new Date().getFullYear());
    return Date.UTC(numericYear, Number(numeric[2]) - 1, Number(numeric[1]));
  }

  for (const [prefix, month] of Object.entries(RU_MONTHS)) {
    if (text.includes(prefix)) {
      const day = text.match(new RegExp(`(?:^|\\D)(\\d{1,2})(?:[–-]\\d{1,2})?\\s+${prefix}`))?.[1];
      return Date.UTC(Number(row.year ?? new Date().getFullYear()), month - 1, Number(day ?? 1));
    }
  }

  return null;
}
