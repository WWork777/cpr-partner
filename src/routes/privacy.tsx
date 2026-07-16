import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import policy from "@/data/privacy-policy.json";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Политика конфиденциальности — ЦПР Партнер" },
      {
        name: "description",
        content:
          "Политика защиты и обработки персональных данных ООО ЦПР «Партнёр» в соответствии с 152-ФЗ.",
      },
      { property: "og:title", content: "Политика конфиденциальности — ЦПР Партнер" },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

const paragraphs = policy as string[];

function isHeading(p: string): "h2" | "h3" | null {
  if (/^\d+\.\s/.test(p) && !/^\d+\.\d/.test(p)) return "h2";
  if (/^\d+\.\d+\.\s/.test(p) && p.length < 120) return "h3";
  return null;
}

function PrivacyPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
        <div className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Главная</Link> / Политика конфиденциальности
        </div>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold">
          Политика защиты и обработки персональных данных ООО ЦПР «Партнёр»
        </h1>
        <div className="mt-8 space-y-4 text-foreground/90 leading-relaxed">
          {paragraphs.map((p, i) => {
            const h = isHeading(p);
            if (h === "h2") {
              return (
                <h2 key={i} className="text-xl font-semibold mt-8">{p}</h2>
              );
            }
            if (h === "h3") {
              return (
                <h3 key={i} className="text-base font-semibold mt-4">{p}</h3>
              );
            }
            return <p key={i} className="text-sm md:text-base">{p}</p>;
          })}
        </div>
      </section>
    </SiteLayout>
  );
}
