import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { db } from "@/integrations/database/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Вход — ЦПР Партнер" }, { name: "robots", content: "noindex" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "forgot" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("reset");
    if (token) {
      setResetToken(token);
      setMode("reset");
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "forgot") {
      const { error } = await db.auth.requestPasswordReset(email);
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Если аккаунт существует, ссылка для восстановления отправлена на почту.");
      setMode("login");
      return;
    }
    if (mode === "reset") {
      if (password.length < 8) {
        setBusy(false);
        return toast.error("Пароль должен быть не короче 8 символов");
      }
      if (password !== passwordConfirm) {
        setBusy(false);
        return toast.error("Пароли не совпадают");
      }
      const { error } = await db.auth.resetPassword(resetToken, password);
      setBusy(false);
      if (error) return toast.error(error.message);
      window.history.replaceState({}, "", "/auth");
      setPassword("");
      setPasswordConfirm("");
      setMode("login");
      toast.success("Пароль изменён. Теперь можно войти.");
      return;
    }

    {
      const { error } = await db.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Добро пожаловать!");
      navigate({ to: "/admin" });
    }
  }

  const isLogin = mode === "login";
  const isForgot = mode === "forgot";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-card">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
          ← На главную
        </Link>
        <h1 className="mt-4 text-2xl font-bold">
          {isLogin ? "Вход в админку" : isForgot ? "Восстановление пароля" : "Новый пароль"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isLogin
            ? "Введите email и пароль сотрудника."
            : isForgot
              ? "Укажите email сотрудника, и мы отправим ссылку для смены пароля."
              : "Ссылка действует ограниченное время. Задайте новый пароль."}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode !== "reset" && <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>}
          {mode !== "forgot" && <div>
            <Label htmlFor="pwd">Пароль</Label>
            <Input id="pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>}
          {mode === "reset" && <div>
            <Label htmlFor="pwd-confirm">Повторите пароль</Label>
            <Input id="pwd-confirm" type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required minLength={8} />
          </div>}
          <Button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-gradient-teal hover:opacity-90 h-11"
          >
            {busy ? "…" : isLogin ? "Войти" : isForgot ? "Отправить ссылку" : "Сохранить пароль"}
          </Button>
        </form>
        {isLogin && <button type="button" onClick={() => setMode("forgot")} className="mt-4 text-sm text-primary hover:underline">Забыли пароль?</button>}
        {!isLogin && <button type="button" onClick={() => setMode("login")} className="mt-4 text-sm text-primary hover:underline">Вернуться ко входу</button>}
      </div>
    </div>
  );
}
