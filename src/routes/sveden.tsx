import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/sveden")({
  component: SvedenPage,
  head: () => ({
    meta: [
      { title: "Сведения об образовательной организации — ЦПР Партнер" },
      {
        name: "description",
        content:
          "Информация об образовательной организации ЦПР Партнер: реквизиты, лицензия, документы, руководство, материально-техническое обеспечение.",
      },
      { property: "og:title", content: "Сведения об образовательной организации — ЦПР Партнер" },
      { property: "og:url", content: "/sveden" },
    ],
    links: [{ rel: "canonical", href: "/sveden" }],
  }),
});

const SECTIONS = [
  { id: "common", title: "Основные сведения" },
  { id: "struct", title: "Структура и органы управления" },
  { id: "documents", title: "Документы" },
  { id: "education", title: "Образование" },
  { id: "edu-standarts", title: "Образовательные стандарты и требования" },
  { id: "employees", title: "Руководство. Педагогический состав" },
  { id: "objects", title: "Материально-техническое обеспечение" },
  { id: "paid-edu", title: "Платные образовательные услуги" },
  { id: "finance", title: "Финансово-хозяйственная деятельность" },
  { id: "vacant", title: "Вакантные места для приёма" },
  { id: "ovz", title: "Доступная среда" },
  { id: "international", title: "Международное сотрудничество" },
];

