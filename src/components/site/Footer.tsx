import { Link } from "@tanstack/react-router";
import { Phone, Mail, MapPin } from "lucide-react";
import logoAsset from "@/assets/cpr-logo.png";
import { COMPANY_CONTACTS } from "@/lib/company";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8 grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <img src={logoAsset} alt="ЦПР Партнер" className="h-12 w-auto" width={115} height={56} />
          <p className="mt-4 text-sm text-muted-foreground max-w-md">
            Учебный центр с аккредитацией Гостехнадзора. Обучаем рабочим специальностям,
            охране труда и работе на спецтехнике с 2009 года.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href="https://vk.com/cpr_partner"
              target="_blank"
              rel="noreferrer"
              aria-label="ВКонтакте"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                <path d="M12.07 19.5h1.32c.4 0 .53-.27.53-.6 0-1.18.61-1.5 1.6-.5 1.13 1.12 1.36 1.62 2.6 1.62h2.32c.6 0 .9-.27.74-.84-.38-1.17-2.93-3.6-3.04-3.75-.27-.36-.2-.52 0-.84.01 0 2.66-3.74 2.94-5 .14-.46 0-.84-.65-.84h-2.32c-.55 0-.8.3-.94.6 0 0-1.1 2.7-2.67 4.45-.5.5-.74.66-1 .66-.13 0-.36-.16-.36-.62V8.66c0-.55-.16-.8-.6-.8H8.6c-.34 0-.55.26-.55.5 0 .53.79.65.87 2.13v3.21c0 .7-.12.83-.4.83-.74 0-2.53-2.7-3.6-5.8-.21-.6-.42-.85-.97-.85H1.62c-.5 0-.62.23-.62.5 0 .58.74 3.4 3.4 7.1C6.18 17.96 8.7 19.5 11 19.5h1.07z" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold mb-3">Навигация</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/courses" className="hover:text-primary">Все курсы</Link></li>
            <li><Link to="/teachers" className="hover:text-primary">Преподаватели</Link></li>
            <li><Link to="/gallery" className="hover:text-primary">Галерея</Link></li>
            <li><Link to="/blog" className="hover:text-primary">Блог</Link></li>
            <li><Link to="/sveden" className="hover:text-primary">Сведения об организации</Link></li>
            <li><Link to="/privacy" className="hover:text-primary">Политика конфиденциальности</Link></li>
            <li><Link to="/contacts" className="hover:text-primary">Контакты</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold mb-3">Красноярск</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" /> ул. Кутузова 1, стр. 37, оф. 2-10</li>
            <li className="flex items-start gap-2"><Phone className="h-4 w-4 mt-0.5 text-primary shrink-0" /><a href={`tel:${COMPANY_CONTACTS.phoneHref}`} className="hover:text-primary">{COMPANY_CONTACTS.phone}</a></li>
            <li className="flex items-start gap-2"><Mail className="h-4 w-4 mt-0.5 text-primary shrink-0" /><a href={`mailto:${COMPANY_CONTACTS.email}`} className="hover:text-primary">{COMPANY_CONTACTS.email}</a></li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold mb-3">Томск</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" /> ул. Ленина 190, стр. 2, пом. 25</li>
            <li className="flex items-start gap-2"><Phone className="h-4 w-4 mt-0.5 text-primary shrink-0" /><a href={`tel:${COMPANY_CONTACTS.phoneHref}`} className="hover:text-primary">{COMPANY_CONTACTS.phone}</a></li>
          </ul>

          <div className="text-sm font-semibold mt-6 mb-3">Кемерово</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/kemerovo" className="hover:text-primary">Самоходная техника</Link></li>
            <li className="flex items-start gap-2"><Phone className="h-4 w-4 mt-0.5 text-primary shrink-0" /><a href={`tel:${COMPANY_CONTACTS.phoneHref}`} className="hover:text-primary">{COMPANY_CONTACTS.phone}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ЦПР Партнер. Все права защищены.
      </div>
    </footer>
  );
}
