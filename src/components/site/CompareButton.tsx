import { Link } from "@tanstack/react-router";
import { GitCompareArrows, X } from "lucide-react";
import { clearCompare, useCompare } from "@/lib/compare-store";

export function CompareBar() {
  const list = useCompare();
  if (list.length === 0) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full bg-card shadow-card border border-border/60 px-4 py-2">
      <GitCompareArrows className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium">Сравнение: {list.length}</span>
      <Link to="/compare" className="text-sm font-semibold text-primary hover:underline">
        Открыть
      </Link>
      <button onClick={clearCompare} className="text-muted-foreground hover:text-foreground" aria-label="Очистить">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
