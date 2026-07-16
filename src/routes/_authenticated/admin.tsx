import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, GraduationCap, FolderTree, Inbox, LogOut, FileText, Settings, ShieldCheck, Image as ImageIcon, Ticket, CalendarRange, History, Users, FileBadge, Images, CalendarDays, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/cpr-logo.png";


export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      setEmail(userData.user?.email ?? "");
      if (!userData.user) return setIsAdmin(false);
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin",
      });
      if (error) {
        console.error(error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }
    })();
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Загрузка…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center rounded-3xl bg-card p-8 shadow-card">
          <h1 className="text-2xl font-bold">Нет доступа</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            У аккаунта <b>{email}</b> нет роли администратора. Чтобы выдать роль, выполните в Cloud
            запрос:
          </p>
          <pre className="mt-4 rounded-lg bg-muted p-3 text-left text-xs overflow-auto">
{`INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users
WHERE email = '${email || "ваш@email"}';`}
          </pre>
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
      <aside className="border-r border-border/60 bg-card p-4 lg:p-6 lg:min-h-screen">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoAsset} alt="ЦПР Партнер" className="h-9 w-auto" />
          <div className="text-sm font-bold text-muted-foreground">Админка</div>
        </Link>

        <nav className="mt-8 space-y-1 text-sm font-medium">
          <NavLink to="/admin" icon={<LayoutDashboard className="h-4 w-4" />}>Дашборд</NavLink>
          <NavLink to="/admin/applications" icon={<Inbox className="h-4 w-4" />}>Заявки</NavLink>
          <NavLink to="/admin/courses" icon={<GraduationCap className="h-4 w-4" />}>Курсы</NavLink>
          <NavLink to="/admin/schedules" icon={<CalendarRange className="h-4 w-4" />}>Расписание (курсы)</NavLink>
          <NavLink to="/admin/site-schedule" icon={<CalendarDays className="h-4 w-4" />}>Расписание сайта</NavLink>
          <NavLink to="/admin/categories" icon={<FolderTree className="h-4 w-4" />}>Категории</NavLink>
          <NavLink to="/admin/teachers" icon={<Users className="h-4 w-4" />}>Преподаватели</NavLink>
          <NavLink to="/admin/documents" icon={<FileBadge className="h-4 w-4" />}>Документы организации</NavLink>
          <NavLink to="/admin/doc-samples" icon={<Award className="h-4 w-4" />}>Образцы документов</NavLink>
          <NavLink to="/admin/gallery" icon={<Images className="h-4 w-4" />}>Галерея</NavLink>
          <NavLink to="/admin/banners" icon={<ImageIcon className="h-4 w-4" />}>Баннеры</NavLink>
          <NavLink to="/admin/promocodes" icon={<Ticket className="h-4 w-4" />}>Промокоды</NavLink>
          <NavLink to="/admin/blog" icon={<FileText className="h-4 w-4" />}>Блог</NavLink>
          <NavLink to="/admin/certificates" icon={<ShieldCheck className="h-4 w-4" />}>Удостоверения</NavLink>
          <NavLink to="/admin/audit" icon={<History className="h-4 w-4" />}>История</NavLink>
          <NavLink to="/admin/settings" icon={<Settings className="h-4 w-4" />}>Настройки</NavLink>
        </nav>
        <div className="mt-8 pt-4 border-t border-border/60">
          <div className="text-xs text-muted-foreground truncate">{email}</div>
          <Button onClick={signOut} variant="ghost" size="sm" className="mt-2 w-full justify-start">
            <LogOut className="h-4 w-4" /> Выйти
          </Button>
        </div>
      </aside>
      <main className="p-6 lg:p-10 max-w-6xl">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
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
