import { Link } from "@tanstack/react-router";
import { Phone, Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CallbackModal } from "./CallbackModal";
import { AccessibilityToggle } from "./AccessibilityToggle";
import { SearchInline } from "./SearchInline";
import { CitySwitcher, useCity } from "./CitySwitcher";
import logoAsset from "@/assets/cpr-logo.png";

type Item = { to: string; label: string };
type NavGroup = { label: string; to?: string; items?: Item[] };

const NAV: NavGroup[] = [
  {
    label: "Курсы",
    to: "/courses",
    items: [
      { to: "/courses", label: "Все курсы" },
      { to: "/napravleniya", label: "Направления обучения" },
      { to: "/otrasli", label: "Отрасли" },
    ],
  },
  {
    label: "Корп.обучение",
    to: "/corp-calc",
    items: [
      { to: "/corp-calc", label: "Калькулятор стоимости" },
      { to: "/compare", label: "Сравнение курсов" },
    ],
  },
  {
    label: "О центре",
    items: [
      { to: "/sveden", label: "Сведения об организации" },
      { to: "/teachers", label: "Преподаватели" },
      { to: "/gallery", label: "Галерея" },
      { to: "/blog", label: "Блог" },
    ],
  },
  { label: "Расписание", to: "/raspisanie" },
  { label: "Проверка документа", to: "/verify" },
  { label: "Контакты", to: "/contacts" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const { city } = useCity();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
      {/* Main row */}
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3 lg:px-8 lg:gap-6">
        <Link to="/" className="flex items-center shrink-0">
          <img src={logoAsset} alt="ЦПР Партнер" className="h-12 w-auto md:h-14" width={115} height={56} />
        </Link>

        <div className="hidden md:flex items-center gap-3 max-w-2xl mx-auto w-full">
          <CitySwitcher variant="pill" />
          <SearchInline className="flex-1" />
        </div>

        <div className="col-start-3 flex items-center justify-end gap-2 md:gap-3 shrink-0">
          <a
            href={`tel:${city.phone.replace(/[^+\d]/g, "")}`}
            className="hidden md:flex flex-col items-end leading-tight whitespace-nowrap text-foreground hover:text-primary"
          >
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{city.name}</span>
            <span className="inline-flex items-center gap-1.5 text-base font-bold">
              <Phone className="h-4 w-4 text-primary" /> {city.phone}
            </span>
          </a>
          <AccessibilityToggle />
          <CallbackModal
            trigger={
              <Button className="hidden sm:inline-flex rounded-full bg-gradient-teal hover:opacity-90 shadow-soft">
                Обратный звонок
              </Button>
            }
          />
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg hover:bg-muted"
            onClick={() => setOpen((v) => !v)}
            aria-label="Меню"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile search + city */}
      <div className="md:hidden px-4 pb-3 flex items-center gap-2 min-w-0">
        <CitySwitcher variant="pill" />
        <SearchInline className="flex-1 min-w-0" />
      </div>


      {/* Nav row */}
      <div className="hidden lg:block border-t border-border/40 bg-background">
        <nav
          className="mx-auto max-w-7xl px-4 lg:px-8 flex items-center gap-1 text-sm font-medium"
          onMouseLeave={() => setOpenGroup(null)}
        >
          {NAV.map((g) => {
            const isGroup = !!g.items?.length;
            const isOpen = openGroup === g.label;
            return (
              <div
                key={g.label}
                className="relative"
                onMouseEnter={() => isGroup && setOpenGroup(g.label)}
              >
                {g.to ? (
                  <Link
                    to={g.to}
                    className="inline-flex items-center gap-1 px-4 py-3 text-foreground/85 hover:text-primary hover:bg-primary-soft transition-colors"
                    activeProps={{ className: "text-primary bg-primary-soft" }}
                  >
                    {g.label}
                    {isGroup && <ChevronDown className="h-3.5 w-3.5 opacity-70" />}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 px-4 py-3 text-foreground/85 hover:text-primary hover:bg-primary-soft transition-colors"
                    onClick={() => setOpenGroup(isOpen ? null : g.label)}
                  >
                    {g.label}
                    {isGroup && <ChevronDown className="h-3.5 w-3.5 opacity-70" />}
                  </button>
                )}
                {isGroup && isOpen && (
                  <div className="absolute left-0 top-full z-50 min-w-[240px] rounded-xl border border-border bg-card shadow-card overflow-hidden">
                    {g.items!.map((i) => (
                      <Link
                        key={i.to}
                        to={i.to}
                        className="block px-4 py-2.5 text-sm text-foreground/85 hover:bg-primary-soft hover:text-primary"
                        onClick={() => setOpenGroup(null)}
                      >
                        {i.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-border/60 bg-background">
          <nav className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1">
            {NAV.map((g) => (
              <div key={g.label} className="py-1">
                {g.to ? (
                  <Link
                    to={g.to}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 rounded-lg font-semibold text-foreground/90 hover:bg-muted"
                  >
                    {g.label}
                  </Link>
                ) : (
                  <div className="px-3 py-2 font-semibold text-foreground/90">{g.label}</div>
                )}
                {g.items?.map((i) => (
                  <Link
                    key={i.to}
                    to={i.to}
                    onClick={() => setOpen(false)}
                    className="block pl-6 pr-3 py-2 rounded-lg text-sm text-foreground/70 hover:bg-muted"
                  >
                    {i.label}
                  </Link>
                ))}
              </div>
            ))}
            <a href="tel:+78005007016" className="mt-2 px-3 py-2 rounded-lg font-semibold text-primary">
              8 (800) 500-70-16
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
