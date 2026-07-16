import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";

export function HomeBanners() {
  const { data } = useQuery({
    queryKey: ["banners", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .or("placement.eq.home,placement.is.null")
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!data || data.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 lg:px-8 mt-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map((b) => (
          <a
            key={b.id}
            href={b.link_url ?? "#"}
            className="group relative overflow-hidden rounded-2xl bg-card shadow-soft min-h-[180px] flex flex-col justify-end p-5"
            style={
              b.image_url
                ? {
                    backgroundImage: `linear-gradient(180deg, rgba(15,30,45,0.1), rgba(15,30,45,0.7)), url(${b.image_url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            <div className={b.image_url ? "text-white" : ""}>
              <h3 className="text-lg font-bold">{b.title}</h3>
              {b.subtitle && (
                <p className={`mt-1 text-sm ${b.image_url ? "text-white/85" : "text-muted-foreground"}`}>
                  {b.subtitle}
                </p>
              )}
              {b.cta_label && (
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold">
                  {b.cta_label} <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
