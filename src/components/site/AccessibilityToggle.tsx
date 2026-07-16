import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, X, Play, Pause, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "off" | "white" | "black" | "beige";
type Size = "normal" | "lg" | "xl";
type Font = "sans" | "serif";

const KEY = "a11y-settings-v1";

function apply(theme: Theme, size: Size, font: Font, noImg: boolean) {
  const html = document.documentElement;
  html.classList.remove("a11y-white", "a11y-black", "a11y-beige", "a11y-lg", "a11y-xl", "a11y-serif", "a11y-no-images");
  if (theme !== "off") html.classList.add(`a11y-${theme}`);
  if (size !== "normal") html.classList.add(`a11y-${size}`);
  if (font === "serif") html.classList.add("a11y-serif");
  if (noImg) html.classList.add("a11y-no-images");
}

export function AccessibilityToggle() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("off");
  const [size, setSize] = useState<Size>("normal");
  const [font, setFont] = useState<Font>("sans");
  const [noImg, setNoImg] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        setTheme(s.theme ?? "off");
        setSize(s.size ?? "normal");
        setFont(s.font ?? "sans");
        setNoImg(!!s.noImg);
        apply(s.theme ?? "off", s.size ?? "normal", s.font ?? "sans", !!s.noImg);
      }
    } catch {}
  }, []);

  useEffect(() => {
    apply(theme, size, font, noImg);
    try {
      localStorage.setItem(KEY, JSON.stringify({ theme, size, font, noImg }));
    } catch {}
  }, [theme, size, font, noImg]);

  const reset = () => {
    setTheme("off");
    setSize("normal");
    setFont("sans");
    setNoImg(false);
  };

  // ---- Text-to-Speech ----
  const [ttsState, setTtsState] = useState<"idle" | "playing" | "paused">("idle");
  const [rate, setRate] = useState(1);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const getSpokenText = () => {
    const sel = window.getSelection()?.toString().trim();
    if (sel && sel.length > 0) return sel;
    const main = document.querySelector("main") ?? document.body;
    const clone = main.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("script,style,noscript,nav,header,footer,button,[aria-hidden='true']").forEach((n) => n.remove());
    return (clone.innerText || clone.textContent || "").replace(/\s+/g, " ").trim();
  };

  const speak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Озвучка не поддерживается вашим браузером");
      return;
    }
    const text = getSpokenText();
    if (!text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.slice(0, 32000));
    u.lang = "ru-RU";
    u.rate = rate;
    const ruVoice = window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith("ru"));
    if (ruVoice) u.voice = ruVoice;
    u.onend = () => setTtsState("idle");
    u.onerror = () => setTtsState("idle");
    utterRef.current = u;
    window.speechSynthesis.speak(u);
    setTtsState("playing");
  };

  const pauseResume = () => {
    if (ttsState === "playing") {
      window.speechSynthesis.pause();
      setTtsState("paused");
    } else if (ttsState === "paused") {
      window.speechSynthesis.resume();
      setTtsState("playing");
    }
  };

  const stop = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setTtsState("idle");
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
        aria-label="Версия для слабовидящих"
        title="Версия для слабовидящих"
      >
        <Eye className="h-4 w-4" />
        <span className="hidden md:inline">Для слабовидящих</span>
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-start justify-center p-4 overflow-auto" onClick={() => setOpen(false)}>
          <div
            className="mt-12 w-full max-w-lg rounded-2xl bg-card text-card-foreground p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Настройки отображения</h2>
              <button onClick={() => setOpen(false)} aria-label="Закрыть" className="p-1 rounded hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <Section title="Цветовая схема">
              <Opt active={theme === "off"} onClick={() => setTheme("off")}>Обычная</Opt>
              <Opt active={theme === "white"} onClick={() => setTheme("white")}>Ч/Б на белом</Opt>
              <Opt active={theme === "black"} onClick={() => setTheme("black")}>Белым на чёрном</Opt>
              <Opt active={theme === "beige"} onClick={() => setTheme("beige")}>Тёмным на бежевом</Opt>
            </Section>

            <Section title="Размер шрифта">
              <Opt active={size === "normal"} onClick={() => setSize("normal")}>A</Opt>
              <Opt active={size === "lg"} onClick={() => setSize("lg")}>A+</Opt>
              <Opt active={size === "xl"} onClick={() => setSize("xl")}>A++</Opt>
            </Section>

            <Section title="Шрифт">
              <Opt active={font === "sans"} onClick={() => setFont("sans")}>Без засечек</Opt>
              <Opt active={font === "serif"} onClick={() => setFont("serif")}>С засечками</Opt>
            </Section>

            <Section title="Изображения">
              <Opt active={!noImg} onClick={() => setNoImg(false)}>Показывать</Opt>
              <Opt active={noImg} onClick={() => setNoImg(true)}>Отключить</Opt>
            </Section>

            <Section title="Озвучка страницы">
              <div className="flex flex-wrap items-center gap-2 w-full">
                {ttsState === "idle" ? (
                  <button type="button" onClick={speak} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary bg-primary text-primary-foreground text-sm">
                    <Play className="h-4 w-4" /> Читать
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={pauseResume} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-input bg-background text-sm">
                      {ttsState === "playing" ? <><Pause className="h-4 w-4" /> Пауза</> : <><Play className="h-4 w-4" /> Продолжить</>}
                    </button>
                    <button type="button" onClick={stop} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-input bg-background text-sm">
                      <Square className="h-4 w-4" /> Стоп
                    </button>
                  </>
                )}
                <div className="inline-flex items-center gap-2 ml-auto text-sm">
                  <Volume2 className="h-4 w-4" />
                  <select
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value))}
                    className="border border-input bg-background rounded-md px-2 py-1 text-sm"
                    aria-label="Скорость озвучки"
                  >
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 w-full">
                Озвучит выделенный текст или содержимое страницы. Работает через встроенный синтез речи браузера.
              </p>
            </Section>

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={reset}>Сбросить</Button>
              <Button onClick={() => setOpen(false)}>Готово</Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Opt({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border text-sm ${active ? "border-primary bg-primary-soft text-primary" : "border-input bg-background hover:bg-muted"}`}
    >
      {children}
    </button>
  );
}
