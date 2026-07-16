import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lookupApplicationsByPhone } from "@/lib/lk.functions";
import { Inbox, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/lk")({
  head: () => ({
    meta: [
      { title: "Личный кабинет — статус заявки | ЦПР Партнер" },
      { name: "description", content: "Проверьте статус вашей заявки на обучение по номеру телефона." },
    ],
  }),
  component: LkPage,
});

const STATUS_LABEL: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  new: { label: "Новая", icon: <Inbox className="h-4 w-4" />, cls: "bg-primary-soft text-primary" },
  in_progress: { label: "В работе", icon: <Clock className="h-4 w-4" />, cls: "bg-amber-100 text-amber-700" },
  closed: { label: "Закрыта", icon: <CheckCircle2 className="h-4 w-4" />, cls: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Отменена", icon: <AlertCircle className="h-4 w-4" />, cls: "bg-rose-100 text-rose-700" },
};

function LkPage() {
  const lookup = useServerFn(lookupApplicationsByPhone);
  const [phone, setPhone] = useState("");
  const m = useMutation({ mutationFn: (p: string) => lookup({ data: { phone: p } }) });

  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-10 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold">Личный кабинет</h1>
        <p className="mt-3 text-muted-foreground">
          Введите номер телефона, который вы указали в заявке — покажем её статус.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (phone.trim()) m.mutate(phone.trim());
          }}
          className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-end rounded-2xl bg-card p-5 shadow-soft"
        >
          <div className="flex-1">
            <Label htmlFor="lk-phone" className="mb-1.5 block">Телефон</Label>
            <Input
              id="lk-phone"
              type="tel"
              inputMode="tel"
              placeholder="+7 (___) ___-__-__"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={m.isPending} className="rounded-full bg-gradient-teal">
            {m.isPending ? "Ищем…" : "Показать заявки"}
          </Button>
        </form>

        {m.data && (
          <div className="mt-8">
            {m.data.applications.length === 0 ? (
              <div className="rounded-2xl bg-card p-8 text-center text-muted-foreground shadow-soft">
                Заявок по этому номеру не найдено. Проверьте формат или оставьте новую заявку.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">Найдено заявок: {m.data.applications.length}</div>
                {m.data.applications.map((a) => {
                  const st = STATUS_LABEL[a.status as string] ?? STATUS_LABEL.new;
                  return (
                    <div key={a.id as string} className="rounded-2xl bg-card p-5 shadow-soft flex flex-wrap items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold">{(a.course_title as string) ?? "Без курса"}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {new Date(a.created_at as string).toLocaleString("ru-RU")} · {a.name as string}
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>
                        {st.icon}
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="mt-10 rounded-2xl bg-primary-soft p-5 text-sm">
          Нужна проверка удостоверения? Откройте{" "}
          <a href="/verify" className="font-semibold text-primary underline">страницу проверки документа</a>.
        </div>
      </section>
    </SiteLayout>
  );
}
