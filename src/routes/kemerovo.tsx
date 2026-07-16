import { createFileRoute } from "@tanstack/react-router";
import { RegionPage } from "@/components/site/RegionPage";
import { publishedCoursesQuery } from "@/lib/queries";

const CITY = {
  city: "Кемерово",
  address: "по согласованию",
  phone: "+7 (391) 219-09-99",
};

export const Route = createFileRoute("/kemerovo")({
  head: () => ({
    meta: [
      { title: "Обучение операторов БПЛА в Кемерово — ЦПР Партнер" },
      { name: "description", content: "Курсы операторов беспилотных авиационных систем в Кемерово. ЦПР Партнер — лицензированный учебный центр." },
      { property: "og:title", content: "ЦПР Партнер — Кемерово, обучение БПЛА" },
      { property: "og:url", content: "/kemerovo" },
    ],
    links: [{ rel: "canonical", href: "/kemerovo" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(publishedCoursesQuery),
  component: () => (
    <RegionPage
      {...CITY}
      filterCourses={(c) => {
        const s = `${c.title} ${c.short_description ?? ""}`.toLowerCase();
        return s.includes("бпла") || s.includes("беспилот") || s.includes("дрон");
      }}
      titleOverride="Обучение операторов БПЛА — Кемерово"
      intro="В Кемерово учебный центр ЦПР Партнер ведёт направление операторов беспилотных авиационных систем. Очно и дистанционно."
    />
  ),
});
