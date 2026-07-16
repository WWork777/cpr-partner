import {
  Award,
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarCheck,
  Clock3,
  FileCheck,
  GraduationCap,
  Headphones,
  Landmark,
  MapPinned,
  MonitorCheck,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Wallet,
} from "lucide-react";

const WHY = [
  {
    icon: ShieldCheck,
    title: "Лицензия и аккредитация",
    text: "Образовательная лицензия и аккредитация Минтруда. Документы вносим в реестр Рособрнадзора (ФИС ФРДО).",
  },
  {
    icon: Award,
    title: "15+ лет на рынке",
    text: "Обучили более 50 000 специалистов. Работаем с предприятиями Сибири и всей России.",
  },
  {
    icon: GraduationCap,
    title: "Преподаватели-практики",
    text: "Эксперты с реальным опытом в охране труда, промбезопасности и рабочих профессиях.",
  },
  {
    icon: FileCheck,
    title: "Документы в день экзамена",
    text: "Удостоверения и протоколы готовы сразу после успешной сдачи — без задержек.",
  },
  {
    icon: Headphones,
    title: "Поддержка 24/7",
    text: "Личный куратор сопровождает на всём обучении: материалы, тесты, технические вопросы.",
  },
  {
    icon: Wallet,
    title: "Скидки для групп",
    text: "Корпоративные тарифы от 10% при обучении 5+ сотрудников. Договор, акты, закрывающие документы.",
  },
  {
    icon: CalendarCheck,
    title: "Ежедневный набор",
    text: "Не ждёте месяцами: подбираем ближайший поток или запускаем дистанционный формат под вашу дату.",
  },
  {
    icon: MonitorCheck,
    title: "Очно и дистанционно",
    text: "Можно учиться в классе, через личный кабинет или совмещать формат с практикой на площадке.",
  },
  {
    icon: BadgeCheck,
    title: "Документы принимают проверки",
    text: "Готовим удостоверения, протоколы и дипломы установленного образца для кадровых и надзорных задач.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Работаем с юрлицами",
    text: "Договор, счёт, акты и закрывающие документы. Подготовим комплект под требования вашей бухгалтерии.",
  },
  {
    icon: UsersRound,
    title: "Корпоративные группы",
    text: "Собираем обучение под предприятие: списки сотрудников, график, отчётность и контроль прохождения.",
  },
  {
    icon: MapPinned,
    title: "Выезд в регионы",
    text: "Организуем обучение на площадке заказчика, если сотрудникам удобнее заниматься без отрыва от производства.",
  },
  {
    icon: BookOpenCheck,
    title: "Актуальные программы",
    text: "Обновляем материалы под действующие требования Минтруда, Ростехнадзора, МЧС и профильных регламентов.",
  },
  {
    icon: Clock3,
    title: "Быстрый запуск",
    text: "Менеджер уточняет задачу, подбирает курс и отправляет коммерческое предложение в течение рабочего дня.",
  },
  {
    icon: ReceiptText,
    title: "Прозрачная стоимость",
    text: "Показываем цену, скидку и итог до заявки. Без скрытых доплат за базовое сопровождение обучения.",
  },
  {
    icon: Landmark,
    title: "Опыт с госзакупками",
    text: "Понимаем требования 44-ФЗ и 223-ФЗ: помогаем готовить обучение под регламенты заказчиков.",
  },
  {
    icon: Sparkles,
    title: "Без лишней бюрократии",
    text: "Берём на себя организационные мелочи: документы, напоминания, доступы, итоговые сведения и связь с группой.",
  },
];

type Props = {
  title?: string;
  className?: string;
};

export function WhyUs({ title = "Почему выбирают ЦПР Партнер", className = "" }: Props) {
  return (
    <section className={`mx-auto max-w-7xl px-4 lg:px-8 ${className}`}>
      <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WHY.map((w) => {
          const Icon = w.icon;
          return (
            <div key={w.title} className="rounded-2xl bg-card p-6 shadow-soft">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 font-semibold">{w.title}</div>
              <div className="mt-2 text-sm text-muted-foreground">{w.text}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