function SvedenPage() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold">Сведения об образовательной организации</h1>
        <p className="mt-2 text-muted-foreground">
          Раздел сформирован в соответствии с приказом Рособрнадзора № 831 от 14.08.2020.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
          <nav className="lg:sticky lg:top-24 lg:self-start space-y-1 text-sm">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block px-3 py-2 rounded-lg text-foreground/80 hover:bg-primary-soft hover:text-primary"
              >
                {s.title}
              </a>
            ))}
          </nav>

          <div className="space-y-10">
            <Block id="common" title="Основные сведения">
              <Row k="Полное наименование">Общество с ограниченной ответственностью «Центр Профессионального Развития "Партнёр"»</Row>
              <Row k="Сокращённое наименование">ООО ЦПР «Партнёр»</Row>
              <Row k="Дата создания">2009 год</Row>
              <Row k="Учредитель">Физические лица</Row>
              <Row k="Юридический адрес">660049, Россия, г. Красноярск, ул. Кутузова, д. 1, строение 37, оф. 210</Row>
              <Row k="Филиал">г. Томск, ул. Ленина, д. 190, строение 2, пом. 25</Row>
              <Row k="Режим работы">Пн–Пт: 9:00–18:00 (по местному времени)</Row>
              <Row k="Телефон">8 (800) 500-70-16, 8 (391) 278-65-05</Row>
              <Row k="E-mail">info@cpr-partner.ru</Row>
              <Row k="География работы">Обучение проводится по всей России (очно, выездом и дистанционно)</Row>
            </Block>


            <Block id="struct" title="Структура и органы управления">
              <p>
                Организация имеет линейную структуру управления. Высший орган управления — общее
                собрание учредителей. Текущей деятельностью руководит директор.
              </p>
            </Block>

            <Block id="documents" title="Документы">
              <ul className="list-disc pl-5 space-y-1">
                <li>Лицензия на ведение образовательной деятельности</li>
                <li>Свидетельство о государственной регистрации юридического лица</li>
                <li>Свидетельство о постановке на учёт в налоговом органе</li>
                <li>Аккредитация на оказание услуг в области охраны труда (Минтруд России)</li>
                <li>Аккредитация в МУГАДН (транспортная безопасность, ДОПОГ)</li>
                <li>Аккредитация Министерства здравоохранения РФ</li>
                <li>Аккредитация Агентства труда и занятости населения</li>
                <li>Аккредитация Гостехнадзора Красноярского края и Томской области</li>
                <li>Программы ПТМ, согласованные с ГУ МЧС России по Красноярскому краю</li>
                <li>Удостоверение об утверждении курсов подготовки водителей АТС, перевозящих опасные грузы</li>
                <li>
                  <Link to="/privacy" className="text-primary hover:underline">
                    Политика защиты и обработки персональных данных
                  </Link>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                Сканы документов и копии лицензии предоставляются по запросу на info@cpr-partner.ru.
              </p>
            </Block>


            <Block id="education" title="Образование">
              <Row k="Уровень образования">Дополнительное профессиональное образование, профессиональное обучение</Row>
              <Row k="Формы обучения">Очная, очно-заочная, заочная с применением дистанционных образовательных технологий</Row>
              <Row k="Язык обучения">Русский</Row>
              <Row k="Срок действия аккредитации">Государственная аккредитация для программ ДПО не предусмотрена</Row>
              <p className="text-sm mt-2">Перечень реализуемых программ см. в разделе <a href="/courses" className="text-primary hover:underline">Курсы</a>.</p>
            </Block>

            <Block id="edu-standarts" title="Образовательные стандарты и требования">
              <p>
                Обучение ведётся по программам, разработанным на основе профессиональных
                стандартов и требований нормативных актов РФ (Постановление Правительства РФ
                № 2464, приказы Минтруда России и др.).
              </p>
            </Block>

            <Block id="employees" title="Руководство. Педагогический состав">
              <p className="mb-3">Преподаватели ЦПР «Партнёр» — специалисты с профильным образованием и многолетним практическим опытом:</p>
              <ul className="grid sm:grid-cols-2 gap-1 list-disc pl-5">
                <li>Буева Елена Игоревна</li>
                <li>Волкова Марина Александровна</li>
                <li>Журавлева Ирина Александровна</li>
                <li>Заднепровская Людмила Владимировна</li>
                <li>Котова Вера Александровна</li>
                <li>Новикова Светлана Ивановна</li>
                <li>Окушова Гульнафист Алтаевна</li>
                <li>Райкова Оксана Андреевна</li>
                <li>Толстобоков Олег Николаевич</li>
                <li>Шаяхметова Альфия Камельевна</li>
              </ul>
            </Block>


            <Block id="objects" title="Материально-техническое обеспечение">
              <ul className="list-disc pl-5 space-y-1">
                <li>Собственный трактородром и парк спецтехники для практических занятий — без ограничения часов на практике</li>
                <li>Собственный крытый полигон для отработки навыков работ на высоте — занятия проводятся в любую погоду</li>
                <li>Тренажёры и симуляторы для отработки навыков первичной и периодической аккредитации (в т.ч. оказание первой помощи)</li>
                <li>Учебные кабинеты с мультимедийной техникой</li>
                <li>Платформа дистанционного обучения <a href="http://online.cpr-partner.ru/" className="text-primary hover:underline" target="_blank" rel="noreferrer">online.cpr-partner.ru</a></li>
                <li>Возможность выездного корпоративного и индивидуального обучения</li>
              </ul>
            </Block>


            <Block id="paid-edu" title="Платные образовательные услуги">
              <p>
                Все программы реализуются на платной основе по договору об оказании платных
                образовательных услуг. Стоимость каждой программы указана на странице курса.
              </p>
            </Block>

            <Block id="finance" title="Финансово-хозяйственная деятельность">
              <p>Бюджетного финансирования не имеет. Деятельность ведётся за счёт средств,
                поступающих по договорам об оказании платных образовательных услуг.</p>
            </Block>

            <Block id="vacant" title="Вакантные места для приёма">
              <p>
                Набор на курсы ведётся постоянно. Количество мест по каждой программе
                уточняйте при подаче заявки.
              </p>
            </Block>

            <Block id="ovz" title="Доступная среда">
              <p>
                Реализуется обучение с применением дистанционных образовательных технологий,
                что обеспечивает доступность программ для лиц с ограниченными возможностями
                здоровья. На сайте доступна <span className="font-medium">версия для слабовидящих</span> (кнопка в шапке сайта).
              </p>
            </Block>

            <Block id="international" title="Международное сотрудничество">
              <p>Международные договоры по вопросам образования не заключались.</p>
            </Block>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl md:text-2xl font-semibold mb-4 pb-2 border-b border-border">{title}</h2>
      <div className="space-y-2 text-foreground/90">{children}</div>
    </section>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[260px_1fr] gap-1 sm:gap-4 py-1.5 border-b border-border/40">
      <div className="text-sm text-muted-foreground">{k}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
