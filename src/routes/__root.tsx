import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import { wedding } from "@/config/wedding";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="panel pat-light flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="t-fg font-display text-7xl">404</h1>
        <h2 className="t-fg mt-4 font-display text-xl">Page not found</h2>
        <p className="t-fg2 mt-2 text-sm">The page you are looking for does not exist.</p>
        <div className="mt-6">
          <Link to="/" className="btn-gold inline-flex text-sm">
            Return to invitation
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="panel pat-light flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="t-fg font-display text-xl">Unable to load invitation</h1>
        <p className="t-fg2 mt-2 text-sm">Something went wrong. Please try again or return home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-gold text-sm"
          >
            Try again
          </button>
          <a href="/" className="btn-ghost text-sm">
            Go home
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
      { title: wedding.meta.title },
      { name: "description", content: wedding.meta.description },
      { name: "theme-color", content: "#0c3620" },
      { property: "og:title", content: wedding.meta.ogTitle },
      { property: "og:description", content: wedding.meta.ogDescription },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&family=Scheherazade+New:wght@400;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
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

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
