import { createFileRoute } from "@tanstack/react-router";
import { RegionPage } from "@/components/site/RegionPage";
import { publishedCoursesQuery } from "@/lib/queries";
import { COMPANY_CONTACTS } from "@/lib/company";

const CITY = {
  city: "Красноярск",
  address: "ул. Кутузова, д. 1, стр. 37, оф. 2-10",
  phone: COMPANY_CONTACTS.phone,
};

export const Route = createFileRoute("/krasnoyarsk")({
  head: () => ({
    meta: [
      { title: "Учебный центр в Красноярске — курсы, охрана труда | ЦПР Партнер" },
      { name: "description", content: "ЦПР Партнер в Красноярске: обучение на самоходную технику, охрана труда, электробезопасность и рабочие профессии. Очно и дистанционно." },
      { property: "og:title", content: "Учебный центр ЦПР Партнер — Красноярск" },
      { property: "og:url", content: "/krasnoyarsk" },
    ],
    links: [{ rel: "canonical", href: "/krasnoyarsk" }],
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
