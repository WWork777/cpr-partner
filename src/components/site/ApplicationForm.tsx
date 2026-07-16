import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { notifyApplication } from "@/lib/notify.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(2, "Минимум 2 символа").max(100),
  phone: z.string().trim().min(5, "Введите телефон").max(30),
  city: z.string().trim().max(100).optional(),
  message: z.string().trim().max(2000).optional(),
});

type Props = {
  courseId?: string;
  courseTitle?: string;
  variant?: "section" | "compact";
  onSuccess?: () => void;
};

export function ApplicationForm({ courseId, courseTitle, variant = "section", onSuccess }: Props) {
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", city: "", message: "" });
  const notify = useServerFn(notifyApplication);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      toast.error("Необходимо согласие на обработку персональных данных");
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Проверьте поля");
      return;
    }
    setBusy(true);
    let utm: { utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; referrer: string | null } = {
      utm_source: null, utm_medium: null, utm_campaign: null, referrer: null,
    };
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      utm = {
        utm_source: sp.get("utm_source"),
        utm_medium: sp.get("utm_medium"),
        utm_campaign: sp.get("utm_campaign"),
        referrer: document.referrer || null,
      };
    }
    const { error } = await supabase.from("applications").insert({
      course_id: courseId ?? null,
      course_title: courseTitle ?? null,
      name: parsed.data.name,
      phone: parsed.data.phone,
      city: parsed.data.city || null,
      message: parsed.data.message || null,
      ...utm,
    });
    setBusy(false);
    if (error) {
      toast.error("Не удалось отправить заявку. Попробуйте ещё раз.");
      return;
    }
    // Fire-and-forget notifications; do not block UX
    notify({
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        city: parsed.data.city ?? null,
        message: parsed.data.message ?? null,
        course_title: courseTitle ?? null,
        page_url: typeof window !== "undefined" ? window.location.href : null,
        referrer: utm.referrer,
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
      },
    }).catch(() => {});
    // Yandex.Metrika goal
    try {
      const w = window as unknown as { ym?: (id: number, ev: string, goal: string) => void; __ymCounterId?: number };
      if (w.ym && w.__ymCounterId) w.ym(w.__ymCounterId, "reachGoal", "application_submit");
    } catch { /* noop */ }
    toast.success("Заявка отправлена! Мы свяжемся с вами в ближайшее время.");
    setForm({ name: "", phone: "", city: "", message: "" });
    setConsent(false);
    onSuccess?.();
  }

  const wrapperCls =
    variant === "section"
      ? "rounded-3xl bg-card shadow-card p-6 md:p-10 grid md:grid-cols-2 gap-8"
      : "";

  return (
    <div className={wrapperCls}>
      {variant === "section" && (
        <div>
          <h3 className="text-2xl md:text-3xl font-bold">Заявка на обучение</h3>
          <p className="mt-3 text-muted-foreground">
            Хотите узнать больше о формате или записаться на обучение? Наш менеджер свяжется с вами
            в ближайшее время и ответит на все вопросы.
          </p>
          {courseTitle && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-sm text-primary font-medium">
              Курс: {courseTitle}
            </div>
          )}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ap-name">Имя *</Label>
          <Input
            id="ap-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            maxLength={100}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ap-phone">Номер телефона *</Label>
          <Input
            id="ap-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
            maxLength={30}
            placeholder="+7 ___ ___ __ __"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ap-city">Город</Label>
          <Input
            id="ap-city"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            maxLength={100}
          />
        </div>
        {variant === "section" && (
          <div className="space-y-1.5">
            <Label htmlFor="ap-msg">Комментарий</Label>
            <Textarea
              id="ap-msg"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              maxLength={2000}
              rows={3}
            />
          </div>
        )}
        <div className="flex items-start gap-2.5 pt-1">
          <Checkbox
            id="ap-consent"
            checked={consent}
            onCheckedChange={(v) => setConsent(v === true)}
            className="mt-0.5"
          />
          <Label htmlFor="ap-consent" className="text-xs text-muted-foreground font-normal leading-snug cursor-pointer">
            Я даю согласие на обработку моих персональных данных в соответствии с{" "}
            <Link to="/privacy" target="_blank" className="text-primary hover:underline">
              Политикой конфиденциальности
            </Link>{" "}
            и условиями 152-ФЗ.
          </Label>
        </div>
        <Button
          type="submit"
          disabled={busy || !consent}
          className="w-full rounded-full bg-gradient-teal hover:opacity-90 h-12 text-base font-semibold disabled:opacity-50"
        >
          {busy ? "Отправляем…" : "Оставить заявку"}
        </Button>
      </form>
    </div>
  );
}
