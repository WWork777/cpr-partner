export const PERMISSION_KEYS = [
  "applications",
  "courses",
  "schedules",
  "site_schedule",
  "categories",
  "teachers",
  "documents",
  "doc_samples",
  "gallery",
  "banners",
  "promocodes",
  "blog",
  "certificates",
  "reviews",
  "audit",
  "settings",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  applications: "Заявки",
  courses: "Курсы",
  schedules: "Расписание курсов",
  site_schedule: "Расписание сайта",
  categories: "Категории",
  teachers: "Преподаватели",
  documents: "Документы организации",
  doc_samples: "Образцы документов",
  gallery: "Галерея",
  banners: "Баннеры",
  promocodes: "Промокоды",
  blog: "Блог",
  certificates: "Удостоверения",
  reviews: "Отзывы",
  audit: "История",
  settings: "Настройки",
};

export const DEFAULT_MANAGER_PERMISSIONS: PermissionKey[] = [
  "applications",
  "courses",
  "schedules",
  "site_schedule",
];
