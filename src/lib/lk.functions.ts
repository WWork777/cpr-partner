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
    const { queryDatabase } = await import("@/lib/local-db.server");
    const norm = normPhone(data.phone);
    if (norm.length < 10) return { applications: [] };
    const result = await queryDatabase<{ id: string; name: string; phone: string; course_title: string | null; status: string; created_at: string }>(
      "SELECT id, name, phone, course_title, status, created_at FROM applications ORDER BY created_at DESC LIMIT 200",
    );
    const matched = result.rows.filter((r) => normPhone(r.phone ?? "").endsWith(norm.slice(-10)));
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
