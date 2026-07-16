import { createFileRoute } from "@tanstack/react-router";
import { RegionPage } from "@/components/site/RegionPage";
import { publishedCoursesQuery } from "@/lib/queries";

const CITY = {
  city: "Красноярск",
  address: "ул. Кутузова, д. 1, стр. 37, оф. 210",
  phone: "+7 (391) 219-09-99",
};

export const Route = createFileRoute("/krasnoyarsk")({
  head: () => ({
    meta: [
      { title: "Учебный центр в Красноярске — курсы, охрана труда | ЦПР Партнер" },
      { name: "description", content: "ЦПР Партнер в Красноярске: курсы по охране труда, электробезопасности, рабочим профессиям и спецтехнике. Очно и дистанционно." },
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
