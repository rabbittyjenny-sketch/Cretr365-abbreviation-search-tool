import "@fontsource-variable/anuphan";
import "@fontsource-variable/fraunces/full.css";
import "@fontsource/mali/400.css";
import "@fontsource/mali/600.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
