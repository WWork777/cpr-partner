import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { db } from "@/integrations/database/client";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  component: AuditPage,
});

function AuditPage() {
  const [filter, setFilter] = useState("");
  const { data } = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: async () => {
      const { data, error } = await db
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = (data ?? []).filter((r) =>
    !filter ||
    r.entity.toLowerCase().includes(filter.toLowerCase()) ||
    (r.user_email ?? "").toLowerCase().includes(filter.toLowerCase()) ||
    r.action.includes(filter.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold">История изменений</h1>
      <Input placeholder="Фильтр: courses, applications, email…" className="mt-4 max-w-md" value={filter} onChange={(e) => setFilter(e.target.value)} />
      <div className="mt-6 rounded-2xl bg-card shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr>
            <th className="text-left p-3">Когда</th>
            <th className="text-left p-3">Сущность</th>
            <th className="text-left p-3">Действие</th>
            <th className="text-left p-3">Пользователь</th>
            <th className="text-left p-3">ID</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border align-top">
                <td className="p-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString("ru-RU")}</td>
                <td className="p-3 font-mono">{r.entity}</td>
                <td className="p-3">
                  <span className={
                    r.action === "insert" ? "rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-xs" :
                    r.action === "delete" ? "rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 px-2 py-0.5 text-xs" :
                    "rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300 px-2 py-0.5 text-xs"
                  }>{r.action}</span>
                </td>
                <td className="p-3 text-xs">{r.user_email ?? "—"}</td>
                <td className="p-3 font-mono text-xs">{r.entity_id?.slice(0, 8)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Пусто</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
