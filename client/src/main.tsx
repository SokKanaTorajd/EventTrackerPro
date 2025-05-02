import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/ui/theme-provider";
import App from "./App";
import "./index.css";
import { AuthProvider } from "@/lib/auth";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="event-manager-theme">
    <AuthProvider>
      <App />
    </AuthProvider>
  </ThemeProvider>
);
