import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
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
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "login") {
      const { error } = await db.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Добро пожаловать!");
      navigate({ to: "/admin" });
    } else {
      const { error } = await db.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/admin" },
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Аккаунт создан. Если включена проверка email — подтвердите его.");
      setMode("login");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md rounded-3xl bg-card p-8 shadow-card">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
          ← На главную
        </Link>
        <h1 className="mt-4 text-2xl font-bold">
          {mode === "login" ? "Вход в админку" : "Регистрация"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Доступ только для администраторов учебного центра.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="pwd">Пароль</Label>
            <Input
              id="pwd"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-gradient-teal hover:opacity-90 h-11"
          >
            {busy ? "…" : mode === "login" ? "Войти" : "Создать аккаунт"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 text-sm text-primary hover:underline"
        >
          {mode === "login" ? "Создать новый аккаунт" : "Уже есть аккаунт? Войти"}
        </button>
      </div>
    </div>
  );
}
