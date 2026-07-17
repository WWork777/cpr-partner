import { queryOptions } from "@tanstack/react-query";
import { db } from "@/integrations/database/client";

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await db
      .from("categories")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const publishedCoursesQuery = queryOptions({
  queryKey: ["courses", "published"],
  queryFn: async () => {
    const { data, error } = await db
      .from("courses")
      .select("*, categories(name, slug)")
      .eq("published", true)
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const courseBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["course", slug],
    queryFn: async () => {
      const { data, error } = await db
        .from("courses")
        .select("*, categories(name, slug)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const adminCoursesQuery = queryOptions({
  queryKey: ["admin", "courses"],
  queryFn: async () => {
    const { data, error } = await db
      .from("courses")
      .select("*, categories(name)")
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const adminApplicationsQuery = queryOptions({
  queryKey: ["admin", "applications"],
  queryFn: async () => {
    const { data, error } = await db
      .from("applications")
      .select("*, courses(title, slug)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const publishedPostsQuery = queryOptions({
  queryKey: ["blog", "published"],
  queryFn: async () => {
    const { data, error } = await db
      .from("blog_posts")
      .select("id, slug, title, excerpt, cover_url, tags, published_at")
      .eq("published", true)
      .order("published_at", { ascending: false, nullsFirst: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const postBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["blog", "post", slug],
    queryFn: async () => {
      const { data, error } = await db
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const adminPostsQuery = queryOptions({
  queryKey: ["admin", "blog"],
  queryFn: async () => {
    const { data, error } = await db
      .from("blog_posts")
      .select("id, slug, title, published, published_at, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const teachersQuery = queryOptions({
  queryKey: ["teachers", "published"],
  queryFn: async () => {
    const { data, error } = await db
      .from("teachers")
      .select("*")
      .eq("is_published", true)
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const adminTeachersQuery = queryOptions({
  queryKey: ["admin", "teachers"],
  queryFn: async () => {
    const { data, error } = await db
      .from("teachers")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const orgDocumentsQuery = queryOptions({
  queryKey: ["org_documents", "published"],
  queryFn: async () => {
    const { data, error } = await db
      .from("org_documents")
      .select("*")
      .eq("is_published", true)
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const adminDocumentsQuery = queryOptions({
  queryKey: ["admin", "org_documents"],
  queryFn: async () => {
    const { data, error } = await db
      .from("org_documents")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const galleryQuery = queryOptions({
  queryKey: ["gallery", "published"],
  queryFn: async () => {
    const { data, error } = await db
      .from("gallery_images")
      .select("*")
      .eq("is_published", true)
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const adminGalleryQuery = queryOptions({
  queryKey: ["admin", "gallery"],
  queryFn: async () => {
    const { data, error } = await db
      .from("gallery_images")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const documentSamplesQuery = queryOptions({
  queryKey: ["document_samples"],
  queryFn: async () => {
    const { data, error } = await db.from("document_samples").select("*");
    if (error) throw error;
    return data ?? [];
  },
});

export const publicScheduleQuery = queryOptions({
  queryKey: ["public_schedule"],
  queryFn: async () => {
    const { data, error } = await db
      .from("public_schedule")
      .select("*")
      .eq("is_published", true)
      .order("city")
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const adminScheduleQuery = queryOptions({
  queryKey: ["admin", "public_schedule"],
  queryFn: async () => {
    const { data, error } = await db
      .from("public_schedule")
      .select("*")
      .order("city")
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export type CourseFeature = { title: string; text: string };
export type CourseStep = { title: string; text: string };
export type CourseFaq = { question: string; answer: string };
