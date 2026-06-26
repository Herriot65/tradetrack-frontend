import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { JournalProvider } from "./journals/JournalContext";
import { TooltipProvider } from "./components/ui/tooltip";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <TooltipProvider delayDuration={400}>
      <AuthProvider>
        <JournalProvider>
          <App />
        </JournalProvider>
      </AuthProvider>
    </TooltipProvider>
  </BrowserRouter>
);
