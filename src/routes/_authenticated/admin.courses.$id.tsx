import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { db } from "@/integrations/database/client";
import {
  categoriesQuery,
  type CourseFeature,
  type CourseStep,
  type CourseFaq,
} from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ItemListEditor } from "@/components/admin/ItemListEditor";
import { slugify } from "@/lib/slugify";

export const Route = createFileRoute("/_authenticated/admin/courses/$id")({
  component: EditCourse,
});

type Form = {
  slug: string;
  title: string;
  category_id: string | null;
  short_description: string;
  description: string;
  price: string;
  price_note: string;
  duration: string;
  start_date: string;
  format: string;
  city: string;
  image_url: string;
  document_sample_url: string;
  document_description: string;
  program_theory: string;
  program_practice: string;
  features: CourseFeature[];
  steps: CourseStep[];
  faqs: CourseFaq[];
  meta_title: string;
  meta_description: string;
  published: boolean;
  sort_order: number;
};

type CourseListKeys = "title" | "text" | "question" | "answer";

function asText(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function normalizeCourseList(value: unknown, primaryKey: CourseListKeys, secondaryKey: CourseListKeys) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") {
        return { [primaryKey]: item, [secondaryKey]: "" };
      }
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      return {
        [primaryKey]: asText(record[primaryKey]),
        [secondaryKey]: asText(record[secondaryKey]),
      };
    })
    .filter((item): item is Record<CourseListKeys, string> =>
      !!item && (!!item[primaryKey].trim() || !!item[secondaryKey].trim()),
    );
}

const empty: Form = {
  slug: "",
  title: "",
  category_id: null,
  short_description: "",
  description: "",
  price: "",
  price_note: "",
  duration: "",
  start_date: "",
  format: "",
  city: "",
  image_url: "",
  document_sample_url: "",
  document_description: "",
  program_theory: "",
  program_practice: "",
  features: [],
  steps: [],
  faqs: [],
  meta_title: "",
  meta_description: "",
  published: true,
  sort_order: 0,
};

