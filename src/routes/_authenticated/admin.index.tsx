import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Inbox, GraduationCap, TrendingUp, CheckCircle2 } from "lucide-react";
import { adminApplicationsQuery, adminCoursesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const apps = useQuery(adminApplicationsQuery);
  const courses = useQuery(adminCoursesQuery);

  const stats = useMemo(() => {
    const list = apps.data ?? [];
    const newCount = list.filter((a) => a.status === "new").length;
    const inProgress = list.filter((a) => a.status === "in_progress").length;
    const done = list.filter((a) => a.status === "done").length;
    const rejected = list.filter((a) => a.status === "rejected").length;
    const total = list.length;
    const conversion = total > 0 ? Math.round((done / total) * 100) : 0;

    // last 14 days
    const now = new Date();
    const days: { date: string; label: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        date: key,
        label: d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
        count: 0,
      });
    }
    const dayMap = new Map(days.map((d) => [d.date, d]));
    for (const a of list) {
      const k = a.created_at.slice(0, 10);
      const day = dayMap.get(k);
      if (day) day.count++;
    }
    const maxDay = Math.max(1, ...days.map((d) => d.count));

    // top courses
    const courseMap = new Map<string, number>();
    for (const a of list) {
      const key = a.course_title || a.courses?.title || "Без курса";
      courseMap.set(key, (courseMap.get(key) ?? 0) + 1);
    }
    const top = [...courseMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // utm sources
    const utmMap = new Map<string, number>();
    for (const a of list) {
      const k = a.utm_source || "(прямой)";
      utmMap.set(k, (utmMap.get(k) ?? 0) + 1);
    }
    const utm = [...utmMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { newCount, inProgress, done, rejected, total, conversion, days, maxDay, top, utm };
  }, [apps.data]);

  const publishedCourses = courses.data?.filter((c) => c.published).length ?? 0;

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold">Дашборд</h1>
      <p className="mt-2 text-muted-foreground">Сводка по заявкам и каталогу</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Inbox className="h-5 w-5" />} label="Новые заявки" value={stats.newCount} hint="ожидают обработки" accent />
        <Stat icon={<TrendingUp className="h-5 w-5" />} label="Всего заявок" value={stats.total} />
        <Stat icon={<CheckCircle2 className="h-5 w-5" />} label="Конверсия" value={`${stats.conversion}%`} hint="завершённые от всех" />
        <Stat icon={<GraduationCap className="h-5 w-5" />} label="Курсов опубликовано" value={publishedCourses} hint={`из ${courses.data?.length ?? 0}`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-card p-5 shadow-soft lg:col-span-2">
          <h2 className="font-bold">Заявки за 14 дней</h2>
          <div className="mt-6 flex items-end gap-1.5 h-40">
            {stats.days.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="text-[10px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100">
                  {d.count}
                </div>
                <div
                  className="w-full rounded-t-md bg-gradient-teal min-h-[2px] transition-all"
                  style={{ height: `${(d.count / stats.maxDay) * 100}%` }}
                  title={`${d.label}: ${d.count}`}
                />
                <div className="text-[10px] text-muted-foreground">{d.label.slice(0, 2)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-card p-5 shadow-soft">
          <h2 className="font-bold">Воронка</h2>
          <div className="mt-4 space-y-3 text-sm">
            <FunnelRow label="Новые" value={stats.newCount} total={stats.total} color="bg-primary" />
            <FunnelRow label="В работе" value={stats.inProgress} total={stats.total} color="bg-amber-500" />
            <FunnelRow label="Завершены" value={stats.done} total={stats.total} color="bg-success" />
            <FunnelRow label="Отклонены" value={stats.rejected} total={stats.total} color="bg-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-card p-5 shadow-soft">
          <h2 className="font-bold">Топ-5 курсов по заявкам</h2>
          <div className="mt-4 space-y-2.5">
            {stats.top.length === 0 ? (
              <div className="text-sm text-muted-foreground">Пока нет данных</div>
            ) : (
              stats.top.map(([name, n]) => (
                <div key={name} className="flex items-center justify-between text-sm gap-3">
                  <span className="truncate">{name}</span>
                  <span className="font-bold tabular-nums">{n}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-soft">
          <h2 className="font-bold">Источники трафика (UTM)</h2>
          <div className="mt-4 space-y-2.5">
            {stats.utm.map(([src, n]) => (
              <div key={src} className="flex items-center justify-between text-sm gap-3">
                <span className="truncate">{src}</span>
                <span className="font-bold tabular-nums">{n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Последние заявки</h2>
          <Link to="/admin/applications" className="text-sm text-primary hover:underline">
            Все заявки →
          </Link>
        </div>
        <div className="mt-4 rounded-2xl bg-card shadow-soft divide-y divide-border">
          {(apps.data ?? []).slice(0, 5).map((a) => (
            <div key={a.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium">{a.name} · {a.phone}</div>
                <div className="text-xs text-muted-foreground">
                  {a.course_title || a.courses?.title || "Без курса"} · {new Date(a.created_at).toLocaleString("ru-RU")}
                </div>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
          {(apps.data?.length ?? 0) === 0 && (
            <div className="p-6 text-center text-muted-foreground">Заявок пока нет</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon, label, value, hint, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 shadow-soft ${accent ? "bg-gradient-teal text-primary-foreground" : "bg-card"}`}>
      <div className={`flex items-center gap-2 text-xs uppercase tracking-wider ${accent ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
        {icon} {label}
      </div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      {hint && (
        <div className={`text-xs mt-1 ${accent ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
          {hint}
        </div>
      )}
    </div>
  );
}

function FunnelRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-primary-soft text-primary",
    in_progress: "bg-amber-100 text-amber-700",
    done: "bg-success/15 text-success",
    rejected: "bg-muted text-muted-foreground",
  };
  const label: Record<string, string> = {
    new: "Новая",
    in_progress: "В работе",
    done: "Завершена",
    rejected: "Отклонена",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted"}`}>
      {label[status] ?? status}
    </span>
  );
}
