import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./lib/auth-context";
import { AdminAuthProvider } from "./lib/admin-auth-context";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <AdminAuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AdminAuthProvider>
    </AuthProvider>
  </StrictMode>,
);
