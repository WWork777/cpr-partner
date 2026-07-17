import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { db } from "@/integrations/database/client";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/verify")({
  component: VerifyPage,
  head: () => ({
    meta: [
      { title: "Проверка удостоверения — ЦПР Партнер" },
      {
        name: "description",
        content:
          "Онлайн-проверка подлинности удостоверений и сертификатов ЦПР Партнер по номеру документа.",
      },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: "Проверка удостоверения — ЦПР Партнер" },
      {
        property: "og:description",
        content: "Проверьте подлинность удостоверения по номеру.",
      },
      { rel: "canonical", href: "/verify" },
    ],
  }),
});

type Cert = {
  number: string;
  full_name: string;
  course_title: string;
  issued_at: string;
  valid_until: string | null;
  registry_no: string | null;
};

function VerifyPage() {
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ cert: Cert | null; searched: boolean }>({
    cert: null,
    searched: false,
  });

  async function check(e: React.FormEvent) {
    e.preventDefault();
    const n = number.trim();
    if (!n) return;
    setBusy(true);
    const { data } = await db
      .from("certificates")
      .select("number, full_name, course_title, issued_at, valid_until, registry_no")
      .ilike("number", n)
      .maybeSingle();
    setBusy(false);
    setResult({ cert: (data as Cert | null) ?? null, searched: true });
  }

  return (
    <>
      <Header />
      <main className="bg-gradient-to-b from-primary-soft/30 to-background md:min-h-screen">
        <section className="mx-auto max-w-3xl px-4 py-10 md:py-16 lg:py-24">
          <div className="flex items-center gap-3 text-primary">
            <ShieldCheck className="h-7 w-7" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              Реестр документов
            </span>
          </div>
          <h1 className="mt-3 text-3xl md:text-5xl font-bold">Проверка удостоверения</h1>
          <p className="mt-4 text-muted-foreground text-lg">
            Введите номер документа, чтобы проверить его подлинность в реестре ЦПР Партнер.
          </p>

          <form
            onSubmit={check}
            className="mt-8 rounded-2xl bg-card shadow-card p-6 md:p-8 flex flex-col sm:flex-row gap-3"
          >
            <Input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Например, 772400123456"
              className="h-12 text-base"
              autoFocus
            />
            <Button
              type="submit"
              disabled={busy}
              className="h-12 rounded-full bg-gradient-teal px-6 text-base"
            >
              <Search className="h-4 w-4" /> Проверить
            </Button>
          </form>

          {result.searched && (
            <div className="mt-6">
              {result.cert ? (
                <div className="rounded-2xl bg-success/10 border border-success/30 p-6 md:p-8">
                  <div className="flex items-center gap-2 text-success font-semibold">
                    <CheckCircle2 className="h-5 w-5" />
                    Документ подтверждён
                  </div>
                  <dl className="mt-5 grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    <Row k="Номер" v={result.cert.number} />
                    <Row k="ФИО" v={result.cert.full_name} />
                    <Row k="Программа" v={result.cert.course_title} />
                    <Row
                      k="Дата выдачи"
                      v={new Date(result.cert.issued_at).toLocaleDateString("ru-RU")}
                    />
                    {result.cert.valid_until && (
                      <Row
                        k="Действителен до"
                        v={new Date(result.cert.valid_until).toLocaleDateString("ru-RU")}
                      />
                    )}
                    {result.cert.registry_no && (
                      <Row k="Реестровый номер" v={result.cert.registry_no} />
                    )}
                  </dl>
                </div>
              ) : (
                <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-6 md:p-8">
                  <div className="flex items-center gap-2 text-destructive font-semibold">
                    <XCircle className="h-5 w-5" />
                    Документ не найден в реестре
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Проверьте правильность ввода номера. Если уверены — свяжитесь с нами по
                    телефону <a href="tel:+78005007016" className="text-primary">+7 (800) 500-70-16</a>.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{k}</dt>
      <dd className="mt-0.5 font-medium">{v}</dd>
    </div>
  );
}
