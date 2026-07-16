import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, MapPin, Users } from "lucide-react";

export function CourseSchedule({ courseId }: { courseId: string }) {
  const { data } = useQuery({
    queryKey: ["course-schedules", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_schedules")
        .select("*")
        .eq("course_id", courseId)
        .eq("is_active", true)
        .gte("start_date", new Date().toISOString().slice(0, 10))
        .order("start_date");
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!data || data.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl bg-card p-6 shadow-soft">
      <h2 className="text-xl font-bold">Ближайшие потоки</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {data.map((s) => (
          <div key={s.id} className="rounded-xl border border-border/60 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="h-4 w-4 text-primary" />
              {new Date(s.start_date).toLocaleDateString("ru-RU")}
              {s.end_date && ` — ${new Date(s.end_date).toLocaleDateString("ru-RU")}`}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {s.format && <span>{s.format}</span>}
              {s.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {s.city}
                </span>
              )}
              {s.seats_left != null && (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" /> мест: {s.seats_left}
                  {s.seats_total ? ` / ${s.seats_total}` : ""}
                </span>
              )}
              {s.price != null && <span className="font-semibold text-foreground">{s.price} ₽</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
