import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Upload } from "lucide-react";
import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { db } from "@/integrations/database/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminCoursesQuery } from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/schedules")({
  component: SchedulesAdmin,
});

function SchedulesAdmin() {
  const qc = useQueryClient();
  const { data: courses } = useQuery(adminCoursesQuery);
  const { data } = useQuery({
    queryKey: ["admin", "schedules"],
    queryFn: async () => {
      const { data, error } = await db
        .from("course_schedules")
        .select("*, courses(title)")
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [draft, setDraft] = useState({
    course_id: "",
    start_date: "",
    end_date: "",
    format: "Очно",
    city: "Красноярск",
    seats_total: "",
    seats_left: "",
    price: "",
  });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.course_id || !draft.start_date) return toast.error("Курс и дата старта обязательны");
    const { error } = await db.from("course_schedules").insert({
      course_id: draft.course_id,
      start_date: draft.start_date,
      end_date: draft.end_date || null,
      format: draft.format || null,
      city: draft.city || null,
      seats_total: draft.seats_total ? Number(draft.seats_total) : null,
      seats_left: draft.seats_left ? Number(draft.seats_left) : null,
      price: draft.price ? Number(draft.price) : null,
      is_active: true,
    });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "schedules"] });
    toast.success("Поток добавлен");
  }

  async function remove(id: string) {
    if (!confirm("Удалить поток?")) return;
    const { error } = await db.from("course_schedules").delete().eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin", "schedules"] });
  }

  const fileRef = useRef<HTMLInputElement>(null);

  async function importExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
      if (!rows.length) return toast.error("Файл пустой");
      const courseMap = new Map((courses ?? []).map((c) => [c.title.toLowerCase().trim(), c.id]));
      const toDate = (v: unknown): string | null => {
        if (!v) return null;
        if (v instanceof Date) return v.toISOString().slice(0, 10);
        const d = new Date(String(v));
        return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
      };
      const payload = rows
        .map((r) => {
          const pick = (...keys: string[]) => {
            for (const k of keys) for (const rk of Object.keys(r)) if (rk.toLowerCase().trim() === k) return r[rk];
            return null;
          };
          const courseTitle = String(pick("курс", "course", "название") ?? "").toLowerCase().trim();
          const course_id = courseMap.get(courseTitle);
          if (!course_id) return null;
          return {
            course_id,
            start_date: toDate(pick("старт", "дата", "start", "start_date")),
            end_date: toDate(pick("конец", "end", "end_date")),
            format: (pick("формат", "format") as string) ?? null,
            city: (pick("город", "city") as string) ?? null,
            seats_total: Number(pick("мест", "seats_total")) || null,
            seats_left: Number(pick("осталось", "seats_left")) || null,
            price: Number(pick("цена", "price")) || null,
            is_active: true,
          };
        })
        .filter((x): x is NonNullable<typeof x> & { start_date: string } => !!x && !!x.start_date);
      if (!payload.length) return toast.error("Не распознано ни одной строки. Колонки: Курс, Старт, Конец, Формат, Город, Мест, Осталось, Цена");
      const { error } = await db.from("course_schedules").insert(payload);
      if (error) return toast.error(error.message);
      qc.invalidateQueries({ queryKey: ["admin", "schedules"] });
      toast.success(`Импортировано: ${payload.length}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl md:text-3xl font-bold">Расписание потоков</h1>
        <div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} className="hidden" />
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="rounded-full">
            <Upload className="h-4 w-4 mr-1" /> Импорт из Excel
          </Button>
        </div>
      </div>
      <form onSubmit={add} className="mt-6 grid gap-3 rounded-2xl bg-card p-5 shadow-soft md:grid-cols-4">
        <div className="md:col-span-2">
          <Label>Курс</Label>
          <select value={draft.course_id} onChange={(e) => setDraft({ ...draft, course_id: e.target.value })} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">— выбрать —</option>
            {(courses ?? []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div><Label>Старт</Label><Input type="date" value={draft.start_date} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} /></div>
        <div><Label>Конец</Label><Input type="date" value={draft.end_date} onChange={(e) => setDraft({ ...draft, end_date: e.target.value })} /></div>
        <div><Label>Формат</Label><Input value={draft.format} onChange={(e) => setDraft({ ...draft, format: e.target.value })} /></div>
        <div><Label>Город</Label><Input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></div>
        <div><Label>Мест всего</Label><Input type="number" value={draft.seats_total} onChange={(e) => setDraft({ ...draft, seats_total: e.target.value })} /></div>
        <div><Label>Осталось</Label><Input type="number" value={draft.seats_left} onChange={(e) => setDraft({ ...draft, seats_left: e.target.value })} /></div>
        <div><Label>Цена</Label><Input type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></div>
        <div className="md:col-span-4"><Button type="submit" className="rounded-full bg-gradient-teal"><Plus className="h-4 w-4" /> Добавить поток</Button></div>
      </form>

      <div className="mt-6 rounded-2xl bg-card shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr>
            <th className="text-left p-3">Курс</th><th className="text-left p-3">Дата</th>
            <th className="text-left p-3">Формат</th><th className="text-left p-3">Город</th>
            <th className="text-left p-3">Места</th><th className="text-left p-3">Цена</th><th></th>
          </tr></thead>
          <tbody>
            {(data ?? []).map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="p-3">{(s as { courses?: { title?: string } }).courses?.title ?? "—"}</td>
                <td className="p-3">{new Date(s.start_date).toLocaleDateString("ru-RU")}{s.end_date ? ` — ${new Date(s.end_date).toLocaleDateString("ru-RU")}` : ""}</td>
                <td className="p-3">{s.format ?? "—"}</td>
                <td className="p-3">{s.city ?? "—"}</td>
                <td className="p-3">{s.seats_left ?? "—"}{s.seats_total ? ` / ${s.seats_total}` : ""}</td>
                <td className="p-3">{s.price != null ? `${s.price} ₽` : "—"}</td>
                <td className="p-3 text-right"><Button variant="ghost" size="sm" onClick={() => remove(s.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
            {(data ?? []).length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Потоков пока нет</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
