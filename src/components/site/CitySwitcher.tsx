import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, ChevronDown, Check } from "lucide-react";

export type City = {
  slug: string;
  name: string;
  phone: string;
  to: "/krasnoyarsk" | "/tomsk" | "/kemerovo";
};

export const CITIES: City[] = [
  { slug: "krasnoyarsk", name: "Красноярск", phone: "+7 (391) 222-22-87", to: "/krasnoyarsk" },
  { slug: "tomsk", name: "Томск", phone: "+7 (3822) 902-887", to: "/tomsk" },
  { slug: "kemerovo", name: "Кемерово", phone: "8 (800) 500-70-16", to: "/kemerovo" },
];

const STORAGE_KEY = "cpr-city";

function detectCity(): City {
  if (typeof window === "undefined") return CITIES[0];
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (/Tomsk/i.test(tz)) return CITIES[1];
    if (/Kemerovo|Novokuznetsk/i.test(tz)) return CITIES[2];
    if (/Krasnoyarsk/i.test(tz)) return CITIES[0];
    const lang = (navigator.language || "").toLowerCase();
    const hint = (document.referrer + " " + window.location.hostname).toLowerCase();
    if (hint.includes("tomsk")) return CITIES[1];
    if (hint.includes("kemerovo")) return CITIES[2];
    if (lang.startsWith("ru")) return CITIES[0];
  } catch {}
  return CITIES[0];
}

export function useCity() {
  const [city, setCityState] = useState<City>(CITIES[0]);
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const found = CITIES.find((c) => c.slug === saved);
    if (found) {
      setCityState(found);
    } else {
      const auto = detectCity();
      setCityState(auto);
      try { localStorage.setItem(STORAGE_KEY, auto.slug); } catch {}
    }
  }, []);
  const setCity = (c: City) => {
    setCityState(c);
    try { localStorage.setItem(STORAGE_KEY, c.slug); } catch {}
  };
  return { city, setCity };
}

type Variant = "compact" | "pill";

export function CitySwitcher({ variant = "compact" }: { variant?: Variant } = {}) {
  const { city, setCity } = useCity();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const triggerClass =
    variant === "pill"
      ? "inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-2 text-sm font-medium hover:border-primary hover:text-primary transition-colors shadow-soft shrink-0 max-w-[44vw] sm:max-w-none"
      : "inline-flex items-center gap-1.5 hover:text-primary";

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className={triggerClass} aria-label="Выбор города">
        <MapPin className="h-4 w-4 text-primary" />
        {variant === "pill" ? (
          <span className="truncate max-w-[72px] sm:max-w-[110px]">{city.name}</span>
        ) : (
          <span>Ваш город: <strong className="font-semibold text-foreground">{city.name}</strong></span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 opacity-70 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-50 w-[min(260px,calc(100vw-1rem))] rounded-xl border border-border bg-card shadow-card overflow-hidden">
          <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
            Выберите ваш город
          </div>
          {CITIES.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => { setCity(c); setOpen(false); }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-primary-soft"
            >
              <span>
                <span className="font-medium text-foreground">{c.name}</span>
                <span className="block text-xs text-muted-foreground">{c.phone}</span>
              </span>
              {c.slug === city.slug && <Check className="h-4 w-4 text-primary shrink-0" />}
            </button>
          ))}
          <Link
            to="/contacts"
            onClick={() => setOpen(false)}
            className="block border-t border-border/60 px-3 py-2 text-xs text-primary hover:bg-primary-soft text-center font-semibold"
          >
            Все контакты
          </Link>
        </div>
      )}
    </div>
  );
}
