import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary
        fallback={
          <div className="min-h-screen bg-slate-950 p-4 font-mono text-sm text-rose-200">
            <p className="font-medium">Could not start the world pack</p>
            <p className="mt-2 text-xs text-rose-300/80">Open DevTools (Console) for the error, then reload.</p>
          </div>
        }
      >
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}
