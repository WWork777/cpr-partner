import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({ phone: z.string().min(5).max(40) });

function normPhone(s: string) {
  return s.replace(/\D+/g, "").replace(/^8/, "7");
}

type AppRow = {
  id: string;
  name: string;
  course_title: string | null;
  status: string;
  created_at: string;
};

export const lookupApplicationsByPhone = createServerFn({ method: "POST" })
  .inputValidator((data) => Input.parse(data))
  .handler(async ({ data }): Promise<{ applications: AppRow[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const norm = normPhone(data.phone);
    if (norm.length < 10) return { applications: [] };
    const { data: rows, error } = await supabaseAdmin
      .from("applications")
      .select("id, name, phone, course_title, status, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return { applications: [] };
    const matched = (rows ?? []).filter((r) => normPhone(r.phone ?? "").endsWith(norm.slice(-10)));
    return {
      applications: matched.map((r) => ({
        id: r.id,
        name: r.name,
        course_title: r.course_title,
        status: r.status as string,
        created_at: r.created_at,
      })),
    };
  });
