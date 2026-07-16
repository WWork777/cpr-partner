import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, Mail, MapPin, Clock, Building2, Download, FileText } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ApplicationForm } from "@/components/site/ApplicationForm";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Контакты ООО ЦПР «Партнер» — Красноярск, Томск | Учебный центр" },
      {
        name: "description",
        content:
          "Контакты учебного центра ООО ЦПР «Партнер»: Красноярск, ул. Кутузова 1 стр. 37 оф. 210; Томский филиал — ул. Ленина 190 стр. 2 пом. 25. Тел. 8 (391) 278-65-05, info@cpr-partner.ru. Корпоративное обучение с выездом в регион.",
      },
      { name: "keywords", content: "ЦПР Партнер контакты, учебный центр Красноярск, учебный центр Томск, обучение с выездом, корпоративное обучение, охрана труда Красноярск" },
      { property: "og:title", content: "Контакты ООО ЦПР «Партнер» — Красноярск и Томск" },
      { property: "og:description", content: "Адреса офисов в Красноярске и Томске, телефон 8 (391) 278-65-05, e-mail info@cpr-partner.ru. Корпоративное обучение с выездом." },
      { property: "og:url", content: "/contacts" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/contacts" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "ООО ЦПР «Партнер»",
          email: "info@cpr-partner.ru",
          telephone: "+7-391-278-65-05",
          url: "/",
          address: [
            {
              "@type": "PostalAddress",
              streetAddress: "ул. Кутузова 1, строение 37, оф. 210",
              addressLocality: "Красноярск",
              postalCode: "660049",
              addressCountry: "RU",
            },
            {
              "@type": "PostalAddress",
              streetAddress: "ул. Ленина 190, строение 2, пом. 25",
              addressLocality: "Томск",
              addressCountry: "RU",
            },
          ],
        }),
      },
    ],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 py-8 md:py-12 lg:px-8">
        <nav className="text-sm text-muted-foreground" aria-label="Хлебные крошки">
          <Link to="/" className="hover:text-primary">Главная</Link> / Контакты
        </nav>
        <h1 className="mt-2 text-3xl md:text-5xl font-bold">Контакты ООО ЦПР «Партнер»</h1>
        <p className="mt-4 max-w-3xl text-base md:text-lg text-muted-foreground">
          Свяжитесь с нами удобным способом. Мы расскажем о форматах обучения, поможем подобрать
          курс и оформим заявку. Обучение проводится очно в Красноярске и Томске, дистанционно
          по всей России, а также в <strong>корпоративном формате с выездом в ваш регион</strong>.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickCard icon={<Phone className="h-5 w-5" />} label="Телефон" value="8 (391) 278-65-05" href="tel:+73912786505" />
          <QuickCard icon={<Phone className="h-5 w-5" />} label="Бесплатно по РФ" value="8 (800) 500-70-16" href="tel:+78005007016" />
          <QuickCard icon={<Mail className="h-5 w-5" />} label="Email" value="info@cpr-partner.ru" href="mailto:info@cpr-partner.ru" />
          <QuickCard icon={<Clock className="h-5 w-5" />} label="Часы работы" value="Пн–Пт 9:00–18:00" />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <OfficeCard
            title="Головной офис — Красноярск"
            address="660049, Россия, г. Красноярск, ул. Кутузова 1, строение 37, оф. 210"
            coords={[92.879437, 56.009496]}
          />
          <OfficeCard
            title="Томский филиал"
            address="г. Томск, ул. Ленина 190, строение 2, пом. 25"
            coords={[84.948197, 56.484680]}
          />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-2xl bg-card shadow-soft p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold">Корпоративное обучение и индивидуальные программы</h2>
            <p className="mt-3 text-muted-foreground">
              Не нашли нужный курс в каталоге? Предложите свою тему — мы разработаем программу
              специально под задачи вашей компании. Возможен выезд преподавателей в ваш регион,
              формирование группы из ваших сотрудников и обучение без отрыва от производства.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex gap-2"><span className="text-primary">•</span> Выезд преподавателя в любой регион РФ</li>
              <li className="flex gap-2"><span className="text-primary">•</span> Адаптация программы под специфику предприятия</li>
              <li className="flex gap-2"><span className="text-primary">•</span> Удостоверения и протоколы установленного образца</li>
              <li className="flex gap-2"><span className="text-primary">•</span> Безналичный расчёт, закрывающие документы</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="mailto:info@cpr-partner.ru?subject=Каталог курсов"
                className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-soft/70"
              >
                <Download className="h-4 w-4" /> Запросить каталог курсов
              </a>
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
              >
                <FileText className="h-4 w-4" /> Все направления
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-card shadow-soft p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold">Оставить заявку</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Менеджер перезвонит в течение рабочего дня и поможет с выбором программы.
            </p>
            <div className="mt-4">
              <ApplicationForm variant="compact" />
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-2xl bg-card shadow-soft p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold">Реквизиты ООО ЦПР «Партнер»</h2>
          <dl className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2 text-sm">
            <Row k="Полное наименование" v="Общество с ограниченной ответственностью «Центр Профессионального Развития «Партнер»" />
            <Row k="Сокращённое" v="ООО ЦПР «Партнер»" />
            <Row k="Юр. адрес" v="660049, г. Красноярск, ул. Кутузова 1, стр. 37, оф. 210" />
            <Row k="Email" v="info@cpr-partner.ru" />
            <Row k="Телефон" v="8 (391) 278-65-05" />
            <Row k="Сайт" v="cpr-partner.ru" />
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Подробные сведения об образовательной организации, лицензии и педагогическом составе —{" "}
            <Link to="/sveden" className="text-primary hover:underline">в разделе «Сведения»</Link>.
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}

function QuickCard({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const inner = (
    <div className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-soft hover:shadow-card transition-shadow h-full">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-0.5 font-semibold text-sm md:text-base break-words">{value}</div>
      </div>
    </div>
  );
  return href ? <a href={href} className="block">{inner}</a> : inner;
}

function OfficeCard({ title, address, coords }: { title: string; address: string; coords: [number, number] }) {
  const [lon, lat] = coords;
  const ll = `${lon},${lat}`;
  const embedSrc = `https://yandex.ru/map-widget/v1/?ll=${ll}&z=17&pt=${ll},pm2rdm&mode=search`;
  const mapHref = `https://yandex.ru/maps/?ll=${ll}&z=17&pt=${ll},pm2rdm`;
  return (
    <div className="rounded-2xl bg-card shadow-soft overflow-hidden flex flex-col">
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <h2 className="text-lg md:text-xl font-bold">{title}</h2>
        </div>
        <p className="mt-4 flex items-start gap-2 text-sm md:text-base">
          <MapPin className="h-4 w-4 mt-1 text-primary shrink-0" />
          <span>{address}</span>
        </p>
        <a
          href={mapHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          Открыть на Яндекс.Картах →
        </a>
      </div>
      <iframe
        src={embedSrc}
        title={`Карта: ${title}`}
        loading="lazy"
        className="w-full h-72 border-0"
        allowFullScreen
      />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-b border-border/40 py-2">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="font-medium break-words">{v}</dd>
    </div>
  );
}
