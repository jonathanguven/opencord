import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "@/app.tsx";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { Toaster } from "@/components/ui/sonner.tsx";
import { TooltipProvider } from "@/components/ui/tooltip.tsx";
import { convex } from "@/lib/convex.ts";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <TooltipProvider>
          {convex ? (
            <ConvexAuthProvider client={convex}>
              <App />
            </ConvexAuthProvider>
          ) : (
            <App missingConvexUrl />
          )}
          <Toaster position="top-right" richColors />
        </TooltipProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
