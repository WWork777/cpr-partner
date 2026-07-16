import p1 from "@/assets/partners/p_d7jg2677w2cl8dcqr6eeb8ye3f2gpbzd.png";
import p2 from "@/assets/partners/p_d0271wy53dxp8g59reyaynymt4pj1nw3.png";
import p3 from "@/assets/partners/p_qv2amgacj6lx836rs3t7yiw9s3psstvl.png";
import p4 from "@/assets/partners/p_h75frqvhv9nu3ezsouebwhfqovw9k213.png";
import p5 from "@/assets/partners/p_223m8r1q8u7r3yqkh6so2xfwulpu22ag.png";
import p6 from "@/assets/partners/p_8re986d73f6j7v2uldptnxd0mohml1zt.png";
import p7 from "@/assets/partners/p_d8nhi1ogw58mjpczbysqkmzkhbgqw81c.png";
import p8 from "@/assets/partners/p_r4k5rgscc00l25b59h4mvtscjz40ne3r.png";
import p9 from "@/assets/partners/p_w3t140dpljmxly2s8ylnvr0kqt5yumc0.png";
import p10 from "@/assets/partners/p_9n4z1jvqmis2sxfpdayctods1tswwpq5.png";

const PARTNERS = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10];

const REVIEWS = [
  {
    name: "Олеся",
    text: "Замечательная организация занятий! Спасибо огромное за обучение!",
  },
  {
    name: "Ксения Мальцева",
    text: "Выражаю благодарность сотруднику образовательного центра «Партнёр» Алёне Леонидовне Елисеевой за высокий профессионализм и отзывчивость. Она очень помогла на всех этапах подготовки и оформления документов договора — я делала это впервые. Удачи вашей организации!",
  },
  {
    name: "Елена Иванова",
    text: "Хочу выразить благодарность данному центру за оперативность, качество и доступное обучение!!! Будем работать дальше)",
  },
  {
    name: "Александр Левашов",
    text: "Очень понравился учебный центр! Обращаюсь второй раз. Всё организовано профессионально, обучение проходил онлайн без посещения центра. Благодарю Елисееву Алёну Леонидовну за помощь!",
  },
  {
    name: "Анастасия Рущак",
    text: "Замечательный учебный центр! Прохожу обучение по программе ПК — всё организовано очень хорошо, обучение можно пройти онлайн без посещения центра. Благодарю Елисееву Алёну за профессионализм и помощь во всех вопросах!",
  },
  {
    name: "Юлия",
    text: "Мы — медицинская организация из Улан-Удэ, сотрудничаем с ООО ЦПР «Партнёр» не первый год. Хочется подчеркнуть их работу: всё вовремя, чётко. Особенно благодарим менеджера Ольгу — всегда на связи, даже после рабочего дня оперативно решает все вопросы.",
  },
  {
    name: "Татьяна",
    text: "Первый раз обратилась в УЦ «Партнёр» и не пожалела. Очень благодарна Елисеевой Алёне за помощь. Очень вежливая, всегда быстро отвечала, была постоянно на связи. Огромное спасибо за профессионализм.",
  },
  {
    name: "Екатерина",
    text: "С УЦ «Партнёр» работаю уже больше года, менеджеры всегда приветливые, всё расскажут и объяснят. Спасибо нашему менеджеру Екатерине — всегда на связи, всё очень быстро, без заминок. Обучение доступное и понятное, без воды. Будем работать с вами и дальше!",
  },
];

const REVIEWS_SOURCE_URL =
  "https://2gis.ru/krasnoyarsk/firm/985690699699305/tab/reviews";


export function PartnersSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 lg:px-8 mt-20">
      <h2 className="text-2xl md:text-3xl font-bold">Сотрудничаем с ведущими компаниями</h2>
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {PARTNERS.map((src, i) => (
          <div
            key={i}
            className="flex h-24 items-center justify-center rounded-2xl bg-card p-4 shadow-soft"
          >
            <img
              src={src}
              alt="Партнёр"
              loading="lazy"
              className="max-h-full max-w-full object-contain opacity-80 transition-opacity hover:opacity-100"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Star } from "lucide-react";

function Stars({ size = 16 }: { size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label="Рейтинг 5 из 5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className="fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export function ReviewsSection() {
  const yearsOnMarket = new Date().getFullYear() - 2009;
  return (
    <section className="mx-auto max-w-7xl px-4 lg:px-8 mt-20">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">Что говорят участники</h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-2">
              <Stars size={18} />
              <span className="text-lg font-bold">5.0</span>
              <span className="text-sm text-muted-foreground">по отзывам 2ГИС</span>
            </div>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <div className="text-sm">
              <span className="font-semibold text-foreground">Работаем с 2009 года</span>
              <span className="text-muted-foreground"> — {yearsOnMarket}+ лет на рынке</span>
            </div>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <div className="text-sm">
              <span className="font-semibold text-foreground">10 000+</span>
              <span className="text-muted-foreground"> выпускников</span>
            </div>
          </div>
        </div>
        <a
          href={REVIEWS_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Все отзывы на 2ГИС →
        </a>
      </div>

      <Carousel
        opts={{ align: "start", loop: true }}
        className="mt-6"
      >
        <CarouselContent className="-ml-4">
          {REVIEWS.map((r) => (
            <CarouselItem
              key={r.name}
              className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
            >
              <figure className="h-full rounded-2xl bg-card p-6 shadow-soft flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-teal text-white font-bold">
                    {r.name.trim()[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <figcaption className="font-semibold">{r.name}</figcaption>
                    <Stars size={14} />
                  </div>
                </div>

                <blockquote className="mt-4 text-sm text-muted-foreground leading-relaxed">
                  «{r.text}»
                </blockquote>
              </figure>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="mt-6 flex justify-end gap-2">
          <CarouselPrevious className="static translate-y-0" />
          <CarouselNext className="static translate-y-0" />
        </div>
      </Carousel>
    </section>
  );
}
