import "@fontsource-variable/manrope";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { db } from "@/integrations/database/client";
import { Toaster } from "@/components/ui/sonner";
import { YandexMetrika } from "@/components/site/YandexMetrika";
import { PromoPopup } from "@/components/site/PromoPopup";
import { CookieBanner } from "@/components/site/CookieBanner";
import logoAsset from "@/assets/cpr-logo.png";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Страница не найдена</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Возможно, вы перешли по устаревшей ссылке.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-gradient-teal px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Страница не загрузилась
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Что-то пошло не так. Попробуйте обновить или вернитесь на главную.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-gradient-teal px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Попробовать снова
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground"
          >
            На главную
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ЦПР Партнер — обучение охране труда и рабочим профессиям" },
      {
        name: "description",
        content:
          "Учебный центр ЦПР Партнер: охрана труда, работы на высоте, электро- и пожарная безопасность, рабочие профессии. Лицензия, аккредитации Минтруда, МЧС, Гостехнадзора. Очно и дистанционно.",
      },
      { property: "og:site_name", content: "ЦПР Партнер" },
      { property: "og:title", content: "ЦПР Партнер — обучение охране труда и рабочим профессиям" },
      {
        property: "og:description",
        content: "Курсы и удостоверения по охране труда, рабочим профессиям и спецтехнике.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: logoAsset },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "ЦПР Партнер — обучение охране труда и рабочим профессиям" },
      {
        name: "twitter:description",
        content: "Курсы и удостоверения по охране труда, рабочим профессиям и спецтехнике.",
      },
      { name: "twitter:image", content: logoAsset },
      { name: "theme-color", content: "#087f9f" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png", sizes: "56x56" },
      { rel: "apple-touch-icon", href: logoAsset },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = db.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <PromoPopup />
      <CookieBanner />
      <Toaster richColors position="top-right" />
      <YandexMetrika />
    </QueryClientProvider>
  );
}
