import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { db } from "@/integrations/database/client";

export function PromoPopup() {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({
    queryKey: ["banners", "popup"],
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { data, error } = await db
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .eq("placement", "popup")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).filter((b: any) => {
        if (b.starts_at && b.starts_at > nowIso) return false;
        if (b.ends_at && b.ends_at < nowIso) return false;
        return true;
      });
    },
    staleTime: 60_000,
  });

  const promo = data?.[0];

  useEffect(() => {
    if (!promo) return;
    if (typeof window === "undefined") return;
    const key = `promo-dismissed-${promo.id}`;
    if (sessionStorage.getItem(key)) return;
    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, [promo]);

  function close() {
    if (promo && typeof window !== "undefined") {
      sessionStorage.setItem(`promo-dismissed-${promo.id}`, "1");
    }
    setOpen(false);
  }

  if (!open || !promo) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={close}>
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label="Закрыть"
          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-foreground shadow hover:bg-white"
        >
          <X className="h-4 w-4" />
        </button>
        {promo.image_url && (
          <div
            className="h-44 w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${promo.image_url})` }}
          />
        )}
        <div className="p-6">
          {promo.badge && (
            <span className="inline-block rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-950">
              {promo.badge}
            </span>
          )}
          <h3 className="mt-3 text-2xl font-bold text-foreground">{promo.title}</h3>
          {promo.subtitle && <p className="mt-2 text-sm text-muted-foreground">{promo.subtitle}</p>}
          {promo.cta_label && (
            <a
              href={promo.link_url ?? "#"}
              onClick={close}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-teal px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              {promo.cta_label} <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
