import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queries/client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { Toaster } from "./components/ui";
import { WindowControls } from "./components/WindowControls";
import { StartupSplash } from "./components/StartupSplash";
import { WINDOWS_TITLEBAR } from "./desktopTitlebar";
import { getLocale } from "./paraglide/runtime.js";
import { reportLocale } from "./api";
import "./tailwind.css";

const locale = getLocale();
document.documentElement.lang = locale;
document.documentElement.dir = "ltr";
reportLocale(locale);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StartupSplash><QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {import.meta.env.DEV && import.meta.env.MODE !== "ui" && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />}
    </QueryClientProvider>
    <Toaster /></StartupSplash>
    {WINDOWS_TITLEBAR && <WindowControls />}
  </StrictMode>,
);
