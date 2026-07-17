import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { db } from "@/integrations/database/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Файл больше 8 МБ");
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const up = await db.storage
        .from("course-images")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (up.error) throw up.error;
      const signed = await db.storage
        .from("course-images")
        .createSignedUrl(path, TEN_YEARS);
      if (signed.error) throw signed.error;
      onChange(signed.data.signedUrl);
      toast.success("Картинка загружена");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось загрузить");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        {value ? (
          <div className="relative h-24 w-36 rounded-lg overflow-hidden bg-muted shrink-0">
            <img src={value} alt="Превью" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              aria-label="Убрать"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="h-24 w-36 rounded-lg border-2 border-dashed border-border bg-muted/40 flex items-center justify-center text-xs text-muted-foreground shrink-0">
            Нет картинки
          </div>
        )}
        <div className="flex-1 space-y-2">
          <input
            ref={ref}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handle}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => ref.current?.click()}
            disabled={busy}
            className="rounded-full"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Загрузить файл
          </Button>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="или вставьте URL"
            className="text-xs"
          />
        </div>
      </div>
    </div>
  );
}
