import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import directions from "@/data/directions.json";

// TODO: replace with project URL once a domain is set.
const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticPaths = [
          { p: "/", c: "weekly", pr: "1.0" },
          { p: "/courses", c: "daily", pr: "0.9" },
          { p: "/napravleniya", c: "weekly", pr: "0.9" },
          { p: "/raspisanie", c: "weekly", pr: "0.8" },
          { p: "/blog", c: "daily", pr: "0.8" },
          { p: "/verify", c: "monthly", pr: "0.7" },
          { p: "/lk", c: "monthly", pr: "0.5" },
          { p: "/otrasli", c: "weekly", pr: "0.8" },
          { p: "/otrasli/stroitelstvo", c: "weekly", pr: "0.7" },
          { p: "/otrasli/energetika", c: "weekly", pr: "0.7" },
          { p: "/otrasli/zhkh", c: "weekly", pr: "0.7" },
          { p: "/corp-calc", c: "monthly", pr: "0.6" },
          { p: "/compare", c: "monthly", pr: "0.4" },
          { p: "/krasnoyarsk", c: "weekly", pr: "0.8" },
          { p: "/tomsk", c: "weekly", pr: "0.8" },
          { p: "/about", c: "monthly", pr: "0.6" },
          { p: "/contacts", c: "monthly", pr: "0.6" },
          { p: "/sveden", c: "monthly", pr: "0.4" },
          { p: "/privacy", c: "yearly", pr: "0.2" },
        ];

        let coursePaths: string[] = [];
        let blogPaths: string[] = [];
        try {
          const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_PUBLISHABLE_KEY!,
            { auth: { persistSession: false, autoRefreshToken: false } },
          );
          const [{ data: courses }, { data: posts }] = await Promise.all([
            supabase.from("courses").select("slug").eq("published", true),
            supabase.from("blog_posts").select("slug").eq("published", true),
          ]);
          coursePaths = (courses ?? []).map((c) => `/courses/${c.slug}`);
          blogPaths = (posts ?? []).map((p) => `/blog/${p.slug}`);
        } catch {
          // tolerate failures during SSR build
        }

        const dirPaths = (directions as { slug: string }[]).map(
          (d) => `/napravleniya/${d.slug}`,
        );

        const urls = [
          ...staticPaths.map((s) => entry(s.p, s.c, s.pr)),
          ...dirPaths.map((p) => entry(p, "weekly", "0.85")),
          ...coursePaths.map((p) => entry(p, "weekly", "0.7")),
          ...blogPaths.map((p) => entry(p, "weekly", "0.6")),
        ];

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

function entry(path: string, changefreq: string, priority: string) {
  return `  <url>\n    <loc>${BASE_URL}${path}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}
