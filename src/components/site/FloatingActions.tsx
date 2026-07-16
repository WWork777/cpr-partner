import { useState } from "react";
import { Phone, MessageSquare, X } from "lucide-react";
const VkIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12.97 16.5c-5.34 0-8.39-3.66-8.52-9.75h2.68c.09 4.47 2.06 6.37 3.62 6.76V6.75h2.52v3.86c1.54-.17 3.16-1.92 3.7-3.86h2.52c-.42 2.39-2.17 4.14-3.41 4.86 1.24.58 3.23 2.11 3.99 4.89h-2.78c-.59-1.85-2.07-3.28-4.02-3.48v3.48h-.3z"/>
  </svg>
);
import { CallbackModal } from "./CallbackModal";

export function FloatingActions() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 print:hidden">
      {open && (
        <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-2">
          <a
            href="tel:+73912786505"
            className="flex items-center gap-2 rounded-full bg-card shadow-card px-4 py-3 text-sm font-semibold hover:bg-primary-soft transition-colors"
            aria-label="Позвонить"
          >
            <Phone className="h-4 w-4 text-primary" />
            Позвонить
          </a>
          <CallbackModal
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 rounded-full bg-card shadow-card px-4 py-3 text-sm font-semibold hover:bg-primary-soft transition-colors cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 text-primary" />
                Оставить заявку
              </button>
            }
          />
          <a
            href="https://vk.com/cpr_partner"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-card shadow-card px-4 py-3 text-sm font-semibold hover:bg-primary-soft transition-colors"
            aria-label="Мы ВКонтакте"
          >
            <VkIcon className="h-4 w-4 text-primary" />
            ВКонтакте
          </a>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Закрыть меню связи" : "Связаться с нами"}
        className="relative h-14 w-14 rounded-full bg-gradient-teal text-white shadow-card flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
      >
        {!open && (
          <>
            <span className="pointer-events-none absolute inset-0 rounded-full bg-primary/60 animate-ping" aria-hidden="true" />
            <span className="pointer-events-none absolute -inset-1 rounded-full ring-2 ring-primary/40 animate-pulse" aria-hidden="true" />
          </>
        )}
        {open ? (
          <X className="h-6 w-6 relative" />
        ) : (
          <Phone className="h-6 w-6 relative fill-white animate-[phone-ring_1.4s_ease-in-out_infinite] origin-center" />
        )}
      </button>
    </div>
  );
}
