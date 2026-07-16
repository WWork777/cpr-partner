import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "cpr-cookie-consent-v1";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      // ignore
    }
  }, []);

  function accept(value: "all" | "necessary") {
    try {
      localStorage.setItem(KEY, JSON.stringify({ value, at: Date.now() }));
    } catch {
      // ignore
    }
    setShow(false);
  }

  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-4xl rounded-2xl bg-card/95 backdrop-blur shadow-card border border-border/60 p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
        <Cookie className="h-6 w-6 text-primary shrink-0" aria-hidden />
        <div className="text-sm text-foreground/90 flex-1">
          Мы используем cookie и аналогичные технологии для работы сайта и аналитики. Продолжая
          пользоваться сайтом, вы соглашаетесь с{" "}
          <Link to="/privacy" className="text-primary underline">политикой обработки персональных данных</Link>{" "}
          (152-ФЗ).
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => accept("necessary")}>
            Только необходимые
          </Button>
          <Button size="sm" className="rounded-full bg-gradient-teal" onClick={() => accept("all")}>
            Принять
          </Button>
        </div>
      </div>
    </div>
  );
}
