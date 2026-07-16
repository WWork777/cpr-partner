import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

type Item = Record<string, string>;

export function ItemListEditor<T extends Item>({
  items,
  onChange,
  addLabel,
  titleKey,
  textKey,
  titlePlaceholder,
  textPlaceholder,
  emptyTemplate,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  addLabel: string;
  titleKey: keyof T & string;
  textKey: keyof T & string;
  titlePlaceholder: string;
  textPlaceholder: string;
  emptyTemplate: T;
}) {
  function update(i: number, patch: Partial<T>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...items, { ...emptyTemplate }]);
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = items.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground text-center">
          Пока пусто. Нажмите «{addLabel}», чтобы добавить.
        </div>
      )}
      {items.map((it, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {i + 1}
            </div>
            <Input
              value={it[titleKey] ?? ""}
              onChange={(e) => update(i, { [titleKey]: e.target.value } as Partial<T>)}
              placeholder={titlePlaceholder}
              className="flex-1"
            />
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => move(i, -1)} disabled={i === 0}>↑</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => move(i, 1)} disabled={i === items.length - 1}>↓</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Textarea
            value={it[textKey] ?? ""}
            onChange={(e) => update(i, { [textKey]: e.target.value } as Partial<T>)}
            placeholder={textPlaceholder}
            rows={2}
          />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="gap-1.5">
        <Plus className="h-4 w-4" /> {addLabel}
      </Button>
    </div>
  );
}
