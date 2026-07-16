import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Save, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { adminDocumentsQuery } from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/documents")({
  component: DocumentsAdmin,
});

type Row = {
  id: string;
  title: string;
  doc_type: string;
  file_url: string;
  preview_url: string | null;
  sort_order: number;
  is_published: boolean;
};

const TYPES = [
  { v: "license", l: "Лицензия / аккредитация" },
  { v: "thanks", l: "Благодарность" },
  { v: "charter", l: "Устав / реквизиты" },
  { v: "other", l: "Прочее" },
];

function DocumentsAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery(adminDocumentsQuery);
  const [draft, setDraft] = useState<Partial<Row> | null>(null);

  async function save(row: Partial<Row>) {
    if (!row.title?.trim() || !row.file_url?.trim()) return toast.error("Название и файл обязательны");
    const payload = {
      title: row.title.trim(),
      doc_type: row.doc_type || "license",
      file_url: row.file_url,
      preview_url: row.preview_url || row.file_url,
      sort_order: row.sort_order ?? 0,
      is_published: row.is_published ?? true,
    };
    const { error } = row.id
      ? await supabase.from("org_documents").update(payload).eq("id", row.id)
      : await supabase.from("org_documents").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Сохранено");
    setDraft(null);
    qc.invalidateQueries({ queryKey: ["admin", "org_documents"] });
    qc.invalidateQueries({ queryKey: ["org_documents", "published"] });
  }

  async function remove(id: string) {
    if (!confirm("Удалить документ?")) return;
    const { error } = await supabase.from("org_documents").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin", "org_documents"] });
    qc.invalidateQueries({ queryKey: ["org_documents", "published"] });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">Документы организации</h1>
        <Button onClick={() => setDraft({ title: "", doc_type: "license", file_url: "", sort_order: (data?.length ?? 0) * 10, is_published: true })} className="rounded-full bg-gradient-teal">
          <Plus className="h-4 w-4" /> Добавить
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Лицензии, благодарственные письма и прочие документы для разделов «О компании» и «Сведения».</p>

      {draft && (
        <div className="mt-6 rounded-2xl bg-card p-5 shadow-card border border-primary/30 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <Label>Название *</Label>
              <Input value={draft.title ?? ""} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div>
              <Label>Тип документа</Label>
              <Select value={draft.doc_type ?? "license"} onValueChange={(v) => setDraft({ ...draft, doc_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Порядок</Label>
              <Input type="number" value={draft.sort_order ?? 0} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
            </div>
            <div className="lg:col-span-2">
              <Label>Превью (изображение)</Label>
              <ImageUpload value={draft.preview_url ?? ""} onChange={(v) => setDraft({ ...draft, preview_url: v, file_url: draft.file_url || v })} />
            </div>
            <div className="lg:col-span-2">
              <Label>Файл документа (URL — PDF или изображение)</Label>
              <Input value={draft.file_url ?? ""} onChange={(e) => setDraft({ ...draft, file_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={draft.is_published ?? true} onChange={(e) => setDraft({ ...draft, is_published: e.target.checked })} className="h-4 w-4 accent-primary" />
                Опубликован
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => save(draft)} className="rounded-full bg-gradient-teal"><Save className="h-4 w-4" /> Сохранить</Button>
            <Button variant="outline" onClick={() => setDraft(null)} className="rounded-full">Отмена</Button>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {(data ?? []).map((d) => (
          <article key={d.id} className="rounded-2xl bg-card p-4 shadow-soft border border-border/40 flex gap-4">
            {d.preview_url ? (
              <img src={d.preview_url} alt={d.title} className="h-24 w-20 rounded-lg object-cover shrink-0 border border-border/40" />
            ) : (
              <div className="h-24 w-20 rounded-lg bg-muted shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold line-clamp-2">{d.title}</div>
              <div className="text-xs text-muted-foreground mt-1">{TYPES.find((t) => t.v === d.doc_type)?.l ?? d.doc_type}</div>
              <a href={d.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                Открыть <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <Button size="sm" variant="outline" onClick={() => setDraft(d)}>Изменить</Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(d.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </article>
        ))}
        {(data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Документов пока нет.</p>}
      </div>
    </div>
  );
}
