import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { db } from "@/integrations/database/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

const KEY = "notifications";

type NotifySettings = {
  enabled: boolean;
  recipient: string;
};

function SettingsPage() {
  const [settings, setSettings] = useState<NotifySettings>({ enabled: false, recipient: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await db.from("app_settings").select("value").eq("key", KEY).maybeSingle();
      if (data?.value) {
        const v = data.value as Partial<NotifySettings>;
        setSettings({ enabled: !!v.enabled, recipient: v.recipient ?? "" });
      }
      setLoading(false);
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await db
      .from("app_settings")
      .upsert({ key: KEY, value: settings, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) return toast.error(error.message);
    toast.success("Настройки сохранены");
  }

  if (loading) return <div className="text-muted-foreground">Загрузка…</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold">Настройки</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Уведомления о новых заявках отправляются в Telegram через proxy и на email через Nodemailer/SMTP.
        SMTP, Telegram bot token и chat ID задаются в <code>.env</code>.
      </p>

      <form onSubmit={save} className="mt-8 space-y-5 rounded-2xl bg-card p-6 shadow-soft">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
            className="h-4 w-4 accent-primary"
          />
          Включить уведомления о новых заявках
        </label>

        <div>
          <Label className="mb-1.5 block">Email получателя</Label>
          <Input
            type="email"
            value={settings.recipient}
            onChange={(e) => setSettings((s) => ({ ...s, recipient: e.target.value }))}
            placeholder="admin@example.com"
          />
        </div>

        <Button type="submit" className="rounded-full bg-gradient-teal">Сохранить</Button>
      </form>

      <YandexMetrikaSettings />
    </div>
  );
}

function YandexMetrikaSettings() {
  const [ymId, setYmId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await db
        .from("app_settings")
        .select("value")
        .eq("key", "analytics")
        .maybeSingle();
      const v = data?.value as { yandex_metrika_id?: string } | null;
      if (v?.yandex_metrika_id) setYmId(v.yandex_metrika_id);
      setLoading(false);
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await db
      .from("app_settings")
      .upsert(
        { key: "analytics", value: { yandex_metrika_id: ymId.trim() || null }, updated_at: new Date().toISOString() },
        { onConflict: "key" },
      );
    if (error) return toast.error(error.message);
    toast.success("Сохранено — обновите страницу, чтобы счётчик подгрузился");
  }

  if (loading) return null;

  return (
    <form onSubmit={save} className="mt-8 space-y-4 rounded-2xl bg-card p-6 shadow-soft">
      <div>
        <h2 className="text-lg font-bold">Яндекс.Метрика</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Введите номер счётчика (например, <code>12345678</code>) — счётчик подключится автоматически.
        </p>
      </div>
      <div>
        <Label className="mb-1.5 block">ID счётчика</Label>
        <Input value={ymId} onChange={(e) => setYmId(e.target.value)} placeholder="12345678" inputMode="numeric" />
      </div>
      <Button type="submit" className="rounded-full bg-gradient-teal">Сохранить</Button>
    </form>
  );
}
