import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import "./app/styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Moviqo root element was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
