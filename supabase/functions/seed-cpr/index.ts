// One-shot seed for CPR courses. Public (no JWT) for simplicity.
// @ts-ignore deno
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
// @ts-ignore json import
import courses from "./courses.json" with { type: "json" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Course = {
  category_slug: string;
  category_name: string;
  slug: string;
  title: string;
  price: number | null;
  hours: number | null;
  document: string | null;
  format: string | null;
  about: string;
  plan: string;
};

// @ts-ignore deno
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // @ts-ignore deno
  const url = Deno.env.get("SUPABASE_URL")!;
  // @ts-ignore deno
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(url, key);

  const list = courses as Course[];

  // Wipe existing
  await sb.from("courses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await sb.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Unique categories
  const catMap = new Map<string, string>();
  for (const c of list) catMap.set(c.category_slug, c.category_name);
  const catRows = Array.from(catMap.entries()).map(([slug, name], i) => ({
    slug, name, sort_order: i,
  }));
  const { data: cats, error: catErr } = await sb.from("categories").insert(catRows).select("id, slug");
  if (catErr) return new Response(JSON.stringify({ step: "categories", error: catErr.message }), { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } });

  const catBySlug = new Map<string, string>();
  for (const r of cats!) catBySlug.set(r.slug as string, r.id as string);

  const courseRows = list.map((c, i) => {
    const features: { label: string; value: string }[] = [];
    if (c.hours) features.push({ label: "Объём", value: `${c.hours} ак. часов` });
    if (c.format) features.push({ label: "Формат", value: c.format });
    if (c.document) features.push({ label: "Документ", value: c.document });
    return {
      slug: c.slug,
      title: c.title,
      category_id: catBySlug.get(c.category_slug) ?? null,
      short_description: (c.about || "").slice(0, 300),
      description: c.about || "",
      price: c.price ?? 0,
      duration: c.hours ? `${c.hours} ак. часов` : null,
      format: c.format ?? null,
      features,
      sort_order: i,
      published: true,
    };
  });

  // Insert in chunks of 30
  let inserted = 0;
  for (let i = 0; i < courseRows.length; i += 30) {
    const chunk = courseRows.slice(i, i + 30);
    const { error } = await sb.from("courses").insert(chunk);
    if (error) {
      return new Response(JSON.stringify({ step: "courses", at: i, error: error.message }), { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } });
    }
    inserted += chunk.length;
  }

  return new Response(JSON.stringify({ ok: true, categories: catRows.length, courses: inserted }), {
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
});
