import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { documentSamplesQuery } from "@/lib/queries";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/doc-samples")({
  component: DocSamplesAdmin,
});

const TYPES: { key: string; label: string }[] = [
  { key: "svidetelstvo", label: "Свидетельство об обучении" },
  { key: "udostoverenie", label: "Удостоверение о повышении квалификации" },
  { key: "diplom", label: "Диплом о профессиональной переподготовке" },
];

type Sample = {
  doc_type: string;
  title: string;
  file_url: string;
  preview_url: string | null;
  description: string | null;
};

function DocSamplesAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery(documentSamplesQuery);
  const [rows, setRows] = useState<Record<string, Sample>>({});

  useEffect(() => {
    if (!data) return;
    const map: Record<string, Sample> = {};
    for (const t of TYPES) {
      const existing = data.find((d) => d.doc_type === t.key);
      map[t.key] = existing ?? { doc_type: t.key, title: t.label, file_url: "", preview_url: null, description: null };
    }
    setRows(map);
  }, [data]);

  async function save(key: string) {
    const row = rows[key];
    if (!row.file_url && !row.preview_url) return toast.error("Загрузите превью или укажите ссылку на файл");
    const payload = {
      doc_type: row.doc_type,
      title: row.title.trim() || TYPES.find((t) => t.key === key)?.label || key,
      file_url: row.file_url || row.preview_url || "",
      preview_url: row.preview_url || null,
      description: row.description || null,
    };
    const { error } = await supabase.from("document_samples").upsert(payload, { onConflict: "doc_type" });
    if (error) return toast.error(error.message);
    toast.success("Сохранено");
    qc.invalidateQueries({ queryKey: ["document_samples"] });
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold">Образцы документов</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Единые образцы документов, которые показываются на странице курса, если у курса не задан собственный.
      </p>
      <div className="mt-6 space-y-6">
        {TYPES.map((t) => {
          const row = rows[t.key];
          if (!row) return null;
          return (
            <div key={t.key} className="rounded-2xl bg-card p-5 shadow-soft border border-border/40">
              <div className="text-xs font-bold uppercase tracking-widest text-primary">{t.label}</div>
              <div className="grid gap-4 lg:grid-cols-2 mt-4">
                <div>
                  <Label>Название</Label>
                  <Input value={row.title} onChange={(e) => setRows({ ...rows, [t.key]: { ...row, title: e.target.value } })} />
                </div>
                <div>
                  <Label>Ссылка на файл (PDF или изображение)</Label>
                  <Input value={row.file_url} onChange={(e) => setRows({ ...rows, [t.key]: { ...row, file_url: e.target.value } })} placeholder="/__l5e/... или https://..." />
                </div>
                <div className="lg:col-span-2">
                  <Label>Превью (изображение)</Label>
                  <ImageUpload value={row.preview_url ?? ""} onChange={(v) => setRows({ ...rows, [t.key]: { ...row, preview_url: v, file_url: row.file_url || v } })} />
                </div>
                <div className="lg:col-span-2">
                  <Label>Описание</Label>
                  <Textarea rows={3} value={row.description ?? ""} onChange={(e) => setRows({ ...rows, [t.key]: { ...row, description: e.target.value } })} />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => save(t.key)} className="rounded-full bg-gradient-teal"><Save className="h-4 w-4" /> Сохранить</Button>
                {row.file_url && (
                  <a href={row.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary self-center">
                    Открыть файл <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
