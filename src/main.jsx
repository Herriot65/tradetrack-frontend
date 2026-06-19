import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { JournalProvider } from "./journals/JournalContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <JournalProvider>
        <App />
      </JournalProvider>
    </AuthProvider>
  </BrowserRouter>
);
