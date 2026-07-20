import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
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
  const navigate = useNavigate();
  const [settings, setSettings] = useState<NotifySettings>({ enabled: false, recipient: "" });
  const [loading, setLoading] = useState(true);
  const [profileEmail, setProfileEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await db.from("app_settings").select("value").eq("key", KEY).maybeSingle();
        if (data?.value) {
          const v = data.value as Partial<NotifySettings>;
          setSettings({ enabled: !!v.enabled, recipient: typeof v.recipient === "string" ? v.recipient : "" });
        }
        const { data: authData } = await db.auth.getUser();
        const email = authData.user?.email ?? "";
        setProfileEmail(email);
        setNewEmail(email);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Не удалось загрузить настройки");
      } finally {
        setLoading(false);
      }
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

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const { error } = await db.auth.updateEmail(newEmail, currentPassword);
      if (error) return toast.error(error.message);
      await db.auth.signOut();
      toast.success("Email изменён. Войдите с новым адресом.");
      navigate({ to: "/auth", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось изменить email");
    } finally {
      setProfileSaving(false);
    }
  }

  if (loading) return <div className="text-muted-foreground">Загрузка…</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold">Настройки</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Уведомления о новых заявках отправляются в Telegram через proxy и на email через Nodemailer/SMTP.
        SMTP, Telegram bot token и chat ID задаются в <code>.env</code>.
      </p>

      <form onSubmit={saveProfile} className="mt-8 space-y-5 rounded-2xl bg-card p-6 shadow-soft">
        <h2 className="text-xl font-semibold">Профиль</h2>
        <div>
          <Label className="mb-1.5 block">Текущий email</Label>
          <Input value={profileEmail} readOnly disabled />
        </div>
        <div>
          <Label className="mb-1.5 block">Новый email</Label>
          <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
        </div>
        <div>
          <Label className="mb-1.5 block">Текущий пароль</Label>
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </div>
        <Button type="submit" disabled={profileSaving} className="rounded-full bg-gradient-teal">
          {profileSaving ? "Сохраняем…" : "Изменить email"}
        </Button>
      </form>

      <form onSubmit={save} className="mt-6 space-y-5 rounded-2xl bg-card p-6 shadow-soft">
        <h2 className="text-xl font-semibold">Уведомления</h2>
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

    </div>
  );
}
