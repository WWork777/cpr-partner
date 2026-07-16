import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { publishedCoursesQuery, publishedPostsQuery } from "@/lib/queries";

export function SearchDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const courses = useQuery(publishedCoursesQuery);
  const posts = useQuery(publishedPostsQuery);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return { courses: [], posts: [] };
    const cs = (courses.data ?? []).filter((c: any) =>
      [c.title, c.short_description, c.categories?.name].some((v) => v?.toLowerCase().includes(term))
    ).slice(0, 8);
    const ps = (posts.data ?? []).filter((p: any) =>
      [p.title, p.excerpt].some((v) => v?.toLowerCase().includes(term))
    ).slice(0, 5);
    return { courses: cs, posts: ps };
  }, [q, courses.data, posts.data]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Поиск" className="inline-flex">
        {trigger}
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 pt-[10vh]"
          onClick={() => setOpen(false)}
        >
          <div className="w-full max-w-2xl rounded-2xl bg-card shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                autoFocus
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Поиск курсов и статей…"
                className="flex-1 bg-transparent outline-none text-base"
              />
              <button onClick={() => setOpen(false)} aria-label="Закрыть" className="p-1 rounded hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {!q.trim() && <p className="p-6 text-sm text-muted-foreground text-center">Введите запрос — найдём курсы и статьи блога.</p>}
              {q.trim() && results.courses.length === 0 && results.posts.length === 0 && (
                <p className="p-6 text-sm text-muted-foreground text-center">Ничего не нашлось.</p>
              )}
              {results.courses.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Курсы</div>
                  {results.courses.map((c: any) => (
                    <Link
                      key={c.id}
                      to="/courses/$slug"
                      params={{ slug: c.slug }}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-2 hover:bg-primary-soft"
                    >
                      <div className="font-medium text-sm">{c.title}</div>
                      {c.categories?.name && <div className="text-xs text-muted-foreground">{c.categories.name}</div>}
                    </Link>
                  ))}
                </div>
              )}
              {results.posts.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Статьи</div>
                  {results.posts.map((p: any) => (
                    <Link
                      key={p.id}
                      to="/blog/$slug"
                      params={{ slug: p.slug }}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-2 hover:bg-primary-soft"
                    >
                      <div className="font-medium text-sm">{p.title}</div>
                      {p.excerpt && <div className="text-xs text-muted-foreground line-clamp-1">{p.excerpt}</div>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
