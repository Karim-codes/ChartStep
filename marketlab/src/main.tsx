import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter";
import "./components/ui/ui.css";
import App from "./App";
import "./styles.css";
import "./workspace-design.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
