import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ConvexAuthProvider } from "@convex-dev/auth/react"
import { BrowserRouter } from "react-router-dom"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { Toaster } from "@/components/ui/sonner.tsx"
import { TooltipProvider } from "@/components/ui/tooltip.tsx"
import { convex } from "@/lib/convex.ts"

createRoot(document.getElementById("root")!).render(
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
)
