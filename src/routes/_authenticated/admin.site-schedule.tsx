import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useMemo } from "react";
import { Plus, Trash2, Save, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
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
  month1_text: string | null;
  month2_text: string | null;
  month3_text: string | null;
  sort_order: number;
  is_published: boolean;
};

const Q_MONTHS: Record<number, [string, string, string]> = {
  1: ["январь", "февраль", "март"],
  2: ["апрель", "май", "июнь"],
  3: ["июль", "август", "сентябрь"],
  4: ["октябрь", "ноябрь", "декабрь"],
};

function SiteScheduleAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery(adminScheduleQuery);
  const [draft, setDraft] = useState<Partial<Row> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [filterCity, setFilterCity] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<number | "all">("all");
  const [filterQuarter, setFilterQuarter] = useState<number | "all">("all");

  const cities = useMemo(() => Array.from(new Set((data ?? []).map((r) => r.city))), [data]);
  const years = useMemo(() => Array.from(new Set((data ?? []).map((r) => r.year))).sort(), [data]);

  const shown = (data ?? []).filter((r) =>
    (filterCity === "all" || r.city === filterCity) &&
    (filterYear === "all" || r.year === filterYear) &&
    (filterQuarter === "all" || r.quarter === filterQuarter),
  );

  async function save(row: Partial<Row>) {
    if (!row.topic?.trim()) return toast.error("Название программы обязательно");
    const payload = {
      city: row.city?.trim() || "Красноярск",
      year: Number(row.year ?? new Date().getFullYear()),
      quarter: Number(row.quarter ?? 1),
      topic: row.topic.trim(),
      month1_text: row.month1_text || null,
      month2_text: row.month2_text || null,
      month3_text: row.month3_text || null,
      sort_order: row.sort_order ?? 0,
      is_published: row.is_published ?? true,
    };
    const { error } = row.id
      ? await supabase.from("public_schedule").update(payload).eq("id", row.id)
      : await supabase.from("public_schedule").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Сохранено");
    setDraft(null);
    qc.invalidateQueries({ queryKey: ["admin", "public_schedule"] });
    qc.invalidateQueries({ queryKey: ["public_schedule"] });
  }

  async function remove(id: string) {
    if (!confirm("Удалить строку расписания?")) return;
    const { error } = await supabase.from("public_schedule").delete().eq("id", id);
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
          currentCity = filled[0];
          continue;
        }
        // Skip header row
        if (joined.startsWith("название") || joined.includes("сроки обучения")) continue;
        if (Object.values(Q_MONTHS).flat().some((m) => joined.startsWith(m))) continue;
        const topic = cells[0];
        if (!topic) continue;
        payload.push({
          city: currentCity,
          year: currentYearVal,
          quarter: currentQuarter,
          topic,
          month1_text: cells[1] || null,
          month2_text: cells[2] || null,
          month3_text: cells[3] || null,
          sort_order: (sort += 10),
          is_published: true,
        });
      }
      if (!payload.length) return toast.error("Не распознано ни одной строки");
      const { error } = await supabase.from("public_schedule").insert(payload);
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

  const dMonths = Q_MONTHS[Number(draft?.quarter ?? 1)] ?? Q_MONTHS[1];

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">График обучения</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Матрица «программа × месяцы квартала» — отображается на странице <code>/raspisanie</code>.
          </p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={importXlsx} className="hidden" />
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="rounded-full">
            <Upload className="h-4 w-4 mr-1" /> Импорт Excel
          </Button>
          <Button
            onClick={() => setDraft({ city: cities[0] ?? "Красноярск", year: new Date().getFullYear(), quarter: 1, topic: "", sort_order: (data?.length ?? 0) * 10 + 10, is_published: true })}
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
          <div className="md:col-span-2"><Label>{cap(dMonths[0])}</Label><Input value={draft.month1_text ?? ""} onChange={(e) => setDraft({ ...draft, month1_text: e.target.value })} placeholder="19 января" /></div>
          <div className="md:col-span-2"><Label>{cap(dMonths[1])}</Label><Input value={draft.month2_text ?? ""} onChange={(e) => setDraft({ ...draft, month2_text: e.target.value })} placeholder="16 февраля" /></div>
          <div className="md:col-span-2"><Label>{cap(dMonths[2])}</Label><Input value={draft.month3_text ?? ""} onChange={(e) => setDraft({ ...draft, month3_text: e.target.value })} placeholder="16 марта" /></div>
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
              <th className="text-left p-3">М1</th>
              <th className="text-left p-3">М2</th>
              <th className="text-left p-3">М3</th>
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
                <td className="p-3">{r.month1_text ?? "—"}</td>
                <td className="p-3">{r.month2_text ?? "—"}</td>
                <td className="p-3">{r.month3_text ?? "—"}</td>
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
              <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">Строк пока нет</td></tr>
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
function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