function EditCourse() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const categories = useQuery(categoriesQuery);
  const [form, setForm] = useState<Form>(empty);
  const [autoSlug, setAutoSlug] = useState(isNew);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        const { data, error } = await db.from("courses").select("*").eq("id", id).maybeSingle();
        if (error || !data) {
          toast.error(error?.message ?? "Курс не найден");
          return;
        }
        setForm({
          slug: data.slug,
          title: data.title,
          category_id: data.category_id,
          short_description: data.short_description ?? "",
          description: data.description ?? "",
          price: data.price?.toString() ?? "",
          price_note: data.price_note ?? "",
          duration: data.duration ?? "",
          start_date: data.start_date ?? "",
          format: data.format ?? "",
          city: data.city ?? "",
          image_url: data.image_url ?? "",
          document_sample_url:
            (data as { document_sample_url?: string | null }).document_sample_url ?? "",
          document_description:
            (data as { document_description?: string | null }).document_description ?? "",
          program_theory: data.program_theory ?? "",
          program_practice: data.program_practice ?? "",
          features: normalizeCourseList(data.features, "title", "text") as CourseFeature[],
          steps: normalizeCourseList(data.steps, "title", "text") as CourseStep[],
          faqs: normalizeCourseList(data.faqs, "question", "answer") as CourseFaq[],
          meta_title: (data as { meta_title?: string | null }).meta_title ?? "",
          meta_description: (data as { meta_description?: string | null }).meta_description ?? "",
          published: data.published,
          sort_order: data.sort_order,
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Не удалось загрузить курс");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew]);

  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const title = form.title.trim();
    const slug = form.slug.trim();
    if (!title || !slug) {
      toast.error("Заполните название и slug курса");
      return;
    }
    const price = form.price.trim() ? Number(form.price) : null;
    if (price !== null && !Number.isFinite(price)) {
      toast.error("Проверьте цену курса");
      return;
    }
    setSaving(true);
    try {
      const features = normalizeCourseList(form.features, "title", "text");
      const steps = normalizeCourseList(form.steps, "title", "text");
      const faqs = normalizeCourseList(form.faqs, "question", "answer");
      const payload = {
        slug,
        title,
        category_id: form.category_id,
        short_description: form.short_description || null,
        description: form.description || null,
        price,
        price_note: form.price_note || null,
        duration: form.duration || null,
        start_date: form.start_date || null,
        format: form.format || null,
        city: form.city || null,
        image_url: form.image_url || null,
        document_sample_url: form.document_sample_url || null,
        document_description: form.document_description || null,
        program_theory: form.program_theory || null,
        program_practice: form.program_practice || null,
        features,
        steps,
        faqs,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
        published: form.published,
        sort_order: form.sort_order,
      };
      if (isNew) {
        const { data, error } = await db.from("courses").insert(payload).select("id").single();
        if (error) return toast.error(error.message);
        toast.success("Курс создан");
        qc.invalidateQueries({ queryKey: ["admin", "courses"] });
        qc.invalidateQueries({ queryKey: ["courses", "published"] });
        navigate({ to: "/admin/courses/$id", params: { id: data.id } });
      } else {
        const { error } = await db.from("courses").update(payload).eq("id", id);
        if (error) return toast.error(error.message);
        toast.success("Сохранено");
        qc.invalidateQueries({ queryKey: ["admin", "courses"] });
        qc.invalidateQueries({ queryKey: ["courses", "published"] });
        qc.invalidateQueries({ queryKey: ["course", form.slug] });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить курс");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-muted-foreground">Загрузка…</div>;

  return (
    <div>
      <Link
        to="/admin/courses"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ChevronLeft className="h-4 w-4" /> К списку
      </Link>
      <h1 className="mt-2 text-2xl md:text-3xl font-bold">
        {isNew ? "Новый курс" : "Редактирование курса"}
      </h1>

      <form onSubmit={save} className="mt-6">
        <Tabs defaultValue="main" className="w-full">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="main">Основное</TabsTrigger>
            <TabsTrigger value="program">Программа</TabsTrigger>
            <TabsTrigger value="benefits">Преимущества и шаги</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="publish">Публикация</TabsTrigger>
          </TabsList>

          <TabsContent value="main" className="mt-6 grid gap-6 lg:grid-cols-2">
            <Field label="Название" required>
              <Input
                value={form.title}
                onChange={(e) => {
                  const t = e.target.value;
                  set("title", t);
                  if (autoSlug) set("slug", slugify(t));
                }}
                required
              />
            </Field>
            <Field label="Slug (URL)" required hint="генерируется из названия — можно править">
              <Input
                value={form.slug}
                onChange={(e) => {
                  setAutoSlug(false);
                  set("slug", slugify(e.target.value));
                }}
                required
              />
            </Field>

            <Field label="Категория">
              <Select
                value={form.category_id ?? ""}
                onValueChange={(v) => set("category_id", v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Без категории" />
                </SelectTrigger>
                <SelectContent>
                  {(categories.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Картинка курса" className="lg:col-span-2">
              <ImageUpload value={form.image_url} onChange={(v) => set("image_url", v)} />
            </Field>
            <Field
              label="Образец выдаваемого документа"
              className="lg:col-span-2"
              hint="свидетельство / удостоверение / диплом — фото или скан"
            >
              <ImageUpload
                value={form.document_sample_url}
                onChange={(v) => set("document_sample_url", v)}
              />
            </Field>
            <Field
              label="Результат обучения (что получит слушатель)"
              className="lg:col-span-2"
              hint="описание блока «Документ по итогам»: какой документ выдаётся, какие права/допуски даёт, срок действия"
            >
              <Textarea
                value={form.document_description}
                onChange={(e) => set("document_description", e.target.value)}
                rows={3}
                placeholder="После успешного завершения обучения выдаётся удостоверение установленного образца со сроком действия 5 лет. Даёт право работы…"
              />
            </Field>
            <Field label="Краткое описание" className="lg:col-span-2">
              <Textarea
                value={form.short_description}
                onChange={(e) => set("short_description", e.target.value)}
                rows={2}
              />
            </Field>
            <Field label="Полное описание" className="lg:col-span-2">
              <Textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={5}
              />
            </Field>
            <Field label="Цена (₽)">
              <Input
                type="number"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />
            </Field>
            <Field label="Подпись к цене">
              <Input
                value={form.price_note}
                onChange={(e) => set("price_note", e.target.value)}
                placeholder="например, «от»"
              />
            </Field>
            <Field label="Длительность">
              <Input
                value={form.duration}
                onChange={(e) => set("duration", e.target.value)}
                placeholder="3 месяца"
              />
            </Field>
            <Field label="Дата старта">
              <Input
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
                placeholder="20 марта / Ежедневно"
              />
            </Field>
            <Field label="Формат">
              <Input
                value={form.format}
                onChange={(e) => set("format", e.target.value)}
                placeholder="Очно / Онлайн"
              />
            </Field>
            <Field label="Город">
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
          </TabsContent>

          <TabsContent value="program" className="mt-6 grid gap-6">
            <Field label="Программа — теория">
              <Textarea
                value={form.program_theory}
                onChange={(e) => set("program_theory", e.target.value)}
                rows={6}
              />
            </Field>
            <Field label="Программа — практика">
              <Textarea
                value={form.program_practice}
                onChange={(e) => set("program_practice", e.target.value)}
                rows={6}
              />
            </Field>
          </TabsContent>

          <TabsContent value="benefits" className="mt-6 grid gap-6">
            <Field label="Преимущества курса" hint="Что входит в плюсы обучения">
              <ItemListEditor
                items={form.features}
                onChange={(v) => set("features", v)}
                titleKey="title"
                textKey="text"
                addLabel="Добавить преимущество"
                titlePlaceholder="Заголовок преимущества"
                textPlaceholder="Описание (необязательно)"
                emptyTemplate={{ title: "", text: "" }}
              />
            </Field>
            <Field label="Шаги обучения" hint="Этапы прохождения курса по порядку">
              <ItemListEditor
                items={form.steps}
                onChange={(v) => set("steps", v)}
                titleKey="title"
                textKey="text"
                addLabel="Добавить шаг"
                titlePlaceholder="Название шага"
                textPlaceholder="Что происходит на этом шаге"
                emptyTemplate={{ title: "", text: "" }}
              />
            </Field>
          </TabsContent>

          <TabsContent value="faq" className="mt-6">
            <Field
              label="Частые вопросы"
              hint="Отображаются на странице курса и индексируются Google как FAQ-сниппет"
            >
              <ItemListEditor
                items={form.faqs}
                onChange={(v) => set("faqs", v)}
                titleKey="question"
                textKey="answer"
                addLabel="Добавить вопрос"
                titlePlaceholder="Вопрос"
                textPlaceholder="Ответ"
                emptyTemplate={{ question: "", answer: "" }}
              />
            </Field>
          </TabsContent>

          <TabsContent value="seo" className="mt-6 grid gap-6">
            <Field
              label="Meta Title"
              hint={`Заголовок для Google. Рекомендуется до 60 символов. Текущая длина: ${form.meta_title.length}`}
            >
              <Input
                value={form.meta_title}
                onChange={(e) => set("meta_title", e.target.value)}
                maxLength={120}
                placeholder={form.title}
              />
            </Field>
            <Field
              label="Meta Description"
              hint={`Описание в выдаче Google. Рекомендуется до 160 символов. Текущая длина: ${form.meta_description.length}`}
            >
              <Textarea
                value={form.meta_description}
                onChange={(e) => set("meta_description", e.target.value)}
                rows={3}
                maxLength={300}
                placeholder={form.short_description}
              />
            </Field>
          </TabsContent>

          <TabsContent value="publish" className="mt-6 grid gap-6 lg:grid-cols-2">
            <Field label="Порядок">
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => set("sort_order", Number(e.target.value))}
              />
            </Field>
            <Field label="Публикация">
              <label className="inline-flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => set("published", e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Опубликован
              </label>
            </Field>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex gap-3 sticky bottom-0 bg-background/95 backdrop-blur py-4 border-t border-border/60">
          <Button type="submit" disabled={saving} className="rounded-full bg-gradient-teal">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Сохраняем…" : "Сохранить"}
          </Button>
          <Button asChild type="button" variant="outline" className="rounded-full">
            <Link to="/admin/courses">Отмена</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
  className,
  required,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}
