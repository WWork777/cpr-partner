import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Download, RefreshCw, Save, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminApplicationsQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { StatusBadge } from "./admin.index";

const STATUS = ["new", "in_progress", "done", "rejected"] as const;

export const Route = createFileRoute("/_authenticated/admin/applications")({
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const qc = useQueryClient();
  const { data, error, isLoading, refetch, isFetching } = useQuery(adminApplicationsQuery);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function update(id: string, status: string) {
    const { error } = await supabase
      .from("applications")
      .update({ status: status as (typeof STATUS)[number] })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Статус обновлён");
      qc.invalidateQueries({ queryKey: ["admin", "applications"] });
    }
  }

  async function remove(id: string) {
    if (!confirm("Удалить заявку?")) return;
    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Удалено");
      qc.invalidateQueries({ queryKey: ["admin", "applications"] });
    }
  }

  async function saveNotes(id: string) {
    const { error } = await supabase
      .from("applications")
      .update({ admin_notes: notes[id]?.trim() || null })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Заметка сохранена");
      qc.invalidateQueries({ queryKey: ["admin", "applications"] });
    }
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data ?? []).filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!s) return true;
      return (
        a.name?.toLowerCase().includes(s) ||
        a.phone?.toLowerCase().includes(s) ||
        a.city?.toLowerCase().includes(s) ||
        (a.course_title || a.courses?.title || "").toLowerCase().includes(s)
      );
    });
  }, [data, q, statusFilter]);

  function exportCSV() {
    const rows = filtered;
    if (rows.length === 0) {
      toast.error("Нет заявок для экспорта");
      return;
    }
    const headers = [
      "Дата",
      "Имя",
      "Телефон",
      "Город",
      "Курс",
      "Статус",
      "Сообщение",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "referrer",
    ];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      headers.join(";"),
      ...rows.map((a) =>
        [
          new Date(a.created_at).toLocaleString("ru-RU"),
          a.name,
          a.phone,
          a.city ?? "",
          a.course_title || a.courses?.title || "",
          a.status,
          a.message ?? "",
          a.utm_source ?? "",
          a.utm_medium ?? "",
          a.utm_campaign ?? "",
          a.referrer ?? "",
        ]
          .map(esc)
          .join(";"),
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `applications-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Заявки</h1>
          <p className="mt-2 text-muted-foreground">
            Всего: {data?.length ?? 0} · Новых:{" "}
            {data?.filter((a) => a.status === "new").length ?? 0} · Показано: {filtered.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Обновить заявки"
            aria-label="Обновить заявки"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={exportCSV} variant="outline" className="rounded-full">
            <Download className="h-4 w-4" /> Экспорт в CSV
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по имени, телефону, курсу…"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="new">Новые</SelectItem>
            <SelectItem value="in_progress">В работе</SelectItem>
            <SelectItem value="done">Завершены</SelectItem>
            <SelectItem value="rejected">Отклонены</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 rounded-2xl bg-card shadow-soft overflow-hidden">
        {error && (
          <div className="p-5 border-b border-border text-sm text-destructive">
            Не удалось загрузить заявки: {error.message}
          </div>
        )}
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Загрузка…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Заявок не найдено</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((a) => (
              <div
                key={a.id}
                className="p-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] md:items-center"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-semibold">{a.name}</div>
                    <StatusBadge status={a.status} />
                    {a.utm_source && (
                      <span className="text-[10px] uppercase tracking-wider bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                        {a.utm_source}
                        {a.utm_campaign ? `/${a.utm_campaign}` : ""}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    <a href={`tel:${a.phone}`} className="hover:text-primary">
                      {a.phone}
                    </a>
                    {a.city && <> · {a.city}</>}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {a.course_title || a.courses?.title || "Без курса"} ·{" "}
                    {new Date(a.created_at).toLocaleString("ru-RU")}
                  </div>
                  {a.message && <div className="mt-2 text-sm">{a.message}</div>}
                  {expanded.has(a.id) && (
                    <div className="mt-4 rounded-xl bg-muted/40 p-3">
                      <label
                        className="text-xs font-semibold text-muted-foreground"
                        htmlFor={`notes-${a.id}`}
                      >
                        Внутренняя заметка
                      </label>
                      <Textarea
                        id={`notes-${a.id}`}
                        value={notes[a.id] ?? a.admin_notes ?? ""}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [a.id]: e.target.value }))}
                        placeholder="Например: перезвонить после 18:00, отправить договор…"
                        rows={2}
                        className="mt-2 bg-background"
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="mt-2"
                        onClick={() => saveNotes(a.id)}
                      >
                        <Save className="h-4 w-4" /> Сохранить заметку
                      </Button>
                    </div>
                  )}
                </div>
                <Select value={a.status} onValueChange={(v) => update(a.id, v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Новая</SelectItem>
                    <SelectItem value="in_progress">В работе</SelectItem>
                    <SelectItem value="done">Завершена</SelectItem>
                    <SelectItem value="rejected">Отклонена</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setExpanded((prev) => {
                      const next = new Set(prev);
                      if (next.has(a.id)) next.delete(a.id);
                      else next.add(a.id);
                      return next;
                    })
                  }
                  title={expanded.has(a.id) ? "Скрыть детали" : "Открыть детали"}
                >
                  {expanded.has(a.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Детали</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(a.id)}
                  className="text-destructive"
                >
                  Удалить
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
