import { createFileRoute } from "@tanstack/react-router";
import { RegionPage } from "@/components/site/RegionPage";
import { publishedCoursesQuery } from "@/lib/queries";
import { COMPANY_CONTACTS } from "@/lib/company";

const CITY = {
  city: "Томск",
  address: "ул. Ленина, 190, стр. 2, пом. 25",
  phone: COMPANY_CONTACTS.phone,
};

export const Route = createFileRoute("/tomsk")({
  head: () => ({
    meta: [
      { title: "Учебный центр в Томске — курсы, охрана труда | ЦПР Партнер" },
      { name: "description", content: "ЦПР Партнер в Томске: обучение на самоходную технику, охрана труда, электробезопасность и рабочие профессии. Очно и дистанционно." },
      { property: "og:title", content: "Учебный центр ЦПР Партнер — Томск" },
      { property: "og:url", content: "/tomsk" },
    ],
    links: [{ rel: "canonical", href: "/tomsk" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: `ЦПР Партнер — ${CITY.city}`,
          address: { "@type": "PostalAddress", streetAddress: CITY.address, addressLocality: CITY.city, addressCountry: "RU" },
          telephone: CITY.phone,
          areaServed: CITY.city,
        }),
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(publishedCoursesQuery),
  component: () => <RegionPage {...CITY} />,
});
