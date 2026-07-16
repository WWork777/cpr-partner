import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { categoryImage, courseImageWithFallback } from "@/lib/course-images";
import { publishedCoursesQuery, publishedPostsQuery } from "@/lib/queries";

export function SearchInline({ className = "" }: { className?: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const courses = useQuery(publishedCoursesQuery);
  const posts = useQuery(publishedPostsQuery);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return { courses: [], posts: [] };
    const cs = (courses.data ?? []).filter((c: any) =>
      [c.title, c.short_description, c.categories?.name].some((v) => v?.toLowerCase().includes(term))
    ).slice(0, 6);
    const ps = (posts.data ?? []).filter((p: any) =>
      [p.title, p.excerpt].some((v) => v?.toLowerCase().includes(term))
    ).slice(0, 3);
    return { courses: cs, posts: ps };
  }, [q, courses.data, posts.data]);

  const hasResults = results.courses.length + results.posts.length > 0;
  const showDropdown = open && q.trim().length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    navigate({ to: "/courses", search: { q: q.trim() } as any });
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <form onSubmit={submit} className="flex items-center h-10 rounded-full bg-muted/60 border border-border focus-within:border-primary focus-within:bg-background transition-colors">
        <Search className="ml-3 h-4 w-4 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Поиск курсов…"
          className="flex-1 min-w-0 bg-transparent outline-none px-2 text-sm placeholder:text-muted-foreground"
        />
        {q && (
          <button type="button" onClick={() => { setQ(""); inputRef.current?.focus(); }} className="px-2 text-muted-foreground hover:text-foreground" aria-label="Очистить">
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl border border-border bg-card shadow-card overflow-hidden max-h-[70vh] overflow-y-auto">
          {!hasResults && (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">Ничего не нашлось.</p>
          )}
          {results.courses.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Курсы</div>
              {results.courses.map((c: any) => (
                <Link
                  key={c.id}
                  to="/courses/$slug"
                  params={{ slug: c.slug }}
                  onClick={() => { setOpen(false); setQ(""); }}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-primary-soft"
                >
                  <div
                    className="h-10 w-10 rounded-md bg-cover bg-center shrink-0"
                    style={{ backgroundImage: courseImageWithFallback(c.image_url, categoryImage(c.categories?.slug)) }}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{c.title}</div>
                    {c.categories?.name && <div className="text-xs text-muted-foreground truncate">{c.categories.name}</div>}
                  </div>
                </Link>
              ))}
            </div>
          )}
          {results.posts.length > 0 && (
            <div className="p-2 border-t border-border/60">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Статьи</div>
              {results.posts.map((p: any) => (
                <Link
                  key={p.id}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  onClick={() => { setOpen(false); setQ(""); }}
                  className="block rounded-lg px-2 py-2 hover:bg-primary-soft"
                >
                  <div className="text-sm font-medium truncate">{p.title}</div>
                  {p.excerpt && <div className="text-xs text-muted-foreground line-clamp-1">{p.excerpt}</div>}
                </Link>
              ))}
            </div>
          )}
          {hasResults && (
            <button
              type="button"
              onClick={submit}
              className="w-full border-t border-border/60 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary-soft text-center"
            >
              Показать все результаты
            </button>
          )}
        </div>
      )}
    </div>
  );
}
