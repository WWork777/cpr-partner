import { createFileRoute } from "@tanstack/react-router";
import { RegionPage } from "@/components/site/RegionPage";
import { publishedCoursesQuery } from "@/lib/queries";
import { COMPANY_CONTACTS } from "@/lib/company";

const CITY = {
  city: "Кемерово",
  address: "обучение по согласованию",
  phone: COMPANY_CONTACTS.phone,
};

export const Route = createFileRoute("/kemerovo")({
  head: () => ({
    meta: [
      { title: "Обучение самоходной технике в Кемерово — ЦПР Партнер" },
      { name: "description", content: "Обучение самоходной технике и операторов БПЛА в Кемерово. ЦПР Партнер — лицензированный учебный центр." },
      { property: "og:title", content: "ЦПР Партнер — Кемерово, обучение самоходной технике" },
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
        return (
          s.includes("бпла") ||
          s.includes("беспилот") ||
          s.includes("дрон") ||
          s.includes("трактор") ||
          s.includes("погруз") ||
          s.includes("экскават") ||
          s.includes("самоход") ||
          s.includes("спецтех")
        );
      }}
      titleOverride="Обучение самоходной технике — Кемерово"
      intro="В Кемерово учебный центр ЦПР Партнер обучает работе на самоходной технике и по направлению операторов беспилотных авиационных систем. Очно и дистанционно."
    />
  ),
});
