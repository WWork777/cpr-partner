import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, GraduationCap, FolderTree, Inbox, LogOut, FileText, Settings, ShieldCheck, Image as ImageIcon, Ticket, CalendarRange, History, Users, FileBadge, Images, CalendarDays, Award } from "lucide-react";
import { db } from "@/integrations/database/client";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/cpr-logo.png";
import type { PermissionKey } from "@/lib/permissions";


export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<{ id: string; email: string; role: string; permissions?: string[] } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const { data: userData } = await db.auth.getUser();
        setUser(userData.user);
        setEmail(userData.user?.email ?? "");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const isStaff = !!user && (user.role === "admin" || user.role === "manager");
  const can = (required: PermissionKey | PermissionKey[]) => {
    if (user?.role === "admin") return true;
    const permissions = new Set(user?.permissions ?? []);
    return (Array.isArray(required) ? required : [required]).every((permission) => permissions.has(permission));
  };

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await db.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (!loaded) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Загрузка…</div>;
  }

  const required = requiredPermission(location.pathname);
  if (!isStaff || (required.kind === "permission" && !can(required.value)) || (required.kind === "admin" && user?.role !== "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center rounded-3xl bg-card p-8 shadow-card">
          <h1 className="text-2xl font-bold">Нет доступа</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            У аккаунта <b>{email}</b> нет прав для этого раздела.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" onClick={signOut} className="rounded-full">
              Выйти
            </Button>
            <Button asChild className="rounded-full bg-gradient-teal">
              <Link to="/">На сайт</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[260px_1fr] bg-background">
      <aside className="border-r border-border/60 bg-card p-4 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto lg:p-6">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoAsset} alt="ЦПР Партнер" className="h-9 w-auto" />
          <div className="text-sm font-bold text-muted-foreground">Админка</div>
        </Link>

        <nav className="mt-8 space-y-1 text-sm font-medium">
          <NavLink to="/admin" required={["applications", "courses"]} can={can} icon={<LayoutDashboard className="h-4 w-4" />}>Дашборд</NavLink>
          <NavLink to="/admin/applications" required="applications" can={can} icon={<Inbox className="h-4 w-4" />}>Заявки</NavLink>
          <NavLink to="/admin/courses" required="courses" can={can} icon={<GraduationCap className="h-4 w-4" />}>Курсы</NavLink>
          <NavLink to="/admin/schedules" required="schedules" can={can} icon={<CalendarRange className="h-4 w-4" />}>Расписание (курсы)</NavLink>
          <NavLink to="/admin/site-schedule" required="site_schedule" can={can} icon={<CalendarDays className="h-4 w-4" />}>Расписание сайта</NavLink>
          <NavLink to="/admin/categories" required="categories" can={can} icon={<FolderTree className="h-4 w-4" />}>Направления</NavLink>
          <NavLink to="/admin/teachers" required="teachers" can={can} icon={<Users className="h-4 w-4" />}>Преподаватели</NavLink>
          <NavLink to="/admin/documents" required="documents" can={can} icon={<FileBadge className="h-4 w-4" />}>Документы организации</NavLink>
          <NavLink to="/admin/doc-samples" required="doc_samples" can={can} icon={<Award className="h-4 w-4" />}>Образцы документов</NavLink>
          <NavLink to="/admin/gallery" required="gallery" can={can} icon={<Images className="h-4 w-4" />}>Галерея</NavLink>
          <NavLink to="/admin/banners" required="banners" can={can} icon={<ImageIcon className="h-4 w-4" />}>Баннеры</NavLink>
          <NavLink to="/admin/promocodes" required="promocodes" can={can} icon={<Ticket className="h-4 w-4" />}>Промокоды</NavLink>
          <NavLink to="/admin/blog" required="blog" can={can} icon={<FileText className="h-4 w-4" />}>Блог</NavLink>
          <NavLink to="/admin/certificates" required="certificates" can={can} icon={<ShieldCheck className="h-4 w-4" />}>Удостоверения</NavLink>
          <NavLink to="/admin/reviews" required="reviews" can={can} icon={<ShieldCheck className="h-4 w-4" />}>Отзывы</NavLink>
          <NavLink to="/admin/audit" required="audit" can={can} icon={<History className="h-4 w-4" />}>История</NavLink>
          <NavLink to="/admin/settings" required="settings" can={can} icon={<Settings className="h-4 w-4" />}>Настройки</NavLink>
          {user?.role === "admin" && <NavLink to="/admin/users" icon={<Users className="h-4 w-4" />}>Пользователи</NavLink>}
        </nav>
        <div className="mt-8 pt-4 border-t border-border/60">
          <div className="text-xs text-muted-foreground truncate">{email}</div>
          <Button onClick={signOut} variant="ghost" size="sm" className="mt-2 w-full justify-start">
            <LogOut className="h-4 w-4" /> Выйти
          </Button>
        </div>
      </aside>
      <main className="min-w-0 p-6 lg:p-10 max-w-6xl">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({
  to,
  icon,
  children,
  required,
  can,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  required?: PermissionKey | PermissionKey[];
  can?: (required: PermissionKey | PermissionKey[]) => boolean;
}) {
  if (required && can && !can(required)) return null;
  return (
    <Link
      to={to as "/admin"}
      activeOptions={{ exact: to === "/admin" }}
      activeProps={{ className: "bg-primary-soft text-primary" }}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-foreground/80 hover:bg-muted"
    >
      {icon} {children}
    </Link>
  );
}

function requiredPermission(pathname: string): { kind: "admin" } | { kind: "permission"; value: PermissionKey | PermissionKey[] } {
  if (pathname === "/admin/users") return { kind: "admin" };
  if (pathname === "/admin" || pathname === "/admin/") return { kind: "permission", value: ["applications", "courses"] };
  const rules: Array<[string, PermissionKey]> = [
    ["/admin/applications", "applications"], ["/admin/courses", "courses"], ["/admin/schedules", "schedules"],
    ["/admin/site-schedule", "site_schedule"], ["/admin/categories", "categories"], ["/admin/teachers", "teachers"],
    ["/admin/documents", "documents"], ["/admin/doc-samples", "doc_samples"], ["/admin/gallery", "gallery"],
    ["/admin/banners", "banners"], ["/admin/promocodes", "promocodes"], ["/admin/blog", "blog"],
    ["/admin/certificates", "certificates"], ["/admin/reviews", "reviews"], ["/admin/audit", "audit"], ["/admin/settings", "settings"],
  ];
  const match = rules.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return match ? { kind: "permission", value: match[1] } : { kind: "permission", value: ["applications", "courses"] };
}
