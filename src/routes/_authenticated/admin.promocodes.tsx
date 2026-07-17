import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { db } from "@/integrations/database/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/promocodes")({
  component: PromoAdmin,
});

function PromoAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "promocodes"],
    queryFn: async () => {
      const { data, error } = await db.from("promocodes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [draft, setDraft] = useState({ code: "", discount_percent: 10, discount_amount: "", valid_until: "", max_uses: "" });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      code: draft.code.trim().toUpperCase(),
      discount_percent: draft.discount_percent || null,
      discount_amount: draft.discount_amount ? Number(draft.discount_amount) : null,
      valid_until: draft.valid_until || null,
      max_uses: draft.max_uses ? Number(draft.max_uses) : null,
      is_active: true,
    };
    if (!payload.code) return toast.error("Введите код");
    const { error } = await db.from("promocodes").insert(payload as never);
    if (error) return toast.error(error.message);
    setDraft({ code: "", discount_percent: 10, discount_amount: "", valid_until: "", max_uses: "" });
    qc.invalidateQueries({ queryKey: ["admin", "promocodes"] });
    toast.success("Промокод создан");
  }

  async function toggle(id: string, value: boolean) {
    const { error } = await db.from("promocodes").update({ is_active: value }).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin", "promocodes"] });
  }

  async function remove(id: string) {
    if (!confirm("Удалить промокод?")) return;
    const { error } = await db.from("promocodes").delete().eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin", "promocodes"] });
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold">Промокоды</h1>
      <form onSubmit={add} className="mt-6 grid gap-3 rounded-2xl bg-card p-5 shadow-soft md:grid-cols-5">
        <div><Label>Код</Label><Input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} placeholder="SUMMER10" /></div>
        <div><Label>Скидка, %</Label><Input type="number" value={draft.discount_percent} onChange={(e) => setDraft({ ...draft, discount_percent: Number(e.target.value) })} /></div>
        <div><Label>или сумма, ₽</Label><Input type="number" value={draft.discount_amount} onChange={(e) => setDraft({ ...draft, discount_amount: e.target.value })} /></div>
        <div><Label>Действует до</Label><Input type="date" value={draft.valid_until} onChange={(e) => setDraft({ ...draft, valid_until: e.target.value })} /></div>
        <div><Label>Макс. применений</Label><Input type="number" value={draft.max_uses} onChange={(e) => setDraft({ ...draft, max_uses: e.target.value })} /></div>
        <div className="md:col-span-5">
          <Button type="submit" className="rounded-full bg-gradient-teal"><Plus className="h-4 w-4" /> Добавить</Button>
        </div>
      </form>

      <div className="mt-6 rounded-2xl bg-card shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr>
            <th className="text-left p-3">Код</th><th className="text-left p-3">Скидка</th>
            <th className="text-left p-3">До</th><th className="text-left p-3">Исп.</th>
            <th className="text-left p-3">Активен</th><th></th>
          </tr></thead>
          <tbody>
            {(data ?? []).map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 font-mono font-semibold">{p.code}</td>
                <td className="p-3">{p.discount_percent ? `${p.discount_percent}%` : p.discount_amount ? `${p.discount_amount} ₽` : "—"}</td>
                <td className="p-3">{p.valid_until ? new Date(p.valid_until).toLocaleDateString("ru-RU") : "∞"}</td>
                <td className="p-3">{p.used_count}{p.max_uses ? ` / ${p.max_uses}` : ""}</td>
                <td className="p-3"><input type="checkbox" defaultChecked={p.is_active} onChange={(e) => toggle(p.id, e.target.checked)} className="h-4 w-4 accent-primary" /></td>
                <td className="p-3 text-right"><Button variant="ghost" size="sm" onClick={() => remove(p.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
            {(data ?? []).length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Нет промокодов</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
